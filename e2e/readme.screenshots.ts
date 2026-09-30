// Generates the README screenshots in docs/images from the real app.
// Run with: npm run screenshots
import type { Page } from '@playwright/test';

import { createDocument, editorOf, expect, openAs, test, waitForEditor, waitForSelection } from './helpers';
import { GUEST, OWNER } from './test-users';

const OUT = 'docs/images';

test.use({ user: OWNER });

async function renameDocument(page: Page, title: string) {
  await page.getByAltText('edit').click();
  await page.getByPlaceholder('Enter title').fill(title);
  await page.keyboard.press('Enter');
  await expect(page.getByAltText('edit')).toBeVisible();
}

/** Selects an exact phrase in the editor, independent of line wrapping. */
async function selectPhrase(page: Page, phrase: string) {
  await page.evaluate((text) => {
    const root = document.querySelector('.editor-input') as HTMLElement;
    root.focus();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const start = node.textContent!.indexOf(text);
      if (start === -1) continue;
      const range = document.createRange();
      range.setStart(node, start);
      range.setEnd(node, start + text.length);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    throw new Error(`Phrase not found: ${text}`);
  }, phrase);
  await waitForSelection(page, phrase);
}

async function writeSampleDocument(page: Page) {
  await editorOf(page).click();
  // Zero-delay synthetic typing can drop characters in the Lexical/Yjs sync
  // (reproducible on the pre-upgrade code too); 10ms per key syncs cleanly.
  const type = (text: string) => page.keyboard.type(text, { delay: 10 });
  const enter = () => page.keyboard.press('Enter');

  await type('# Q4 Product Launch');
  await enter();
  await type('Goals for the launch, owners, and the checklist we review every Monday. ');
  await type('Budget is approved and the brief lives in the design doc.');
  await enter();
  await type('## Milestones');
  await enter();
  await type('1. Private beta with 50 teams');
  await enter();
  await type('Public launch and press release');
  await enter();
  await type('Post-launch retrospective');
  await enter();
  await enter();
  await type('## Launch checklist');
  await enter();
  await type('[] Finalize pricing page');
  await enter();
  await type('Record the demo video');
  await enter();
  await type('Brief the support team');
  await enter();
  await enter();
  await type('## Risks');
  await enter();
  await type('- Onboarding flow still needs usability testing');
  await enter();
  await type('Load testing for real-time editing at 500+ users');

  const editor = editorOf(page);
  await editor.locator('li.editor-listitem-unchecked', { hasText: 'Finalize pricing page' }).click({ position: { x: 6, y: 10 } });

  await selectPhrase(page, 'approved');
  await page.keyboard.press('Control+b');
  await page.getByRole('button', { name: 'Highlight color' }).click();
  await page.getByRole('button', { name: '#6aa84f' }).click();

  await selectPhrase(page, 'design doc');
  await page.keyboard.press('Control+k');
  await page.getByPlaceholder('Paste or type a link').fill('example.com/design-doc');
  await page.getByRole('button', { name: 'Apply' }).click();
}

test('capture README screenshots', async ({ page, browser }) => {
  test.setTimeout(300_000);

  const roomId = await createDocument(page);
  await renameDocument(page, 'Q4 Product Launch Plan');
  await writeSampleDocument(page);

  // A comment thread on the load-testing risk
  await selectPhrase(page, 'Load testing for real-time editing');
  await page.getByAltText('comment').click();
  await page.keyboard.type('Can we run this against staging before the beta?');
  await page.keyboard.press('Enter');
  await expect(page.locator('.comment-thread')).toBeVisible();

  // Share: invite the guest as an editor and turn on link sharing
  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Email address').fill(GUEST.email);
  await dialog.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'can edit' }).click();
  await dialog.getByRole('button', { name: 'Invite' }).click();
  await expect(dialog.getByText(GUEST.email)).toBeVisible();
  await dialog.getByRole('combobox').last().click();
  await page.getByRole('option', { name: 'Anyone with the link can view' }).click();
  await expect(dialog.getByText('Anyone signed in with the link can view')).toBeVisible();
  await page.screenshot({ path: `${OUT}/sharing.png` });
  await page.keyboard.press('Escape');

  // The guest joins and puts their cursor in the checklist
  const guest = await openAs(browser, GUEST);
  await guest.page.goto(`/documents/${roomId}`);
  await waitForEditor(guest.page);
  await editorOf(guest.page).getByText('Brief the support team').click();
  await guest.page.keyboard.press('End');

  await expect(page.getByAltText(`${GUEST.firstName} ${GUEST.lastName}`)).toBeVisible();
  await editorOf(page).getByText('Goals for the launch', { exact: false }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/editor.png` });

  // Version history with a saved version
  await page.getByRole('button', { name: 'Version history' }).click();
  const history = page.getByRole('dialog', { name: 'Version history' });
  await expect(async () => {
    await history.getByRole('button', { name: 'Save current version' }).click();
    await expect(history.getByText('Q4 Product Launch').first()).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 60_000, intervals: [2_000, 3_000, 5_000] });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/version-history.png` });
  await page.keyboard.press('Escape');

  await guest.context.close();

  // Home page with a few documents
  for (const title of ['Engineering Onboarding Guide', 'Design Review Notes']) {
    await createDocument(page);
    await renameDocument(page, title);
  }
  await page.goto('/');
  await expect(page.getByText('Q4 Product Launch Plan')).toBeVisible();
  // Wait for the header logo and avatar images so they're in the shot
  await expect(page.getByAltText('Logo with name')).toBeVisible();
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${OUT}/home.png` });
});
