import { createClerkClient } from '@clerk/backend';
import { setupClerkTestingToken } from '@clerk/testing/playwright';

import { createDocument, expect, test, waitForEditor } from './helpers';
import { OWNER } from './test-users';

test.use({ user: OWNER });

// No account exists for this address until the test signs it up through the invitation
const INVITEE = 'livedocs-invitee+clerk_test@example.com';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/** Deletes the invitee's account and revokes their pending invitations, so every run starts fresh. */
async function resetInvitee() {
  const { data: users } = await clerk.users.getUserList({ emailAddress: [INVITEE] });
  for (const user of users) await clerk.users.deleteUser(user.id);

  const { data: invitations } = await clerk.invitations.getInvitationList({ status: 'pending', limit: 100 });
  for (const invitation of invitations.filter((i) => i.emailAddress === INVITEE)) {
    await clerk.invitations.revokeInvitation(invitation.id);
  }
}

test.beforeEach(resetInvitee);
test.afterEach(resetInvitee);

test('sharing with someone without an account emails them an invitation that opens the document', async ({ page, browser }) => {
  await createDocument(page);

  await page.getByRole('button', { name: /share/i }).first().click();
  const dialog = page.getByRole('dialog');
  const emailInput = dialog.getByLabel('Email address');
  await emailInput.fill(INVITEE);
  await dialog.getByRole('button', { name: 'Invite' }).click();
  await expect(dialog.getByText('Pending invite')).toBeVisible();
  await expect(emailInput).toHaveValue('');

  // Clerk sends the email (not for +clerk_test addresses); open the same link it contains
  let invitationUrl: string | undefined;
  await expect
    .poll(async () => {
      const { data } = await clerk.invitations.getInvitationList({ status: 'pending', limit: 100 });
      invitationUrl = data.find((i) => i.emailAddress === INVITEE)?.url;
      return invitationUrl;
    })
    .toBeTruthy();

  const context = await browser.newContext();
  const invitee = await context.newPage();
  await setupClerkTestingToken({ page: invitee });
  await invitee.goto(invitationUrl!);

  await expect(invitee).toHaveURL(/\/modern-sign-up\?.*__clerk_ticket=/);
  // The form ignores submits until Clerk has loaded
  await invitee.waitForFunction(() => Boolean((window as any).Clerk?.loaded));
  await expect(invitee.getByText("You've been invited to a document")).toBeVisible();
  await expect(invitee.getByLabel('Email')).toHaveCount(0);

  await invitee.getByLabel('First Name').fill('Ivy');
  await invitee.getByLabel('Last Name').fill('Invitee');
  await invitee.getByLabel('Password').fill(`Lvdocs-${Date.now()}-pw!`);
  await invitee.getByRole('button', { name: /sign up/i }).click();

  // Signed in, with the shared document waiting on the home page
  await invitee.waitForURL((url) => url.pathname === '/');
  const sharedDoc = invitee.locator('.document-list-item');
  await expect(sharedDoc).toHaveCount(1);
  await sharedDoc.getByRole('link').first().click();
  await waitForEditor(invitee);
  await expect(invitee.getByText('View only')).toBeVisible();

  // The owner's share dialog now shows the new account instead of "Pending invite"
  await page.reload();
  await waitForEditor(page);
  await page.getByRole('button', { name: /share/i }).first().click();
  await expect(page.getByRole('dialog').getByText('Ivy Invitee')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('Pending invite')).toHaveCount(0);

  await context.close();
});
