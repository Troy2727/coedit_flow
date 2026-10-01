'use client';

import { useErrorListener, useRoom } from '@liveblocks/react/suspense';
import { useEffect, useRef } from 'react';

const RETRY_EVERY_MS = 5_000;
const GIVE_UP_AFTER_MS = 120_000;

/**
 * The server checks the user's access before rendering a document. Right after an
 * invite, Liveblocks' realtime servers can take up to about a minute to see the new
 * permission and reject the connection meanwhile (code 4001). The client doesn't
 * retry on its own, which left invited users on the loader, so retry here.
 */
export default function RoomAccessRetry() {
  const room = useRoom();
  const firstDeniedAt = useRef<number | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout>>();

  useErrorListener((error) => {
    const { context } = error;
    if (context.type !== 'ROOM_CONNECTION_ERROR' || context.code !== 4001 || context.roomId !== room.id) return;

    firstDeniedAt.current ??= Date.now();
    if (Date.now() - firstDeniedAt.current > GIVE_UP_AFTER_MS) return;

    clearTimeout(retryTimer.current);
    retryTimer.current = setTimeout(() => room.reconnect(), RETRY_EVERY_MS);
  });

  useEffect(() => () => clearTimeout(retryTimer.current), []);

  return null;
}
