'use client';

import { useUser } from '@clerk/nextjs';
import { ClientSideSuspense, LiveblocksProvider } from '@liveblocks/react/suspense';
import type { ReactNode } from 'react';
import Loader from '@/components/Loader';
import { getClerkUsers, getDocumentUsers } from '@/lib/actions/user.actions';

/** Connects the app to Liveblocks and tells it how to look up people for avatars and @mentions. */
export default function Provider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const myEmail = user?.emailAddresses[0].emailAddress ?? '';

  return (
    <LiveblocksProvider
      authEndpoint="/api/liveblocks-auth"
      resolveUsers={({ userIds }) => getClerkUsers({ userIds })}
      resolveMentionSuggestions={async ({ text, roomId }) =>
        (await getDocumentUsers({ roomId, currentUser: myEmail, text })) ?? []
      }
    >
      <ClientSideSuspense fallback={<Loader />}>{children}</ClientSideSuspense>
    </LiveblocksProvider>
  );
}
