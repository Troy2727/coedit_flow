import { SignedIn } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import AddDocumentBtn from '@/components/AddDocumentBtn';
import { DeleteModal } from '@/components/DeleteModal';
import Header from '@/components/Header';
import Notifications from '@/components/Notifications';
import UserMenu from '@/components/UserMenu';
import { getDocuments } from '@/lib/actions/room.actions';
import { dateConverter } from '@/lib/utils';

interface RoomSummary {
  id: string;
  metadata: RoomMetadata;
  createdAt: string;
  lastConnectionAt?: string;
}

const lastTouched = (room: RoomSummary) => new Date(room.lastConnectionAt ?? room.createdAt).getTime();

function DocIcon({ className = '' }: { className?: string }) {
  return <FileText className={`size-10 text-blue-200 ${className}`} aria-hidden />;
}

/** Home: the user's documents, most recently opened first, with title search. */
export default async function Home({ searchParams }: SearchParamProps) {
  const user = await currentUser();
  if (!user) redirect('/modern-sign-in');
  const email = user.emailAddresses[0].emailAddress;

  const rooms: RoomSummary[] = (await getDocuments(email))?.data ?? [];
  const query = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const shown = rooms
    .filter((room) => room.metadata.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => lastTouched(b) - lastTouched(a));

  return (
    <main className="home-container">
      <Header className="sticky left-0 top-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <Notifications />
          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>
      </Header>

      {rooms.length === 0 ? (
        <div className="document-list-empty">
          <DocIcon className="mx-auto" />
          <AddDocumentBtn userId={user.id} email={email} />
        </div>
      ) : (
        <div className="document-list-container">
          <div className="document-list-title">
            <h3 className="text-28-semibold">All documents</h3>
            <AddDocumentBtn userId={user.id} email={email} />
          </div>

          <form role="search" className="w-full max-w-[730px]">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search documents"
              aria-label="Search documents"
              className="w-full rounded-lg border border-dark-400 bg-dark-200 px-4 py-2.5 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-blue-500"
            />
          </form>

          {shown.length === 0 && (
            <p className="text-blue-100">
              No documents match &quot;{query}&quot;.{' '}
              <Link href="/" className="text-blue-400 hover:underline">
                Clear search
              </Link>
            </p>
          )}

          <ul className="document-ul">
            {shown.map((room) => (
              <li key={room.id} className="document-list-item">
                <Link href={`/documents/${room.id}`} className="flex flex-1 items-center gap-4">
                  <span className="hidden rounded-md bg-dark-500 p-2 sm:block">
                    <DocIcon />
                  </span>
                  <span className="space-y-1">
                    <span className="line-clamp-1 block text-lg">{room.metadata.title}</span>
                    <span className="block text-sm font-light text-blue-100">
                      {room.lastConnectionAt
                        ? `Opened ${dateConverter(room.lastConnectionAt)}`
                        : `Created ${dateConverter(room.createdAt)}`}
                    </span>
                  </span>
                </Link>
                {room.metadata.creatorId === user.id && <DeleteModal roomId={room.id} />}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
