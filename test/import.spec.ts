import { test, jest } from '@jest/globals';
import * as cucumber from '@cucumber/cucumber';

jest.mock('@cucumber/cucumber');

test('should import index', async () => {
  await import('../index.js');
});
