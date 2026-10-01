import { loadEnvConfig } from '@next/env';
import { defineConfig, devices } from '@playwright/test';

// Same env loading as `next dev`, so tests use the app's Clerk and Liveblocks keys.
loadEnvConfig(process.cwd());

// Tests run against a production build on its own port, next to (not instead of)
// the dev server on 3001. Dev mode double-mounts components (React Strict Mode),
// which intermittently leaves a second collaborator's editor detached from the
// shared Yjs document; users never run into that, so we test what they get.
const PORT = 3002;

export default defineConfig({
  testDir: './e2e',
  // Tests share two Clerk test users, so run serially.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  // Room for waitForEditor's two minutes when Liveblocks is slow to accept a new invite
  timeout: 180_000,
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
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    env: { NEXT_DIST_DIR: '.next-e2e' },
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    // Show the app's server logs in the test output, so server action errors
    // behind a failed test (e.g. a version snapshot) are visible in CI
    stdout: 'pipe',
  },
});
