import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { liveblocks } from '@/lib/liveblocks';
import { getCursorColor } from '@/lib/utils';

/**
 * Liveblocks calls this when the editor connects. Users are identified by email,
 * because room access is granted by email (including people invited before signing up).
 */
export async function POST() {
  const user = await currentUser();
  if (!user) redirect('/modern-sign-in');

  const email = user.emailAddresses[0].emailAddress;
  const { status, body } = await liveblocks.identifyUser(
    { userId: email, groupIds: [] },
    {
      userInfo: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email,
        avatar: user.imageUrl,
        color: getCursorColor(user.id, user.publicMetadata.cursorColor),
      },
    },
  );
  return new Response(body, { status });
}
