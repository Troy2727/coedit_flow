import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CollaborativeRoom from '@/components/CollaborativeRoom';
import { getDocument } from '@/lib/actions/room.actions';
import { getClerkUsers } from '@/lib/actions/user.actions';

const canWrite = (access: string[] | null | undefined) => Boolean(access?.includes('room:write'));

/** Loads a document and everyone who has access, then hands off to the live room. */
export default async function DocumentPage({ params: { id } }: SearchParamProps) {
  const user = await currentUser();
  if (!user) redirect('/modern-sign-in');
  const email = user.emailAddresses[0].emailAddress;

  const room = await getDocument({ roomId: id, userId: email });
  if (!room) redirect('/');

  const emails = Object.keys(room.usersAccesses);
  const accounts: (User | undefined)[] = (await getClerkUsers({ userIds: emails })) ?? [];
  const people: User[] = emails.map((address, i) => ({
    // People invited before they signed up have no account yet; show them by email.
    ...(accounts[i] ?? { id: address, name: 'Pending invite', email: address, avatar: '/assets/icons/user.svg', color: '' }),
    userType: canWrite(room.usersAccesses[address]) ? 'editor' : 'viewer',
  }));

  // Direct access wins; otherwise the user is here through link sharing.
  const myAccess = room.usersAccesses[email] ?? room.defaultAccesses;
  const linkAccess: GeneralAccess =
    room.defaultAccesses.length === 0 ? 'restricted' : canWrite(room.defaultAccesses) ? 'editor' : 'viewer';

  return (
    <main className="flex w-full flex-col items-center">
      <CollaborativeRoom
        roomId={id}
        roomMetadata={room.metadata}
        users={people}
        currentUserType={canWrite(myAccess) ? 'editor' : 'viewer'}
        generalAccess={linkAccess}
      />
    </main>
  );
}
