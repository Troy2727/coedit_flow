import { Liveblocks } from '@liveblocks/node';

import { TEST_USERS } from './test-users';

// Deletes documents created by the test users so runs don't pile up rooms.
export default async function globalTeardown() {
  const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY as string });
  const testEmails = TEST_USERS.map((user) => user.email);

  for (const email of testEmails) {
    // getRooms is paginated; collect every page before deleting
    const roomIds: string[] = [];
    let cursor: string | null | undefined;
    do {
      const page = await liveblocks.getRooms({ userId: email, ...(cursor ? { startingAfter: cursor } : {}) });
      for (const room of page.data) {
        if (testEmails.includes(room.metadata.email as string)) roomIds.push(room.id);
      }
      cursor = page.nextCursor;
    } while (cursor);

    for (const roomId of roomIds) {
      await liveblocks.deleteRoom(roomId);
    }
  }
}
