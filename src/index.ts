import { DataTable, supportCodeLibraryBuilder } from '@cucumber/cucumber';
import { loadFeatures } from './loader';
console.log(globalThis)

type ArrayElement<T> = T extends (infer U)[] ? U : never;
console.log(supportCodeLibraryBuilder)
async function main() {
  //@ts-ignore
  const config = await global.importConfig;
  if (!config.templates) throw new Error(`'template' property is not set`);
  const templates = loadFeatures(config.templates);
  
  function replaceParams(args: { [prop: string]: string }, text: string) {
    return Object.entries(args).reduce((text, [param, value]) => text.replaceAll(`<${param}>`, value), text)
  }
  
  for (const template of templates) {
    const params = template.name.match(/<.+?>/g);
    async function executeTemplate(args: { [prop: string]: string }, world: any) {
      if (args.argument && typeof args.argument === 'string') {
        args['qavajsMultiline'] = args.argument;
      }
      if (args.argument && (args.argument as any).rows) {
        const rows = (args.argument as unknown as DataTable).raw();
        for (const [key, value] of rows) {
          args[key] = value;
          console.log([key, value])
        }
      }
      const stepDefsLibrary = supportCodeLibraryBuilder.buildStepDefinitions();
      for (const templateStep of template.steps) {
        const text = replaceParams(args, templateStep.text);
        if (templateStep.argument) {
          if (templateStep.argument.docString) {
            templateStep.argument.docString.content = replaceParams(args, templateStep.argument.docString.content);
          }
          if (templateStep.argument.dataTable) {
            for (let row = 0; row < templateStep.argument.dataTable.rows.length; row++) {
              for (let cell = 0; cell < templateStep.argument.dataTable.rows[row].cells.length; cell++) {
                templateStep.argument.dataTable.rows[row].cells[cell].value = replaceParams(args, templateStep.argument.dataTable.rows[row].cells[cell].value)
              }
            }
          }
        }
        const steps = stepDefsLibrary.stepDefinitions.filter(s => s.matchesStepName(text));
        if (steps.length === 0) throw new Error(`Step "${text}" is not defined`);
        if (steps.length > 1) throw new Error(`"${text}" matches multiple step definitions`);
        const step = steps.pop() as unknown as ArrayElement<typeof steps>;
        const { parameters } = await step.getInvocationParameters({ step: { text, argument: templateStep.argument }, world } as any);
        try {
          await step.code.apply(world, [...parameters]);
        } catch (err) {
          throw new Error(`${text}\n${err}`);
        }
      }
    }
    const args = params ? [...params].map(value => value.replace(/[<>]/g, '')) : [];
    if (template.name.endsWith(':')) args.push('argument');
    const commaSeparatedArgs = args.join(',');
    const executor = eval(`(async function(${commaSeparatedArgs}) { return executeTemplate({${commaSeparatedArgs}}, this) })`);
    const templatePattern = template.name.replace(/(<.+?>)/g, '\{\}');
    supportCodeLibraryBuilder.methods.When(templatePattern, executor as any);
  }
}

main();