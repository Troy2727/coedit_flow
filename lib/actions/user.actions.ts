'use server';

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { liveblocks } from '../liveblocks';
import { brightColors, parseStringify } from '../utils';

const fullName = (u: { firstName: string | null; lastName: string | null }) => `${u.firstName} ${u.lastName}`;

/** Clerk profiles for the given emails, in the same order (undefined where there's no account). */
export async function getClerkUsers({ userIds }: { userIds: string[] }) {
  try {
    if (!(await currentUser())) throw new Error('You must be signed in');
    const { data } = await clerkClient.users.getUserList({ emailAddress: userIds });
    const byEmail = new Map(
      data.map((u) => {
        const email = u.emailAddresses[0].emailAddress;
        return [email, { id: u.id, name: fullName(u), email, avatar: u.imageUrl }];
      }),
    );
    return parseStringify(userIds.map((email) => byEmail.get(email)));
  } catch (error) {
    console.log(`Could not load users: ${error}`);
  }
}

/**
 * Emails of the document's other collaborators for @mentions, filtered by `text`
 * against both the email and the person's name ("@ram" finds Ramon).
 */
export async function getDocumentUsers({ roomId, currentUser: me, text }: { roomId: string; currentUser: string; text: string }) {
  try {
    const user = await currentUser();
    const room = await liveblocks.getRoom(roomId);
    const canSee = user && (room.usersAccesses[user.emailAddresses[0].emailAddress] || room.defaultAccesses.length > 0);
    if (!canSee) throw new Error('You do not have access to this document');

    const others = Object.keys(room.usersAccesses).filter((email) => email !== me);
    // An empty emailAddress filter would list every Clerk user, so skip the lookup when alone.
    if (!text || others.length === 0) return parseStringify(others);

    const query = text.toLowerCase();
    const { data } = await clerkClient.users.getUserList({ emailAddress: others, limit: others.length });
    const names = new Map(data.map((u) => [u.emailAddresses[0].emailAddress, fullName(u).toLowerCase()]));
    return parseStringify(
      others.filter((email) => email.toLowerCase().includes(query) || names.get(email)?.includes(query)),
    );
  } catch (error) {
    console.log(`Could not load document users: ${error}`);
  }
}

/** Save the signed-in user's cursor color on their Clerk account (read by the Liveblocks auth route). */
export async function updateCursorColor(color: string) {
  try {
    const user = await currentUser();
    if (!user) throw new Error('You must be signed in');
    if (!brightColors.includes(color)) throw new Error('Unsupported cursor color');
    await clerkClient.users.updateUserMetadata(user.id, { publicMetadata: { cursorColor: color } });
    return color;
  } catch (error) {
    console.log(`Could not save cursor color: ${error}`);
  }
}
