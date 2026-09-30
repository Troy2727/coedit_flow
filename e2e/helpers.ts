import { clerk, setupClerkTestingToken } from '@clerk/testing/playwright';
import { expect, test as base, type Browser, type Page } from '@playwright/test';

import type { TestUser } from './test-users';

/** Signs a page in as `user` and waits until the server will see the session. */
export async function signIn(page: Page, user: TestUser) {
  await setupClerkTestingToken({ page });

  // Clerk must be loaded on a public page before signing in
  await page.goto('/modern-sign-in');
  await clerk.signIn({ page, emailAddress: user.email });

  // Clerk sets the __session cookie shortly after sign-in. Until it exists the
  // server still sees a signed-out request, so wait for it before navigating.
  await page.waitForFunction(() => Boolean((window as any).Clerk?.user));
  await expect
    .poll(async () => (await page.context().cookies()).some((c) => c.name === '__session' && c.value !== ''), {
      timeout: 20_000,
    })
    .toBe(true);
}

// Each test signs in fresh (instead of reusing saved sessions, which went
// stale a few minutes into a run). Use `test.use({ user: OWNER })`.
export const test = base.extend<{ user: TestUser | null }>({
  user: [null, { option: true }],
  page: async ({ page, user }, use) => {
    if (user) {
      await signIn(page, user);
    } else {
      await setupClerkTestingToken({ page });
    }
    await use(page);
  },
});

export { expect };

export const editorOf = (page: Page) => page.locator('.editor-input');

/** Creates a blank document from the home page and waits for the editor. Returns the room id. */
export async function createDocument(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /start a blank document/i }).click();
  await page.waitForURL(/\/documents\/[^/]+$/);
  await expect(editorOf(page)).toBeVisible();

  return page.url().split('/documents/')[1];
}

/** Opens a second, independently signed-in browser (another user). */
export async function openAs(browser: Browser, user: TestUser) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signIn(page, user);

  return { context, page };
}
