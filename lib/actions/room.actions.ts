'use server';

import { nanoid } from 'nanoid'
import { liveblocks } from '../liveblocks';
import { revalidatePath } from 'next/cache';
import { getAccessType, parseStringify } from '../utils';
import { redirect } from 'next/navigation';
import { clerkClient, currentUser } from '@clerk/nextjs/server';
import { headers } from 'next/headers';

// Server actions are public endpoints, so every action re-checks the caller server-side.
const getCurrentUserEmail = async () => {
  const clerkUser = await currentUser();
  if(!clerkUser) throw new Error('You must be signed in');

  return clerkUser.emailAddresses[0].emailAddress;
}

const assertRoomPermission = async (roomId: string, level: 'editor' | 'creator') => {
  const email = await getCurrentUserEmail();
  const room = await liveblocks.getRoom(roomId);

  // Invited users get their own access; everyone else falls back to link sharing (defaultAccesses)
  const access = (room.usersAccesses[email] ?? room.defaultAccesses) as string[];

  const allowed = level === 'creator'
    ? room.metadata.email === email
    : access.includes('room:write');

  if(!allowed) throw new Error('You do not have permission to do this');

  return room;
}

export const createDocument = async ({ userId, email }: CreateDocumentParams) => {
  const roomId = nanoid();

  try {
    const clerkUser = await currentUser();
    if(!clerkUser || clerkUser.id !== userId || clerkUser.emailAddresses[0].emailAddress !== email) {
      throw new Error('You can only create documents for yourself');
    }

    const metadata = {
      creatorId: userId,
      email,
      title: 'Untitled'
    }

    const usersAccesses: RoomAccesses = {
      [email]: ['room:write']
    }

    const room = await liveblocks.createRoom(roomId, {
      metadata,
      usersAccesses,
      defaultAccesses: []
    });
    
    revalidatePath('/');

    return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while creating a room: ${error}`);
  }
}

export const getDocument = async ({ roomId, userId }: { roomId: string; userId: string }) => {
  try {
      if(userId !== await getCurrentUserEmail()) {
        throw new Error('You do not have access to this document');
      }

      const room = await liveblocks.getRoom(roomId);

      const hasAccess = Object.keys(room.usersAccesses).includes(userId) || room.defaultAccesses.length > 0;
    
      if(!hasAccess) {
        throw new Error('You do not have access to this document');
      }
    
      return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while getting a room: ${error}`);
  }
}

export const updateDocument = async (roomId: string, title: string) => {
  try {
    await assertRoomPermission(roomId, 'editor');

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      metadata: {
        title
      }
    })

    revalidatePath(`/documents/${roomId}`);

    return parseStringify(updatedRoom);
  } catch (error) {
    console.log(`Error happened while updating a room: ${error}`);
  }
}

export const getDocuments = async (email: string ) => {
  try {
      if(email !== await getCurrentUserEmail()) {
        throw new Error('You can only list your own documents');
      }

      const rooms = await liveblocks.getRooms({ userId: email });
    
      return parseStringify(rooms);
  } catch (error) {
    console.log(`Error happened while getting rooms: ${error}`);
  }
}

export const updateDocumentAccess = async ({ roomId, email, userType, updatedBy }: ShareDocumentParams) => {
  try {
    const existingRoom = await assertRoomPermission(roomId, 'editor');

    if(existingRoom.metadata.email === email) {
      throw new Error("The owner's access cannot be changed");
    }

    const usersAccesses: RoomAccesses = {
      [email]: getAccessType(userType) as AccessType,
    }

    const room = await liveblocks.updateRoom(roomId, { 
      usersAccesses
    })

    if(room) {
      const notificationId = nanoid();

      // Access is already granted. Telling the person about it is best-effort, so a
      // failure here (e.g. Liveblocks refusing notifications with 403) must not make
      // the invite look failed or skip the email invitation.
      // The e2e test server turns notifications off: its constant invites used up the
      // Liveblocks free tier's monthly notifications, leaving none for real users.
      if (process.env.SKIP_ACCESS_NOTIFICATIONS !== 'true') {
        await liveblocks.triggerInboxNotification({
          userId: email,
          kind: '$documentAccess',
          subjectId: notificationId,
          activityData: {
            userType,
            title: `You have been granted ${userType} access to the document by ${updatedBy.name}`,
            updatedBy: updatedBy.name,
            avatar: updatedBy.avatar,
            email: updatedBy.email
          },
          roomId
        }).catch((error) => console.log(`Access notification not sent: ${error}`));
      }

      await sendSignUpInvitation(email).catch((error) => console.log(`Sign-up invitation not sent: ${error}`));
    }

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while updating a room access: ${error}`);
  }
}

// Access is stored by email, so someone invited before signing up gets it as soon as
// they create an account. Email them a sign-up link so they know they were invited.
const sendSignUpInvitation = async (email: string) => {
  const { data: existingUsers } = await clerkClient.users.getUserList({ emailAddress: [email] });
  if (existingUsers.length > 0) return;

  const origin = headers().get('origin');

  await clerkClient.invitations
    .createInvitation({
      emailAddress: email,
      redirectUrl: origin ? `${origin}/modern-sign-up` : undefined,
    })
    .catch((error) => {
      // Clerk refuses a second invitation while one is pending, e.g. when a pending
      // person's role changes; the first invitation is still valid.
      console.log(`Sign-up invitation not sent: ${error}`);
    });
}

export const removeCollaborator = async ({ roomId, email }: {roomId: string, email: string}) => {
  try {
    const room = await assertRoomPermission(roomId, 'editor');

    if(room.metadata.email === email) {
      throw new Error('You cannot remove yourself from the document');
    }

    const updatedRoom = await liveblocks.updateRoom(roomId, {
      usersAccesses: {
        [email]: null
      }
    })

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(updatedRoom);
  } catch (error) {
    console.log(`Error happened while removing a collaborator: ${error}`);
  }
}

export const updateGeneralAccess = async (roomId: string, generalAccess: GeneralAccess) => {
  try {
    await assertRoomPermission(roomId, 'editor');

    const room = await liveblocks.updateRoom(roomId, {
      defaultAccesses: generalAccess === 'restricted' ? [] : getAccessType(generalAccess) as AccessType,
    });

    revalidatePath(`/documents/${roomId}`);
    return parseStringify(room);
  } catch (error) {
    console.log(`Error happened while updating general access: ${error}`);
  }
}

export const getDocumentVersions = async (roomId: string) => {
  try {
    await assertRoomPermission(roomId, 'editor');

    const { data } = await liveblocks.getVersionHistory(roomId);

    return parseStringify(data);
  } catch (error) {
    console.log(`Error happened while getting versions: ${error}`);
  }
}

export const createVersionSnapshot = async (roomId: string) => {
  try {
    await assertRoomPermission(roomId, 'editor');

    const snapshot = await liveblocks.createVersionHistorySnapshot(roomId);

    // Liveblocks can answer 204 "Could not create version" (e.g. edits not persisted yet)
    // without throwing, so only a returned version id counts as success. The SDK types
    // say { data: { id } } but the API returns { id }, so accept both.
    const versionId = snapshot?.data?.id ?? (snapshot as unknown as { id?: string })?.id;
    if(!versionId) throw new Error(`No version created: ${JSON.stringify(snapshot)}`);

    return parseStringify(snapshot);
  } catch (error) {
    console.log(`Error happened while saving a version: ${error}`);
  }
}

export const deleteDocument = async (roomId: string) => {
  try {
    await assertRoomPermission(roomId, 'creator');

    await liveblocks.deleteRoom(roomId);
    revalidatePath('/');
    redirect('/');
  } catch (error) {
    console.log(`Error happened while deleting a room: ${error}`);
  }
}