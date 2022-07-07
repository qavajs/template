import { GherkinStreams } from '@cucumber/gherkin-streams';
import { Envelope, GherkinDocument } from '@cucumber/messages';

export function parseGherkin(paths: Array<string>): Promise<Array<GherkinDocument>> {
  return new Promise<Array<GherkinDocument>>((resolve, reject) => {
    const messageStream = GherkinStreams.fromPaths(paths, {});
    const gherkinDocuments: Array<GherkinDocument> = [];
    messageStream.on('data', (envelope: Envelope) => {
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
