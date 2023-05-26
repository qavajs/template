import * as testCaseRunner from '@cucumber/cucumber/lib/runtime/test_case_runner';
import {
    FeatureChild,
    getWorstTestStepResult,
    GherkinDocument,
    PickleStep,
    Scenario,
    TestStep,
    TestStepResult,
    TestStepResultStatus,
    TimeConversion,
} from '@cucumber/messages';
import { glob } from 'glob';
import { supportCodeLibraryBuilder } from '@cucumber/cucumber';
import {
    cloneDeep,
    formatErrorMessage,
    getDuration,
    parseGherkin,
    findStepDefinition, resolveTemplateParams
} from './utils';

declare global {
    // eslint-disable-next-line no-var
    var config: any;
}

type ScenarioTemplate = Scenario & {
    templateRegex: RegExp;
    argNames: Array<string>;
};

const QAVAJS_MULTILINE = 'qavajsMultiline';
const ARG_REGEXP = /(<.+?>)/g;
function getTemplateRegexp(scenarioName: string): RegExp {
    const name = scenarioName
        .replace(/([[\]()^$.?{}*+\\|])/g, '\\$1')
        .replace(ARG_REGEXP, '(.+?)');
    return new RegExp(`^${name}$`)
}
// memo for gherkin documents
let gherkinDocuments: Array<GherkinDocument>;

async function loadTemplates() {
    const templatePaths = await global.config.templates.reduce(
        // @ts-ignore
        async (paths: Array<string>, pattern: string) => (await paths).concat(await glob(pattern)),
        [],
    );
    if (!gherkinDocuments) {
        gherkinDocuments = await parseGherkin(templatePaths);
    }
    // memo templates
    const templates: Array<ScenarioTemplate> = cloneDeep(gherkinDocuments)
        .reduce((scenarios: Array<FeatureChild>, doc: GherkinDocument) => scenarios.concat(doc.feature ? doc.feature.children : []), [])
        .map((featureChild: FeatureChild) => {
            const scenario = featureChild.scenario;
            if (!scenario) throw new Error('Scenario is not defined');
            return {
                ...scenario,
                templateRegex: getTemplateRegexp(scenario.name),
                argNames: scenario.name.match(ARG_REGEXP) ?? [],
            };
        });
    return templates;
}

async function runTemplate(this: any, templateDefs: Array<ScenarioTemplate>, pickleStep: PickleStep, callerSteps: Array<string>): Promise<TestStepResult> {
    if (this.isSkippingSteps()) {
        return {
            status: TestStepResultStatus.SKIPPED,
            duration: TimeConversion.millisecondsToDuration(0),
        };
    }
    if (callerSteps.includes(pickleStep.text)) {
        return {
            status: TestStepResultStatus.FAILED,
            message: `${pickleStep.text} has recursive call`,
            duration: TimeConversion.millisecondsToDuration(0),
        };
    }
    const scenario = templateDefs.find((s) => s.templateRegex.test(pickleStep.text));
    if (!scenario) {
        return {
            status: TestStepResultStatus.UNDEFINED,
            duration: TimeConversion.millisecondsToDuration(0),
        };
    }
    // get scenario arguments
    const matchArgs = pickleStep.text.match(scenario.templateRegex);
    const args = matchArgs ? matchArgs.splice(1) : [];
    const scenarioArgs = scenario.argNames.map((name, index) => ({ name: name.replace(/(^<)|(>$)/g, ''), value: args[index] }));
    // if data table or multiline exist add them to scenario args
    if (pickleStep?.argument?.docString) {
        scenarioArgs.push({
            name: QAVAJS_MULTILINE,
            value: pickleStep?.argument?.docString?.content,
        });
    }
    if (pickleStep?.argument?.dataTable) {
        for (const row of pickleStep.argument.dataTable.rows) {
            scenarioArgs.push({ name: row.cells[0].value as any, value: row.cells[1].value as any });
        }
    }
    // get step defs
    const stepDefs = supportCodeLibraryBuilder.buildStepDefinitions(templateDefs.map((step) => step.id));
    // execute steps
    const stepResults = [];
    for (const step of scenario.steps) {
        const stepTemplateText = step.text;
        step.text = resolveTemplateParams(step.text, scenarioArgs)
        const stepDefinition = stepDefs.stepDefinitions.find((sd) => sd.matchesStepName(step.text));
        if (step.docString) {
            // @ts-ignore
            step.argument = {
                docString: { content: step.docString.content },
            };
            // @ts-ignore
            step.argument.docString.content = resolveTemplateParams(step.argument.docString.content, scenarioArgs)
        }
        if (step.dataTable) {
            const rows = step.dataTable.rows.map(row => ({
                ...row,
                cells: row.cells.map(cell => ({
                    ...cell,
                    value: resolveTemplateParams(cell.value, scenarioArgs)
                }))
            }))
            // @ts-ignore
            step.argument = {
                dataTable: { rows },
            };
        }
        // try to find template
        if (!stepDefinition) {
            // @ts-ignore
            const result = await runTemplate.apply(this, [templateDefs, step, [...callerSteps, pickleStep.text]]);
            if (result.status === TestStepResultStatus.UNDEFINED) {
                return {
                    status: TestStepResultStatus.FAILED,
                    message: `${step.text} is not defined`,
                    duration: TimeConversion.millisecondsToDuration(0),
                };
            }
            stepResults.push(result);
        } else {
            // run BeforeStep hooks
            stepResults.push(...(await this.runStepHooks(this.getBeforeStepHookDefinitions(), step)));
            // run step itself
            let stepResult;
            if (getWorstTestStepResult(stepResults).status !== TestStepResultStatus.FAILED) {
                const hookParameter = {
                    gherkinDocument: this.gherkinDocument,
                    pickle: this.pickle,
                    testCaseStartedId: this.currentTestCaseStartedId,
                };
                stepResult = await this.invokeStep(step, stepDefinition, hookParameter);
                stepResults.push(stepResult);
            }
            // run AfterStep hooks
            const afterStepHookResults = await this.runStepHooks(this.getAfterStepHookDefinitions(), step, stepResult);
            stepResults.push(...afterStepHookResults);
        }
        // finalizing scenario
        const finalStepResult = getWorstTestStepResult(stepResults);
        step.text = stepTemplateText;
        const duration = getDuration(stepResults);
        if (finalStepResult.status === TestStepResultStatus.FAILED) {
            return formatErrorMessage(finalStepResult, step, duration);
        }
    }
    return {
        status: TestStepResultStatus.PASSED,
        duration: getDuration(stepResults),
    };
}

const originRunStep = testCaseRunner.default.prototype.runStep;
// patch runStep method
testCaseRunner.default.prototype.runStep = async function (this: any, pickleStep: PickleStep, testStep: TestStep) {
    // @ts-ignore
    const stepDefinitions = testStep.stepDefinitionIds.map((stepDefinitionId) => findStepDefinition(stepDefinitionId, this.supportCodeLibrary));
    if (stepDefinitions.length === 0) {
        // guard to check if templates property provided
        if (!global.config.templates) {
            console.warn('Property templates is not defined. Make sure you have added it to config file');
            return {
                status: TestStepResultStatus.UNDEFINED,
                duration: TimeConversion.millisecondsToDuration(0),
            };
        }
        const templates = await loadTemplates();
        return runTemplate.apply(this, [templates, pickleStep, []]);
    }
    return originRunStep.apply(this, [pickleStep, testStep]);
};
