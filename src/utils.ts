import { ISupportCodeLibrary } from '@cucumber/cucumber/lib/support_code_library_builder/types';
import { Duration, GherkinDocument, Step, TestStepResult, TimeConversion } from '@cucumber/messages';
import { GherkinStreams } from '@cucumber/gherkin-streams';

/**
 * Clone object
 * @param obj
 * @return {any}
 */
export function cloneDeep(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
}

export function findStepDefinition(id: string, supportCodeLibrary: ISupportCodeLibrary) {
    return supportCodeLibrary.stepDefinitions.find((definition) => definition.id === id);
}

/**
 * Add template stack trace
 * @param {TestStepResult} result - original step result
 * @param {Step} step - template step invoked failed ste
 * @param {Duration} duration - duration of template
 */
export function formatErrorMessage(result: TestStepResult, step: Step, duration: Duration): TestStepResult {
    result.duration = duration;
    result.message = `${step.keyword}${step.text}\n${result.message}`;
    return result;
}

export function parseGherkin(paths: Array<string>): Promise<Array<GherkinDocument>> {
    // guard to check if templates found, otherwise gherkin streams hangs
    if (paths.length === 0) return Promise.resolve([]);
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

/**
 * Calculate total duration of template
 * @param {Array<TestStepResult>} results - results of steps included to template
 * @return {Duration} - total duration
 */
export function getDuration(results: Array<TestStepResult>): Duration {
    return TimeConversion.millisecondsToDuration(
        results.reduce(
            (total, result) => total + TimeConversion.durationToMilliseconds(result.duration),
            0
        )
    )
}

/**
 * Resolve value with scenario args
 * @param {string} value - original value
 * @param {Array<string>} scenarioArgs - array of scenario values
 * return {string} - resolved string
 */
export function resolveTemplateParams(value: string, scenarioArgs: Array<{name: string, value: string}>) {
    const reducer = (text: string, arg: {name: string, value: string}) => text.replace(new RegExp(`<${arg.name}>`, 'g'), arg.value);
    return scenarioArgs.reduce(reducer, value);
}
