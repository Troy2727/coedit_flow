import { Liveblocks } from '@liveblocks/node';

import { TEST_USERS } from './test-users';

// Deletes documents created by the test users so runs don't pile up rooms.
export default async function globalTeardown() {
  const liveblocks = new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY as string });
  const testEmails = TEST_USERS.map((user) => user.email);

  for (const email of testEmails) {
    const { data: rooms } = await liveblocks.getRooms({ userId: email });

    for (const room of rooms) {
      if (testEmails.includes(room.metadata.email as string)) {
        await liveblocks.deleteRoom(room.id);
      }
    }
  }
}
