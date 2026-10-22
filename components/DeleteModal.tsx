'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteDocument } from '@/lib/actions/room.actions';
import { Button } from './ui/button';

/** Trash button with a confirmation dialog. Only the owner sees it; the server checks again. */
export function DeleteModal({ roomId }: DeleteModalProps) {
  const [deleting, setDeleting] = useState(false);

  async function confirm() {
    setDeleting(true);
    // On success the server action redirects home, so this only returns on failure.
    await deleteDocument(roomId);
    setDeleting(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="min-w-9 rounded-xl bg-transparent p-2 transition-all" title="Delete document">
          {/* The e2e tests find this trigger by the image's alt text. */}
          <Image src="/assets/icons/delete.svg" alt="delete" width={20} height={20} className="mt-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog">
        <DialogHeader>
          <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-500/15">
            <Trash2 className="size-6 text-red-400" aria-hidden />
          </span>
          <DialogTitle>Delete document</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this document? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-5">
          <DialogClose asChild>
            <Button className="w-full bg-dark-400 text-white">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" onClick={confirm} disabled={deleting} className="gradient-red w-full">
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
