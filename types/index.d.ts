/* eslint-disable no-unused-vars */
// App-wide types, available without imports.

/** Liveblocks permission sets: editors write; viewers read and show their cursor. */
declare type AccessType = ['room:write'] | ['room:read', 'room:presence:write'];
declare type RoomAccesses = Record<string, AccessType>;

declare type UserType = 'creator' | 'editor' | 'viewer';
/** Link sharing: nobody, or anyone signed in with the link as viewer/editor. */
declare type GeneralAccess = 'restricted' | 'viewer' | 'editor';

/** Stored on each Liveblocks room. `email` is the owner's. */
declare type RoomMetadata = { creatorId: string; email: string; title: string };

declare type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  userType?: UserType;
};

declare type SearchParamProps = {
  params: Record<string, string>;
  searchParams: Record<string, string | string[] | undefined>;
};

declare type CreateDocumentParams = { userId: string; email: string };
declare type ShareDocumentParams = { roomId: string; email: string; userType: UserType; updatedBy: User };

declare type CollaborativeRoomProps = {
  roomId: string;
  roomMetadata: RoomMetadata;
  users: User[];
  currentUserType: UserType;
  generalAccess: GeneralAccess;
};

declare type ShareDocumentDialogProps = {
  roomId: string;
  collaborators: User[];
  creatorId: string;
  currentUserType: UserType;
  generalAccess: GeneralAccess;
};

declare type CollaboratorProps = { roomId: string; email: string; creatorId: string; collaborator: User; user: User };
declare type UserTypeSelectorParams = {
  userType: string;
  setUserType: React.Dispatch<React.SetStateAction<UserType>>;
  onClickHandler?: (value: string) => void;
};
declare type HeaderProps = { children: React.ReactNode; className?: string };
declare type AddDocumentBtnProps = { userId: string; email: string };
declare type DeleteModalProps = { roomId: string };
