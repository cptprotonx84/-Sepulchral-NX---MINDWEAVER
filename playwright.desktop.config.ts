import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: './tests/desktop',
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  outputDir: 'test-results-desktop',
  timeout: 60_000,
  use: {screenshot: 'only-on-failure', trace: 'retain-on-failure'},
});
