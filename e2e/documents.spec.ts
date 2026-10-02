import type { Page } from '@playwright/test';

import { createDocument, expect, test } from './helpers';
import { OWNER } from './test-users';

test.use({ user: OWNER });

async function renameDocument(page: Page, title: string) {
  await page.getByAltText('edit').click();
  await page.getByPlaceholder('Enter title').fill(title);
  await page.keyboard.press('Enter');

  // The title shows while "saving..." is still in flight; the edit icon only returns once the save is done
  await expect(page.getByAltText('edit')).toBeVisible();
  await expect(page.locator('.document-title')).toHaveText(title);
}

test('renamed documents can be found with search', async ({ page }) => {
  await createDocument(page);
  const title = `Quarterly report ${Date.now()}`;
  await renameDocument(page, title);

  await page.goto(`/?q=${encodeURIComponent(title)}`);
  await expect(page.getByRole('link', { name: new RegExp(title) })).toBeVisible();
  await expect(page.getByLabel('Search documents')).toHaveValue(title);

  await page.goto('/?q=no-document-has-this-title');
  await expect(page.getByText(/No documents match/)).toBeVisible();
});

test('owners can delete a document from the home page', async ({ page }) => {
  await createDocument(page);
  const title = `Delete me ${Date.now()}`;
  await renameDocument(page, title);

  await page.goto(`/?q=${encodeURIComponent(title)}`);
  const row = page.locator('.document-list-item', { hasText: title });
  await row.getByAltText('delete').click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(row).toHaveCount(0);
});

test('deleting an open document returns to the home page', async ({ page }) => {
  const roomId = await createDocument(page);

  await page.locator('.toolbar-wrapper').getByRole('button').filter({ has: page.getByAltText('delete') }).click();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(`a[href="/documents/${roomId}"]`)).toHaveCount(0);
});
