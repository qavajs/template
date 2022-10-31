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
