import { createClerkClient } from '@clerk/backend';
import { clerkSetup } from '@clerk/testing/playwright';

import { TEST_USERS } from './test-users';

// Gets a Clerk testing token and creates the test users if they don't exist yet.
export default async function globalSetup() {
  await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY });

  const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  for (const user of TEST_USERS) {
    const { data } = await clerkClient.users.getUserList({ emailAddress: [user.email] });
    if (data.length > 0) continue;

    await clerkClient.users
      .createUser({
        emailAddress: [user.email],
        firstName: user.firstName,
        lastName: user.lastName,
        skipPasswordRequirement: true,
      })
      .catch((error) => {
        const details = error.errors?.map((e: { longMessage?: string; message: string }) => e.longMessage ?? e.message);
        throw new Error(`Could not create Clerk test user ${user.email}: ${details?.join('; ') ?? error}`);
      });
  }
}
