import {defineConfig, devices} from '@playwright/test';

const TEST_PORT = 3103;
const TEST_ORIGIN = `http://127.0.0.1:${TEST_PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  outputDir: 'test-results',
  use: {
    baseURL: TEST_ORIGIN,
    colorScheme: 'dark',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    viewport: {width: 1440, height: 900},
  },
  webServer: {
    command: 'npm run dev',
    url: TEST_ORIGIN,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      DISABLE_HMR: 'true',
      PORT: String(TEST_PORT),
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
});
