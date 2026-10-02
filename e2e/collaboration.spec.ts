import type { Page } from '@playwright/test';

import { createDocument, editorOf, expect, openAs, test, waitForEditor } from './helpers';
import { GUEST, OWNER } from './test-users';

test.use({ user: OWNER });

async function invite(page: Page, email: string, role: 'can view' | 'can edit') {
  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('Email address').fill(email);
  if (role === 'can edit') {
    await dialog.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'can edit' }).click();
  }
  await dialog.getByRole('button', { name: 'Invite' }).click();
  await expect(dialog.getByText(email)).toBeVisible();

  await page.keyboard.press('Escape');
}

// Option label -> description shown once the server has saved it
const GENERAL_ACCESS = {
  'Restricted': 'Only people with access can open with the link',
  'Anyone with the link can view': 'Anyone signed in with the link can view',
} as const;

async function setGeneralAccess(page: Page, option: keyof typeof GENERAL_ACCESS) {
  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');

  await dialog.getByRole('combobox').last().click();
  await page.getByRole('option', { name: option }).click();
  await expect(dialog.getByText(GENERAL_ACCESS[option])).toBeVisible();

  await page.keyboard.press('Escape');
}

test('two editors see each other’s changes and presence in real time', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);

  // Presence: each sees the other's avatar
  await expect(page.getByAltText(`${GUEST.firstName} ${GUEST.lastName}`)).toBeVisible();
  await expect(guest.page.getByAltText(`${OWNER.firstName} ${OWNER.lastName}`)).toBeVisible();

  await editorOf(page).click();
  await page.keyboard.type('Hello from Olivia.', { delay: 20 });
  await expect(editorOf(guest.page)).toContainText('Hello from Olivia.');

  await editorOf(guest.page).click();
  await guest.page.keyboard.press('Control+End');
  await guest.page.keyboard.type(' Hi from Gabe!', { delay: 20 });
  await expect(editorOf(page)).toContainText('Hello from Olivia. Hi from Gabe!');

  await guest.context.close();
});

test('a slow collaborator joining later gets the existing content and live edits', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  await editorOf(page).click();
  await page.keyboard.type('Written before Gabe joined.', { delay: 20 });

  // A slow CPU makes React mount the editor slowly while Liveblocks syncs at
  // full speed. Regression: the initial sync used to land before Lexical was
  // listening, leaving the guest's editor detached from the shared document.
  const guest = await openAs(browser, GUEST);
  const cdp = await guest.context.newCDPSession(guest.page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);

  await expect(editorOf(guest.page)).toContainText('Written before Gabe joined.');

  await page.keyboard.type(' And after.', { delay: 20 });
  await expect(editorOf(guest.page)).toContainText('Written before Gabe joined. And after.');

  await guest.context.close();
});

test('an invited editor gets in even if Liveblocks briefly denies access', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  // In production, Liveblocks' realtime servers can take up to about a minute to see
  // a new invite and close the connection with 4001 meanwhile. Simulate two denials.
  const guest = await openAs(browser, GUEST);
  let denials = 0;
  await guest.page.routeWebSocket(/liveblocks\.io\/v\d+\?roomId=/, (ws) => {
    if (denials < 2) {
      denials++;
      ws.close({ code: 4001, reason: 'You have no access to this room' });
      return;
    }
    ws.connectToServer();
  });
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  expect(denials).toBe(2);

  await editorOf(page).click();
  await page.keyboard.type('Welcome, Gabe.', { delay: 20 });
  await expect(editorOf(guest.page)).toContainText('Welcome, Gabe.');

  await guest.context.close();
});

test('comments survive the same brief denial without crashing the page', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  // During the denial, Liveblocks also answers the comment threads request with 403.
  // Regression: the suspense threads hook threw it and crashed the whole page.
  const guest = await openAs(browser, GUEST);
  let socketDenials = 0;
  let threadDenials = 0;
  await guest.page.routeWebSocket(/liveblocks\.io\/v\d+\?roomId=/, (ws) => {
    if (socketDenials < 2) {
      socketDenials++;
      ws.close({ code: 4001, reason: 'You have no access to this room' });
      return;
    }
    ws.connectToServer();
  });
  await guest.page.route(/liveblocks\.io\/v2\/c\/rooms\/[^/]+\/threads/, async (route) => {
    // Only the initial load is denied; by the time the guest can post, access has arrived
    if (route.request().method() === 'GET' && threadDenials < 2) {
      threadDenials++;
      await route.fulfill({ status: 403, contentType: 'application/json', body: '{"error":"FORBIDDEN"}' });
      return;
    }
    await route.continue();
  });

  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  expect(threadDenials).toBeGreaterThan(0);

  // Once access arrives, the guest can comment and the owner sees it
  const composer = guest.page.locator('.comment-composer');
  await composer.locator('[contenteditable="true"]').click();
  await guest.page.keyboard.type('Comment after access arrived', { delay: 20 });
  await composer.getByRole('button', { name: /send/i }).click();
  await expect(page.locator('.comment-thread').getByText('Comment after access arrived')).toBeVisible();
  // The guest's own list recovers too (Liveblocks re-fetches threads after the error)
  await expect(guest.page.locator('.comment-thread').getByText('Comment after access arrived')).toBeVisible();
  await expect(guest.page.getByText('Application error')).toHaveCount(0);

  await guest.context.close();
});

test('a table inserted by one editor syncs to the other', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);

  await editorOf(page).click();
  await page.getByRole('button', { name: 'Table', exact: true }).click();
  await page.getByRole('button', { name: 'Insert 3 × 3 table' }).click();
  await expect(editorOf(guest.page).locator('table tr')).toHaveCount(3);

  await editorOf(guest.page).locator('table td').first().click();
  await guest.page.keyboard.type('from Gabe', { delay: 20 });
  await expect(editorOf(page).locator('table td').first()).toHaveText('from Gabe');

  await guest.context.close();
});

test('an image inserted by one editor syncs to the other', async ({ page, browser, baseURL }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);

  await editorOf(page).click();
  await page.getByRole('button', { name: 'Insert image' }).click();
  await page.getByLabel('Image URL').fill(`${baseURL}/assets/images/logo.png`);
  await page.getByLabel('Image description').fill('Shared logo');
  await page.getByRole('button', { name: 'Insert', exact: true }).click();

  await expect(editorOf(guest.page).getByRole('img', { name: 'Shared logo' })).toBeVisible();

  await guest.context.close();
});

test('sharing with someone who has no account yet keeps the document working', async ({ page }) => {
  // Regression: an invited email without a Clerk account crashed the document page
  const pending = 'livedocs-pending+clerk_test@example.com';
  await createDocument(page);
  await invite(page, pending, 'can view');

  await page.reload();
  await waitForEditor(page);

  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText(pending)).toBeVisible();
  await expect(dialog.getByText('Pending invite')).toBeVisible();
});

test('an uploaded image is visible to collaborators', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can view');

  await editorOf(page).click();
  await page.getByRole('button', { name: 'Insert image' }).click();
  await page.getByLabel('Image description').fill('Uploaded logo');
  await page.getByLabel('Upload image').setInputFiles('public/assets/images/logo.png');
  await expect(editorOf(page).getByRole('img', { name: 'Uploaded logo' })).toBeVisible({ timeout: 30_000 });

  // The guest fetches their own short-lived URL for the file
  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  const image = editorOf(guest.page).getByRole('img', { name: 'Uploaded logo' });
  await expect(image).toBeVisible({ timeout: 30_000 });
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);

  await guest.context.close();
});

test('invited viewers get a read-only document', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await invite(page, GUEST.email, 'can view');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);

  await waitForEditor(guest.page);
  await expect(guest.page.getByText('View only')).toBeVisible();
  await expect(editorOf(guest.page)).toHaveAttribute('contenteditable', 'false');
  await expect(guest.page.getByRole('button', { name: 'Version history' })).toHaveCount(0);
  await expect(guest.page.getByAltText('delete')).toHaveCount(0);
  // No editing toolbar: its buttons would only change the viewer's local copy
  await expect(guest.page.getByRole('button', { name: 'Insert image' })).toHaveCount(0);
  await expect(guest.page.getByRole('button', { name: 'Suggest edit' })).toHaveCount(0);
  await expect(guest.page.getByRole('button', { name: 'Download' })).toBeVisible();
  // Only editors can manage access
  await expect(guest.page.getByRole('button', { name: /share/i })).toBeDisabled();

  await guest.context.close();
});

test('"anyone with the link" sharing grants and revokes access', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await setGeneralAccess(page, 'Anyone with the link can view');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  await expect(guest.page.getByText('View only')).toBeVisible();

  await setGeneralAccess(page, 'Restricted');
  await guest.page.goto(`/documents/${roomId}`);
  await expect(guest.page).toHaveURL(/\/$/);

  await guest.context.close();
});

test('version history saves, previews, and restores a version', async ({ page }) => {
  await createDocument(page);
  const editor = editorOf(page);

  await editor.click();
  await page.keyboard.type('Version one text', { delay: 20 });

  await page.getByRole('button', { name: 'Version history' }).click();
  const dialog = page.getByRole('dialog', { name: 'Version history' });

  // Liveblocks snapshots lag live edits by a few seconds and the UI then asks
  // to "try again in a few seconds", so retry the way a user would.
  await expect(async () => {
    await dialog.getByRole('button', { name: 'Save current version' }).click();
    await expect(dialog.getByText('Version one text').first()).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
  await page.keyboard.press('Escape');

  await editor.click();
  await page.keyboard.press('Control+End');
  await page.keyboard.type(' plus later edits', { delay: 20 });
  await expect(editor).toContainText('Version one text plus later edits');

  await page.getByRole('button', { name: 'Version history' }).click();
  await dialog.getByRole('button', { name: /restore/i }).click();

  await expect(dialog).toBeHidden();
  await expect(editor).toHaveText('Version one text');
});

test('the invite role goes back to "can view" after each invite', async ({ page }) => {
  await createDocument(page);
  await invite(page, GUEST.email, 'can edit');

  await page.getByRole('button', { name: /share/i }).first().click();
  await expect(page.getByRole('dialog').getByRole('combobox').first()).toHaveText('can view');
});

test('a picked cursor color is what collaborators see', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open user menu' }).click();
  await page.getByRole('menuitem', { name: 'Cursor color' }).click();

  // Pick a color other than the current one, so the test proves a change
  const teal = page.getByRole('button', { name: 'Teal' });
  const isTeal = (await teal.getAttribute('aria-pressed')) === 'true';
  const [name, rgb] = isTeal ? ['Amber', 'rgb(161, 98, 7)'] : ['Teal', 'rgb(15, 118, 110)'];

  await page.getByRole('button', { name }).click();
  await expect(page.getByRole('status')).toHaveText(/Saved/);
  await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');

  // The same account in a second tab shows up as a collaborator in the first
  const roomId = await createDocument(page);
  const secondTab = await page.context().newPage();
  await secondTab.goto(`/documents/${roomId}`);
  await waitForEditor(secondTab);

  await expect(page.locator('.collaborators-list img')).toHaveCSS('border-top-color', rgb);
  await secondTab.close();
});
