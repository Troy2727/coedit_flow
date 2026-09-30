import { createDocument, expect, openAs, test } from './helpers';
import { GUEST, OWNER } from './test-users';

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
