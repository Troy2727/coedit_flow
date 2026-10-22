'use client';

import { FilePlus2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createDocument } from '@/lib/actions/room.actions';
import { Button } from './ui/button';

/** Creates an empty document owned by the user and opens it. */
export default function AddDocumentBtn({ userId, email }: AddDocumentBtnProps) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  async function create() {
    setCreating(true);
    const room = await createDocument({ userId, email });
    if (room) router.push(`/documents/${room.id}`);
    else setCreating(false);
  }

  return (
    <Button type="button" onClick={create} disabled={creating} className="gradient-blue flex gap-1 shadow-md" aria-label="Start a blank document">
      <FilePlus2 className="size-6" aria-hidden />
      <span className="hidden sm:block">Start a blank document</span>
    </Button>
  );
}
