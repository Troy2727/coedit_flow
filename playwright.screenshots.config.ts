import { defineConfig } from '@playwright/test';

import baseConfig from './playwright.config';

// Reuses the e2e setup (production build, Clerk test users, cleanup) to capture
// the README screenshots. Run with: npm run screenshots
export default defineConfig({
  ...baseConfig,
  testMatch: '**/*.screenshots.ts',
  retries: 0,
  reporter: [['list']],
});
