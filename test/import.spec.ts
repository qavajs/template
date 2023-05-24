import { test, vi } from 'vitest';

vi.mock('@cucumber/cucumber');

test('should import index', async () => {
  await import('../index.js');
});
