// "+clerk_test" addresses are Clerk test identities: no real email is ever sent.
export type TestUser = {
  email: string;
  firstName: string;
  lastName: string;
};

export const OWNER: TestUser = {
  email: 'livedocs-owner+clerk_test@example.com',
  firstName: 'Olivia',
  lastName: 'Owner',
};

export const GUEST: TestUser = {
  email: 'livedocs-guest+clerk_test@example.com',
  firstName: 'Gabe',
  lastName: 'Guest',
};

export const TEST_USERS = [OWNER, GUEST];
