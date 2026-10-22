import type { LiveFile, LiveMap } from '@liveblocks/client';

// Types for the Liveblocks hooks (useOthers, useStorage, useThreads...).
declare global {
  interface Liveblocks {
    Presence: Record<string, never>;

    Storage: {
      /** Images uploaded into the document; ImageNode refers to them by file id. */
      images?: LiveMap<string, LiveFile>;
    };

    /** Set by app/api/liveblocks-auth when a user connects. */
    UserMeta: {
      id: string;
      info: { id: string; name: string; email: string; avatar: string; color: string };
    };

    RoomEvent: Record<string, never>;
    ThreadMetadata: Record<string, never>;
    RoomInfo: Record<string, never>;
  }
}

export {};
