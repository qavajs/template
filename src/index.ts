import * as testCaseRunner from '@cucumber/cucumber/lib/runtime/test_case_runner';
import * as testStepRunner from '@cucumber/cucumber/lib/runtime/step_runner';
import { PickleStep, Scenario, TestStep, TestStepResultStatus, TimeConversion, GherkinDocument, FeatureChild } from '@cucumber/messages';
import { GherkinStreams } from '@cucumber/gherkin-streams';
import globCb from 'glob';
import { promisify } from 'util';
import { supportCodeLibraryBuilder } from '@cucumber/cucumber';
import { ISupportCodeLibrary } from '@cucumber/cucumber/lib/support_code_library_builder/types';

declare global {
  // eslint-disable-next-line no-var
  var config: any;
}

type ScenarioTemplate = Scenario & {
  templateRegex: RegExp;
  argNames: Array<string>;
};
type GlobFunction = (arg: string) => Promise<Array<string>>;
const glob: GlobFunction = promisify(globCb);

function findStepDefinition(id: string, supportCodeLibrary: ISupportCodeLibrary) {
  return supportCodeLibrary.stepDefinitions.find((definition) => definition.id === id);
}

function parseGherkin(paths: Array<string>): Promise<Array<GherkinDocument>> {
  return new Promise((resolve, reject) => {
    const messageStream = GherkinStreams.fromPaths(paths, {});
    const gherkinDocuments: Array<GherkinDocument> = [];
    messageStream.on('data', (envelope) => {
      if (envelope.gherkinDocument) {
        gherkinDocuments.push(envelope.gherkinDocument);
      }
    });
    messageStream.on('end', () => {
      resolve(gherkinDocuments);
    });
    messageStream.on('error', reject);
  });
}

let templates: Array<ScenarioTemplate>;

async function loadTemplates() {
  if (templates) return templates;
  const templatePaths = await global.config.templates.reduce(
    async (paths: Array<string>, pattern: string) => (await paths).concat(await glob(pattern)),
    [],
  );
  const gherkinDocuments: Array<GherkinDocument> = await parseGherkin(templatePaths);
  // memo templates
  templates = gherkinDocuments
    .reduce((scenarios: Array<FeatureChild>, doc: GherkinDocument) => scenarios.concat(doc.feature ? doc.feature.children : []), [])
    .map((featureChild: FeatureChild) => {
      const scenario = featureChild.scenario;
      if (!scenario) throw new Error('Scenario is not defined');
      return {
        ...scenario,
        templateRegex: new RegExp(`^${scenario.name.replace(/(<.+?>)/g, "'(.+?)'")}$`),
        argNames: scenario.name.match(/(<.+?>)/g) ?? [],
      };
    });
  return templates;
}

async function runTemplate(this: any, templateDefs: Array<ScenarioTemplate>, compositeStep: string) {
  if (this.isSkippingSteps()) {
    return {
      status: TestStepResultStatus.SKIPPED,
      duration: TimeConversion.millisecondsToDuration(0),
    };
  }
  const scenario = templateDefs.find((s) => s.templateRegex.test(compositeStep));
  if (!scenario) {
    return {
      status: TestStepResultStatus.UNDEFINED,
      duration: TimeConversion.millisecondsToDuration(0),
    };
  }
  const matchArgs = compositeStep.match(scenario.templateRegex);
  const args = matchArgs ? matchArgs.splice(1) : [];
  const scenarioArgs = scenario.argNames.map((name, index) => ({ name, value: args[index] }));

  // get step defs
  const stepDefs = supportCodeLibraryBuilder.buildStepDefinitions(templateDefs.map((step) => step.id));
  // execute steps
  for (const step of scenario.steps) {
    const stepDefinition = stepDefs.stepDefinitions.find((sd) => sd.matchesStepName(step.text));
    if (!stepDefinition) {
      return {
        status: TestStepResultStatus.FAILED,
        message: `${step.text} is not defined`,
        duration: TimeConversion.millisecondsToDuration(0),
      };
    }
    step.text = scenarioArgs.reduce((text, arg) => text.replace(new RegExp(arg.name, 'g'), arg.value), step.text);
    const hookParameter = {
      gherkinDocument: this.gherkinDocument,
      pickle: this.pickle,
      testCaseStartedId: this.currentTestCaseStartedId,
    };
    const result = await testStepRunner.run({
      defaultTimeout: this.supportCodeLibrary.defaultTimeout,
      hookParameter,
      step,
      stepDefinition,
      world: this.world,
    } as any);
    if (result.status === TestStepResultStatus.FAILED) return result;
  }
  return {
    status: TestStepResultStatus.PASSED,
    duration: TimeConversion.millisecondsToDuration(0),
  };
}

const originRunStep = testCaseRunner.default.prototype.runStep;
// patch runStep method
testCaseRunner.default.prototype.runStep = async function (this: any, pickleStep: PickleStep, testStep: TestStep) {
  // @ts-ignore
  const stepDefinitions = testStep.stepDefinitionIds.map((stepDefinitionId) => findStepDefinition(stepDefinitionId, this.supportCodeLibrary));
  if (stepDefinitions.length === 0) {
    return runTemplate.apply(this, [await loadTemplates(), pickleStep.text]);
  }
  return originRunStep.apply(this, [pickleStep, testStep]);
};
