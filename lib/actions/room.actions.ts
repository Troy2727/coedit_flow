'use server';

// Every export here is a public HTTP endpoint (Next.js server action), so each one
// re-checks who is calling and what they may do. Failures are logged and return
// undefined, which the UI treats as "didn't work".

import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { nanoid } from 'nanoid';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { liveblocks } from '../liveblocks';
import { getAccessType, parseStringify } from '../utils';

class AccessDenied extends Error {}

async function signedInEmail(): Promise<string> {
  const user = await currentUser();
  if (!user) throw new AccessDenied('You must be signed in');
  return user.emailAddresses[0].emailAddress;
}

/**
 * The room, if the caller may act on it. 'editor' needs write access, given to
 * them directly or to everyone through link sharing; 'creator' must own it.
 */
async function roomFor(roomId: string, needs: 'editor' | 'creator') {
  const email = await signedInEmail();
  const room = await liveblocks.getRoom(roomId);
  const access = (room.usersAccesses[email] ?? room.defaultAccesses) as string[];
  const allowed = needs === 'creator' ? room.metadata.email === email : access.includes('room:write');
  if (!allowed) throw new AccessDenied('You do not have permission to do this');
  return room;
}

/** Run an action, logging and swallowing any error so the client just gets undefined. */
async function attempt<T>(what: string, action: () => Promise<T>): Promise<T | undefined> {
  try {
    return await action();
  } catch (error) {
    console.log(`Could not ${what}: ${error}`);
    return undefined;
  }
}

export const createDocument = async ({ userId, email }: CreateDocumentParams) =>
  attempt('create a document', async () => {
    const user = await currentUser();
    if (!user || user.id !== userId || user.emailAddresses[0].emailAddress !== email) {
      throw new AccessDenied('You can only create documents for yourself');
    }
    const room = await liveblocks.createRoom(nanoid(), {
      metadata: { creatorId: userId, email, title: 'Untitled' },
      usersAccesses: { [email]: ['room:write'] },
      defaultAccesses: [],
    });
    revalidatePath('/');
    return parseStringify(room);
  });

export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) =>
  attempt('open a document', async () => {
    if (userId !== (await signedInEmail())) throw new AccessDenied('You do not have access to this document');
    const room = await liveblocks.getRoom(roomId);
    const invited = userId in room.usersAccesses;
    const linkShared = room.defaultAccesses.length > 0;
    if (!invited && !linkShared) throw new AccessDenied('You do not have access to this document');
    return parseStringify(room);
  });

export const getDocuments = async (email: string) =>
  attempt('list documents', async () => {
    if (email !== (await signedInEmail())) throw new AccessDenied('You can only list your own documents');
    return parseStringify(await liveblocks.getRooms({ userId: email }));
  });

export const updateDocument = async (roomId: string, title: string) =>
  attempt('rename a document', async () => {
    await roomFor(roomId, 'editor');
    const room = await liveblocks.updateRoom(roomId, { metadata: { title } });
    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  });

export const updateDocumentAccess = async ({ roomId, email, userType, updatedBy }: ShareDocumentParams) =>
  attempt('share a document', async () => {
    const existing = await roomFor(roomId, 'editor');
    if (existing.metadata.email === email) throw new AccessDenied("The owner's access cannot be changed");

    const room = await liveblocks.updateRoom(roomId, { usersAccesses: { [email]: getAccessType(userType) } });

    // Access is granted at this point. Telling the person is best-effort: a failed
    // notification or email must not make the invite look failed.
    await notifyAccessGranted({ roomId, email, userType, updatedBy });
    await inviteToSignUp(email);

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  });

async function notifyAccessGranted({ roomId, email, userType, updatedBy }: ShareDocumentParams) {
  // The e2e server sets this: its constant invites would use up the Liveblocks free
  // tier's monthly notifications and leave none for real users.
  if (process.env.SKIP_ACCESS_NOTIFICATIONS === 'true') return;
  await liveblocks
    .triggerInboxNotification({
      userId: email,
      kind: '$documentAccess',
      subjectId: nanoid(),
      roomId,
      activityData: {
        userType,
        title: `You have been granted ${userType} access to the document by ${updatedBy.name}`,
        updatedBy: updatedBy.name,
        avatar: updatedBy.avatar,
        email: updatedBy.email,
      },
    })
    .catch((error) => console.log(`Access notification not sent: ${error}`));
}

/**
 * Access is stored by email, so people invited before they have an account get it
 * the moment they sign up. Email them a sign-up link so they know.
 */
async function inviteToSignUp(email: string) {
  try {
    const { data: accounts } = await clerkClient.users.getUserList({ emailAddress: [email] });
    if (accounts.length > 0) return;
    const origin = headers().get('origin');
    await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: origin ? `${origin}/modern-sign-up` : undefined,
    });
  } catch (error) {
    // Includes Clerk refusing a second invitation while the first is still pending.
    console.log(`Sign-up invitation not sent: ${error}`);
  }
}

export const removeCollaborator = async ({ roomId, email }: { roomId: string; email: string }) =>
  attempt('remove a collaborator', async () => {
    const existing = await roomFor(roomId, 'editor');
    if (existing.metadata.email === email) throw new AccessDenied('You cannot remove yourself from the document');
    const room = await liveblocks.updateRoom(roomId, { usersAccesses: { [email]: null } });
    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  });

export const updateGeneralAccess = async (roomId: string, generalAccess: GeneralAccess) =>
  attempt('change link sharing', async () => {
    await roomFor(roomId, 'editor');
    const room = await liveblocks.updateRoom(roomId, {
      defaultAccesses: generalAccess === 'restricted' ? [] : getAccessType(generalAccess),
    });
    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  });

export const getDocumentVersions = async (roomId: string) =>
  attempt('list versions', async () => {
    await roomFor(roomId, 'editor');
    const { data } = await liveblocks.getVersionHistory(roomId);
    return parseStringify(data);
  });

export const createVersionSnapshot = async (roomId: string) =>
  attempt('save a version', async () => {
    await roomFor(roomId, 'editor');
    const snapshot = await liveblocks.createVersionHistorySnapshot(roomId);
    // Liveblocks can answer 204 "Could not create version" (e.g. edits not saved yet)
    // without throwing, so only a returned id counts. The SDK types say { data: { id } }
    // but the API returns { id }; accept both.
    const id = snapshot?.data?.id ?? (snapshot as unknown as { id?: string })?.id;
    if (!id) throw new Error(`no version created: ${JSON.stringify(snapshot)}`);
    return parseStringify(snapshot);
  });

export const deleteDocument = async (roomId: string) => {
  const deleted = await attempt('delete a document', async () => {
    await roomFor(roomId, 'creator');
    await liveblocks.deleteRoom(roomId);
    revalidatePath('/');
    return true;
  });
  // redirect() works by throwing, so it must run outside attempt()'s catch.
  if (deleted) redirect('/');
};
