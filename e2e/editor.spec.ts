import { readFile } from 'node:fs/promises';

import { createDocument, editorOf, expect, test, waitForSelection } from './helpers';
import { OWNER } from './test-users';

test.use({ user: OWNER });

test.describe('editor formatting', () => {
  test('markdown shortcuts create headings, lists, and checklists', async ({ page }) => {
    await createDocument(page);
    const editor = editorOf(page);

    await editor.click();
    await page.keyboard.type('# Project plan');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- first bullet');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter'); // exit the list
    await page.keyboard.type('1. first step');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await page.keyboard.type('[] buy milk');

    await expect(editor.locator('h1')).toHaveText('Project plan');
    await expect(editor.locator('ul.editor-list-ul li').first()).toHaveText('first bullet');
    await expect(editor.locator('ol.editor-list-ol li')).toHaveText('first step');

    const todo = editor.locator('li.editor-listitem-unchecked', { hasText: 'buy milk' });
    await expect(todo).toBeVisible();

    // Clicking the checkbox area (the ::before box) toggles it
    await todo.click({ position: { x: 6, y: 10 } });
    await expect(editor.locator('li.editor-listitem-checked', { hasText: 'buy milk' })).toBeVisible();
  });

  test('toolbar buttons toggle lists', async ({ page }) => {
    await createDocument(page);
    const editor = editorOf(page);

    await editor.click();
    await page.keyboard.type('shopping');
    await page.getByRole('button', { name: 'Bulleted list' }).click();
    await expect(editor.locator('ul li')).toHaveText('shopping');

    await page.getByRole('button', { name: 'Numbered list' }).click();
    await expect(editor.locator('ol li')).toHaveText('shopping');

    await page.getByRole('button', { name: 'Numbered list' }).click();
    await expect(editor.locator('ol, ul')).toHaveCount(0);
  });

  test('bold, links, font size, and colors apply to selected text', async ({ page }) => {
    await createDocument(page);
    const editor = editorOf(page);

    await editor.click();
    await page.keyboard.type('Liveblocks');
    await page.keyboard.press('Shift+Home');
    await waitForSelection(page, 'Liveblocks');

    await page.keyboard.press('Control+b');
    await expect(editor.locator('.editor-text-bold')).toHaveText('Liveblocks');

    // Ctrl+K opens the link popover; a bare domain gets https:// added
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Paste or type a link').fill('liveblocks.io');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(editor.locator('a[href="https://liveblocks.io"]')).toHaveText('Liveblocks');

    // Select the line the way a user would: click into it, then Shift+Home
    await editor.getByText('Liveblocks').click();
    await page.keyboard.press('End');
    await page.keyboard.press('Shift+Home');
    await waitForSelection(page, 'Liveblocks');
    await page.getByRole('button', { name: 'Increase font size' }).click();
    await expect(page.getByRole('textbox', { name: 'Font size' })).toHaveValue('16');
    // The text is bold by now, so it renders as <strong>, not <span>
    await expect(editor.locator('[style*="font-size: 16px"]')).toHaveText('Liveblocks');

    await page.getByRole('button', { name: 'Text color' }).click();
    await page.getByRole('button', { name: '#e06666' }).click();
    await expect(editor.locator('[style*="color: rgb(224, 102, 102)"]')).toHaveText('Liveblocks');
  });

  test('javascript: links are rejected', async ({ page }) => {
    await createDocument(page);

    await editorOf(page).click();
    await page.keyboard.press('Control+k');
    await page.getByPlaceholder('Paste or type a link').fill('javascript:alert(1)');

    await expect(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
  });

  test('inserts a table and adds and removes rows and columns', async ({ page }) => {
    await createDocument(page);
    const editor = editorOf(page);
    const table = page.getByRole('button', { name: 'Table', exact: true });

    await editor.click();
    await table.click();
    await page.getByRole('button', { name: 'Insert 3 × 3 table' }).click();

    await expect(editor.locator('table tr')).toHaveCount(3);
    await expect(editor.locator('table tr').first().locator('th, td')).toHaveCount(3);

    await editor.locator('table td').first().click();
    // Zero-delay typing can drop characters in the Lexical/Yjs sync
    await page.keyboard.type('cell text', { delay: 20 });
    await expect(editor.locator('table td').first()).toHaveText('cell text');

    await table.click();
    await page.getByRole('button', { name: 'Insert row below' }).click();
    await expect(editor.locator('table tr')).toHaveCount(4);

    await table.click();
    await page.getByRole('button', { name: 'Insert column right' }).click();
    await expect(editor.locator('table tr').first().locator('th, td')).toHaveCount(4);

    await table.click();
    await page.getByRole('button', { name: 'Delete table' }).click();
    await expect(editor.locator('table')).toHaveCount(0);
  });

  test('inserts an image from a URL and rejects non-web URLs', async ({ page, baseURL }) => {
    await createDocument(page);
    const editor = editorOf(page);

    await editor.click();
    await page.getByRole('button', { name: 'Insert image' }).click();
    const insert = page.getByRole('button', { name: 'Insert', exact: true });

    await page.getByLabel('Image URL').fill('javascript:alert(1)');
    await expect(insert).toBeDisabled();

    await page.getByLabel('Image URL').fill(`${baseURL}/assets/images/logo.png`);
    await page.getByLabel('Image description').fill('LiveDocs logo');
    await insert.click();

    const image = editor.getByRole('img', { name: 'LiveDocs logo' });
    await expect(image).toBeVisible();
    // The browser actually loaded it
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
  });

  test('every toolbar button has a hover tooltip', async ({ page }) => {
    await createDocument(page);

    const buttons = page.locator('.toolbar button');
    const count = await buttons.count();
    expect(count).toBeGreaterThan(15);

    for (let i = 0; i < count; i++) {
      await expect(buttons.nth(i)).toHaveAttribute('title', /\S/);
    }
  });
});

test.describe('document tools', () => {
  test('word count and outline follow the content', async ({ page }) => {
    await createDocument(page);

    await editorOf(page).click();
    await page.keyboard.type('# Introduction');
    await page.keyboard.press('Enter');
    await page.keyboard.type('one two three');

    await expect(page.getByText('4 words')).toBeVisible();

    const outline = page.getByRole('navigation', { name: 'Document outline' });
    await expect(outline.getByRole('button', { name: 'Introduction' })).toBeVisible();
  });

  test('downloads the document as Markdown', async ({ page }) => {
    await createDocument(page);

    await editorOf(page).click();
    await page.keyboard.type('# Notes');
    await page.keyboard.press('Enter');
    await page.keyboard.type('- remember this');

    await page.getByRole('button', { name: 'Download' }).click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Markdown (.md)' }).click(),
    ]);

    expect(download.suggestedFilename()).toBe('Untitled.md');
    const markdown = await readFile((await download.path())!, 'utf8');
    expect(markdown).toContain('# Notes');
    expect(markdown).toContain('- remember this');
  });

  test('delete dialog opens and Cancel closes it', async ({ page }) => {
    await createDocument(page);

    // Regression: this dialog used to crash with a Radix Slot error
    await page.locator('.toolbar-wrapper').getByRole('button').filter({ has: page.getByAltText('delete') }).click();
    await expect(page.getByRole('dialog', { name: 'Delete document' })).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});
