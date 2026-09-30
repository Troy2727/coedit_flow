import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// Same env loading as `next dev`, so tests use the app's Clerk and Liveblocks keys.
loadEnvConfig(process.cwd());

const PORT = 3001;

export default defineConfig({
  testDir: './e2e',
  // Tests share two Clerk test users, and the dev server compiles pages on
  // first hit, so run serially for stable timing.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    viewport: { width: 1600, height: 1000 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 1000 } } }],
  webServer: {
    command: 'npm run dev',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
