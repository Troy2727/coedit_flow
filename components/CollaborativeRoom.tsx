'use client';

import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs';
import { ClientSideSuspense, RoomProvider } from '@liveblocks/react/suspense';
import { useState } from 'react';
import { Editor } from '@/components/editor/Editor';
import Header from '@/components/Header';
import ActiveCollaborators from './ActiveCollaborators';
import DocumentTitle from './DocumentTitle';
import Loader from './Loader';
import RoomAccessRetry from './RoomAccessRetry';
import ShareModal from './ShareModal';
import UserMenu from './UserMenu';

/** One open document: the Liveblocks room with its header (title, people, sharing) and editor. */
export default function CollaborativeRoom({
  roomId,
  roomMetadata,
  users,
  currentUserType,
  generalAccess,
}: CollaborativeRoomProps) {
  const { user } = useUser();
  const [title, setTitle] = useState(roomMetadata.title);
  const canEdit = currentUserType === 'editor';

  return (
    <RoomProvider id={roomId}>
      <RoomAccessRetry />
      <ClientSideSuspense fallback={<Loader />}>
        <div className="collaborative-room">
          <Header>
            <DocumentTitle roomId={roomId} initialTitle={roomMetadata.title} canEdit={canEdit} onRenamed={setTitle} />
            <div className="flex w-full flex-1 justify-end gap-2 sm:gap-3">
              <ActiveCollaborators />
              <ShareModal
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetadata.creatorId}
                currentUserType={currentUserType}
                generalAccess={generalAccess}
              />
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserMenu />
              </SignedIn>
            </div>
          </Header>
          <Editor
            roomId={roomId}
            currentUserType={currentUserType}
            isCreator={user?.id === roomMetadata.creatorId}
            title={title}
          />
        </div>
      </ClientSideSuspense>
    </RoomProvider>
  );
}
