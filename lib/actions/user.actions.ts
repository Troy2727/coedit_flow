'use server';

import { clerkClient, currentUser as getSignedInUser } from "@clerk/nextjs/server";
import { brightColors, parseStringify } from "../utils";
import { liveblocks } from "../liveblocks";

export const getClerkUsers = async ({ userIds }: { userIds: string[]}) => {
  try {
    if(!await getSignedInUser()) throw new Error('You must be signed in');

    const { data } = await clerkClient.users.getUserList({
      emailAddress: userIds,
    });

    const users = data.map((user) => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.emailAddresses[0].emailAddress,
      avatar: user.imageUrl,
    }));

    const sortedUsers = userIds.map((email) => users.find((user) => user.email === email));

    return parseStringify(sortedUsers);
  } catch (error) {
    console.log(`Error fetching users: ${error}`);
  }
}

export const getDocumentUsers = async ({ roomId, currentUser, text }: { roomId: string, currentUser: string, text: string }) => {
  try {
    const clerkUser = await getSignedInUser();
    const room = await liveblocks.getRoom(roomId);

    const hasAccess = clerkUser && (room.usersAccesses[clerkUser.emailAddresses[0].emailAddress] || room.defaultAccesses.length > 0);

    if(!hasAccess) {
      throw new Error('You do not have access to this document');
    }

    const users = Object.keys(room.usersAccesses).filter((email) => email !== currentUser);

    // Skip the lookup when nobody else has access: an empty email filter lists every Clerk user
    if(text.length && users.length) {
      const lowerCaseText = text.toLowerCase();

      // Match names too, so "@Ramon" finds people, not only "@ramon@..."
      const { data } = await clerkClient.users.getUserList({ emailAddress: users, limit: users.length });
      const names = new Map(data.map((user) => [user.emailAddresses[0].emailAddress, `${user.firstName} ${user.lastName}`]));

      const filteredUsers = users.filter((email: string) =>
        email.toLowerCase().includes(lowerCaseText) || names.get(email)?.toLowerCase().includes(lowerCaseText)
      )

      return parseStringify(filteredUsers);
    }

    return parseStringify(users);
  } catch (error) {
    console.log(`Error fetching document users: ${error}`);
  }
}

// Saved on the signed-in user's own Clerk account; the Liveblocks auth route reads it
export const updateCursorColor = async (color: string) => {
  try {
    const clerkUser = await getSignedInUser();
    if(!clerkUser) throw new Error('You must be signed in');

    if(!brightColors.includes(color)) throw new Error('Unsupported cursor color');

    await clerkClient.users.updateUserMetadata(clerkUser.id, {
      publicMetadata: { cursorColor: color },
    });

    return color;
  } catch (error) {
    console.log(`Error updating cursor color: ${error}`);
  }
}