import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AstBuilder, compile, GherkinClassicTokenMatcher, Parser } from '@cucumber/gherkin';
import { IdGenerator } from '@cucumber/messages';
import { globSync } from 'glob';

const uuidFn = IdGenerator.uuid()
const builder = new AstBuilder(uuidFn)
const matcher = new GherkinClassicTokenMatcher();
const parser = new Parser(builder, matcher)

export function loadFeatures(globPattern: string[]) {
    const files = globSync(globPattern);
    return files.map(file => {
        const filePath = resolve(file);
        const gherkinDocument = parser.parse(readFileSync(filePath, 'utf-8'));
        return compile(gherkinDocument, file, uuidFn)
    }).reduce((a, f) => a.concat(f), []);
}