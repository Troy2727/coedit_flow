import type { Page } from '@playwright/test';

import { createDocument, editorOf, expect, openAs, test, waitForEditor, waitForSelection } from './helpers';
import { GUEST, OWNER } from './test-users';

test.use({ user: OWNER });

const panelOf = (page: Page) => page.getByRole('region', { name: 'Suggestions' });

/** Selects `word`, which must sit `charsFromEnd` characters before the end of the current line. */
async function selectBeforeEnd(page: Page, word: string, charsFromEnd: number) {
  await page.keyboard.press('End');
  for (let i = 0; i < charsFromEnd; i++) await page.keyboard.press('ArrowLeft');
  for (let i = 0; i < word.length; i++) await page.keyboard.press('Shift+ArrowLeft');
  await waitForSelection(page, word);
}

async function suggest(page: Page, text: string) {
  await page.getByRole('button', { name: 'Suggest edit' }).click();
  await page.getByLabel('Suggested text').fill(text);
  await page.getByRole('button', { name: 'Suggest', exact: true }).click();
}

test('suggest a replacement, deletion, and insertion, then accept or reject each', async ({ page }) => {
  await createDocument(page);
  const editor = editorOf(page);
  await editor.click();
  await page.keyboard.type('The quick brown fox', { delay: 20 });

  // Replace "brown" with "red", then accept
  await selectBeforeEnd(page, 'brown', ' fox'.length);
  await suggest(page, 'red');
  await expect(editor.locator('del')).toHaveText('brown');
  await expect(editor.locator('ins')).toHaveText('red');
  await expect(panelOf(page)).toContainText('Olivia Owner');
  await expect(panelOf(page)).toContainText('Replace brown with red');
  await panelOf(page).getByRole('button', { name: 'Accept suggestion' }).click();
  await expect(editor).toHaveText('The quick red fox');
  await expect(editor.locator('del, ins')).toHaveCount(0);
  await expect(panelOf(page)).toHaveCount(0);

  // Suggest deleting "quick ", then reject: the text stays
  await editor.click();
  await selectBeforeEnd(page, 'quick ', 'red fox'.length);
  await suggest(page, '');
  await expect(editor.locator('del')).toHaveText('quick ');
  await panelOf(page).getByRole('button', { name: 'Reject suggestion' }).click();
  await expect(editor).toHaveText('The quick red fox');
  await expect(editor.locator('del')).toHaveCount(0);

  // Suggest adding text at the caret, then accept
  await editor.click();
  await page.keyboard.press('End');
  await suggest(page, ' jumps');
  await expect(editor.locator('ins')).toHaveText(' jumps');
  await expect(panelOf(page)).toContainText('Add jumps');
  await panelOf(page).getByRole('button', { name: 'Accept suggestion' }).click();
  await expect(editor).toHaveText('The quick red fox jumps');
});

test('a selection across paragraphs is refused with an explanation', async ({ page }) => {
  await createDocument(page);
  const editor = editorOf(page);
  await editor.click();
  await page.keyboard.type('First paragraph', { delay: 20 });
  await page.keyboard.press('Enter');
  await page.keyboard.type('Second paragraph', { delay: 20 });
  await page.keyboard.press('Control+a');

  await suggest(page, 'replacement');
  await expect(page.getByText('Select plain text within one paragraph')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor.locator('del, ins')).toHaveCount(0);
  await expect(editor).toContainText('Second paragraph');
});

test('suggestions persist, sync to collaborators, and can be accepted by another editor', async ({ page, browser }) => {
  const roomId = await createDocument(page);
  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email address').fill(GUEST.email);
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'can edit' }).click();
  await dialog.getByRole('button', { name: 'Invite' }).click();
  await expect(dialog.getByText(GUEST.email)).toBeVisible();
  await page.keyboard.press('Escape');

  const editor = editorOf(page);
  await editor.click();
  await page.keyboard.type('Ship on Friday', { delay: 20 });
  await selectBeforeEnd(page, 'Friday', 0);
  await suggest(page, 'Monday');

  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  const guestEditor = editorOf(guest.page);
  await expect(guestEditor.locator('del')).toHaveText('Friday');
  await expect(guestEditor.locator('ins')).toHaveText('Monday');
  await expect(guestEditor.locator('ins')).toHaveAttribute('title', 'Suggested by Olivia Owner');

  // Stored in the document itself, so it survives a reload
  await page.reload();
  await waitForEditor(page);
  await expect(editor.locator('ins')).toHaveText('Monday');

  await panelOf(guest.page).getByRole('button', { name: 'Accept suggestion' }).click();
  await expect(editor).toHaveText('Ship on Monday');
  await expect(panelOf(page)).toHaveCount(0);

  await guest.context.close();
});
