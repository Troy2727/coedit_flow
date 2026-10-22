'use client';

import { useSelf } from '@liveblocks/react/suspense';
import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { updateDocumentAccess } from '@/lib/actions/room.actions';
import Collaborator from './Collaborator';
import GeneralAccessSection from './GeneralAccess';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import UserTypeSelector from './UserTypeSelector';

/** "Share" button and dialog: invite by email, change or remove people, and set link sharing. */
export default function ShareModal({ roomId, collaborators, creatorId, currentUserType, generalAccess }: ShareDocumentDialogProps) {
  const me = useSelf();
  const canShare = currentUserType === 'editor';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserType>('viewer');
  const [sending, setSending] = useState(false);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    const room = await updateDocumentAccess({ roomId, email: email.trim(), userType: role, updatedBy: me.info });
    // On failure keep the form filled so it can be retried. On success reset the role
    // to the safer "can view", so the next person isn't made an editor by accident.
    if (room) {
      setEmail('');
      setRole('viewer');
    }
    setSending(false);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="gradient-blue flex h-9 gap-1 px-4" disabled={!canShare} aria-label="Share">
          <Share2 className="size-5 min-w-4" aria-hidden />
          <span className="mr-1 hidden sm:block">Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="shad-dialog">
        <DialogHeader>
          <DialogTitle>Share this document</DialogTitle>
          <DialogDescription>Invite people by email as viewers or editors, or turn on link sharing.</DialogDescription>
        </DialogHeader>

        <form onSubmit={invite}>
          <Label htmlFor="share-email" className="mt-6 block text-blue-100">
            Email address
          </Label>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex flex-1 rounded-md bg-dark-400">
              <Input
                id="share-email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="share-input"
              />
              <UserTypeSelector userType={role} setUserType={setRole} />
            </div>
            <Button type="submit" className="gradient-blue flex h-full gap-1 px-5" disabled={sending}>
              {sending ? 'Sending...' : 'Invite'}
            </Button>
          </div>
        </form>

        <ul className="my-2 flex flex-col space-y-2">
          {collaborators.map((person) => (
            <Collaborator
              key={person.id}
              roomId={roomId}
              creatorId={creatorId}
              email={person.email}
              collaborator={person}
              user={me.info}
            />
          ))}
        </ul>

        <GeneralAccessSection roomId={roomId} initialAccess={generalAccess} canChange={canShare} />
      </DialogContent>
    </Dialog>
  );
}
