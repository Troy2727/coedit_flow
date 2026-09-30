import AddDocumentBtn from '@/components/AddDocumentBtn';
import { DeleteModal } from '@/components/DeleteModal';
import Header from '@/components/Header'
import Notifications from '@/components/Notifications';
import { Button } from '@/components/ui/button'
import { getDocuments } from '@/lib/actions/room.actions';
import { dateConverter } from '@/lib/utils';
import { SignedIn, UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const lastActivity = (room: any) => new Date(room.lastConnectionAt ?? room.createdAt).getTime();

const Home = async ({ searchParams }: SearchParamProps) => {
  const clerkUser = await currentUser();
  if(!clerkUser) redirect('/modern-sign-in');

  const roomDocuments = await getDocuments(clerkUser.emailAddresses[0].emailAddress);

  const query = typeof searchParams.q === 'string' ? searchParams.q.trim() : '';
  const documents = roomDocuments.data
    .filter(({ metadata }: any) => metadata.title.toLowerCase().includes(query.toLowerCase()))
    .sort((a: any, b: any) => lastActivity(b) - lastActivity(a));

  return (
    <main className="home-container">
      <Header className="sticky left-0 top-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <Notifications />
          <SignedIn>
            <UserButton afterSignOutUrl="/modern-sign-in" />
          </SignedIn>
        </div>
      </Header>

      {roomDocuments.data.length > 0 ? (
        <div className="document-list-container">
          <div className="document-list-title">
            <h3 className="text-28-semibold">All documents</h3>
            <AddDocumentBtn
              userId={clerkUser.id}
              email={clerkUser.emailAddresses[0].emailAddress}
            />
          </div>
          <form className="w-full max-w-[730px]" role="search">
            <input
              name="q"
              defaultValue={query}
              placeholder="Search documents"
              aria-label="Search documents"
              className="w-full rounded-lg border border-dark-400 bg-dark-200 px-4 py-2.5 text-sm text-white outline-none placeholder:text-blue-100/50 focus:border-blue-500"
            />
          </form>
          {documents.length === 0 && (
            <p className="text-blue-100">
              No documents match &quot;{query}&quot;. <Link href="/" className="text-blue-400 hover:underline">Clear search</Link>
            </p>
          )}
          <ul className="document-ul">
            {documents.map(({ id, metadata, createdAt, lastConnectionAt }: any) => (
              <li key={id} className="document-list-item">
                <Link href={`/documents/${id}`} className="flex flex-1 items-center gap-4">
                  <div className="hidden rounded-md bg-dark-500 p-2 sm:block">
                    <Image
                      src="/assets/icons/doc.svg"
                      alt="file"
                      width={40}
                      height={40}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="line-clamp-1 text-lg">{metadata.title}</p>
                    <p className="text-sm font-light text-blue-100">
                      {lastConnectionAt ? `Opened ${dateConverter(lastConnectionAt)}` : `Created ${dateConverter(createdAt)}`}
                    </p>
                  </div>
                </Link>
                {metadata.creatorId === clerkUser.id && <DeleteModal roomId={id} />}
              </li>
            ))}
          </ul>
        </div>
      ): (
        <div className="document-list-empty">
          <Image
            src="/assets/icons/doc.svg"
            alt="Document"
            width={40}
            height={40}
            className="mx-auto"
          />

          <AddDocumentBtn
            userId={clerkUser.id}
            email={clerkUser.emailAddresses[0].emailAddress}
          />
        </div>
      )}
    </main>
  )
}

export default Home