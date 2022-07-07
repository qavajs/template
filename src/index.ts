import { Before, supportCodeLibraryBuilder, When } from '@cucumber/cucumber';
import memory from '@qavajs/memory';
import { GherkinDocument, Scenario, FeatureChild } from '@cucumber/messages';
import globCb from 'glob';
import { promisify } from 'util';
import { parseGherkin } from './parseGherkin';

const glob = promisify(globCb);

declare global {
  // eslint-disable-next-line no-var
  var config: any;
}

type ScenarioTemplate = Scenario & { templateRegex: RegExp };

/**
 * Load templates
 */
Before(async function () {
  // parse document
  const templatePaths = await global.config.templates.reduce(
    async (paths: Array<string>, pattern: string) => (await paths).concat(await glob(pattern)),
    [],
  );
  const gherkinDocuments = await parseGherkin(templatePaths);
  const templates = gherkinDocuments
    .reduce((scenarios: Array<FeatureChild>, doc: GherkinDocument) => scenarios.concat(doc.feature ? doc.feature.children : []), [])
    .map((featureChild: FeatureChild) => {
      const scenario = featureChild.scenario;
      if (!scenario) throw new Error('Scenario is not defined');
      return {
        ...scenario,
        templateRegex: new RegExp(`^${scenario.name.replace(/(<.+?>)/g, "'(.+?)'")}$`),
      };
    });
  memory.setValue('templateDefs', templates);
});

/**
 * This is composite step definition. To find actual steps review feature defined in templates property in config.
 */
When('f: {}', async function (compositeStep) {
  const templateDefs = memory.getValue('$templateDefs');
  // find scenario
  const scenario = templateDefs.find((s: ScenarioTemplate) => s.templateRegex.test(compositeStep));
  if (!scenario) throw new Error(`Composite step '${compositeStep}' is not found`);
  const scenarioArgs = compositeStep.match(scenario.templateRegex).splice(1);
  // get step defs
  const stepDefs = supportCodeLibraryBuilder.buildStepDefinitions(templateDefs.map((step: ScenarioTemplate) => step.id));
  // execute steps
  for (const step of scenario.steps) {
    const stepDefinition = stepDefs.stepDefinitions.find((sd) => sd.matchesStepName(step.text));
    if (!stepDefinition) throw new Error(`${step.text} is not defined`);
    for (const arg of scenarioArgs) {
      step.text = step.text.replace(/(<.+?>)/, arg);
    }
    const args = await stepDefinition.getInvocationParameters({ step, world: this } as any);
    await stepDefinition.code.apply(this, args.parameters);
  }
});
