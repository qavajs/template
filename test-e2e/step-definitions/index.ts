import { Then, When } from '@cucumber/cucumber';
import memory from '@qavajs/memory';
import { expect } from 'chai';

When('I set memory value {string} as {string}', function (key, value) {
    memory.setValue(key, value);
});

Then('I expect {string} memory value to be equal {string}', function(actual, expected) {
    const actualValue = memory.getValue(actual);
    const expectedValue = memory.getValue(expected);
    expect(expectedValue).to.eql(actualValue);
});

Then('I expect {string} memory value to be equal:', function(actual, multilineExpected) {
    const actualValue = memory.getValue(actual);
    const expectedValue = memory.getValue(multilineExpected);
    expect(expectedValue).to.eql(actualValue);
});

When('I throw {string} error', function (errorMessage) {
    throw new Error(errorMessage);
});

When('step with multiline string:', function (text) {
    memory.setValue('multiline', text);
});

When('step with data table:', function (dataTable) {
    for (const row of dataTable.raw()) {
        memory.setValue(row[0], row[1]);
    }
});
