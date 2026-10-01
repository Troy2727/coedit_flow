import { createClerkClient } from '@clerk/backend';

import { createDocument, expect, openAs, test } from './helpers';
import { GUEST, OWNER } from './test-users';

test.describe('sign-up', () => {
  // +clerk_test addresses never receive email; Clerk accepts 424242 as their code
  const NEW_USER = 'livedocs-signup+clerk_test@example.com';
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  const deleteNewUser = async () => {
    const { data } = await clerk.users.getUserList({ emailAddress: [NEW_USER] });
    for (const user of data) await clerk.users.deleteUser(user.id);
  };
  test.beforeEach(deleteNewUser);
  test.afterEach(deleteNewUser);

  test('new users sign up with email and password, confirmed by an emailed code', async ({ page }) => {
    await page.goto('/modern-sign-up');
    // The form ignores submits until Clerk has loaded
    await page.waitForFunction(() => Boolean((window as any).Clerk?.loaded));

    await page.getByLabel('First Name').fill('Sam');
    await page.getByLabel('Last Name').fill('Signup');
    await page.getByLabel('Email').fill(NEW_USER);
    await page.getByLabel('Password').fill(`Lvdocs-${Date.now()}-pw!`);
    await page.getByRole('button', { name: /sign up/i }).click();

    await expect(page.getByText(`We sent a code to ${NEW_USER}`)).toBeVisible();
    await page.getByLabel('Verification code').fill('424242');
    await page.getByRole('button', { name: /verify/i }).click();

    await page.waitForURL((url) => url.pathname === '/');
    await expect(page.getByRole('button', { name: /start a blank document/i })).toBeVisible();

    const { data } = await clerk.users.getUserList({ emailAddress: [NEW_USER] });
    expect(data[0]?.firstName).toBe('Sam');
  });
});

test('signed-out visitors are sent to sign in', async ({ page }) => {
  await page.goto('/documents/some-document-id');

  await expect(page).toHaveURL(/sign-in/);
});

test.describe('as the owner', () => {
  test.use({ user: OWNER });

  test('an uninvited user cannot open a restricted document', async ({ page, browser }) => {
    const roomId = await createDocument(page);

    const guest = await openAs(browser, GUEST);
    await guest.page.goto(`/documents/${roomId}`);

    // getDocument denies access, so the page redirects home
    await expect(guest.page).toHaveURL(/\/$/);
    await guest.context.close();
  });
});
