import Memory from './memory';

export default {
    paths: ['test-e2e/features/*.feature'],
    require: ['test-e2e/step-definitions/*.ts', 'src/*.ts'],
    requireModules: ['src/index.ts'],
    templates: [
        'test-e2e/templates/*.feature'
    ],
    format: [
        '@qavajs/console-formatter',
        'junit:test-e2e/report.xml',
        'json:test-e2e/report.json'
    ],
    memory: new Memory(),
    parallel: 1
}
