'use client';

import Image from 'next/image';
import { useState } from 'react';
import { removeCollaborator, updateDocumentAccess } from '@/lib/actions/room.actions';
import { Button } from './ui/button';
import UserTypeSelector from './UserTypeSelector';

/** One person in the Share dialog: their role (editable unless they own the doc) and Remove. */
export default function Collaborator({ roomId, creatorId, collaborator, email, user }: CollaboratorProps) {
  const [role, setRole] = useState<UserType>(collaborator.userType ?? 'viewer');
  const [busy, setBusy] = useState(false);

  const run = async (work: () => Promise<unknown>) => {
    setBusy(true);
    await work();
    setBusy(false);
  };

  return (
    <li className="flex items-center justify-between gap-2 py-3">
      <div className="flex gap-2">
        <Image src={collaborator.avatar} alt={collaborator.name} width={36} height={36} className="size-9 rounded-full" />
        <div>
          <p className="line-clamp-1 text-sm font-semibold leading-4 text-white">
            {collaborator.name}
            {busy && <span className="text-10-regular pl-2 text-blue-100">updating...</span>}
          </p>
          <p className="text-sm font-light text-blue-100">{collaborator.email}</p>
        </div>
      </div>

      {collaborator.id === creatorId ? (
        <p className="text-sm text-blue-100">Owner</p>
      ) : (
        <div className="flex items-center">
          <UserTypeSelector
            userType={role}
            setUserType={setRole}
            onClickHandler={(next) =>
              run(() => updateDocumentAccess({ roomId, email, userType: next as UserType, updatedBy: user }))
            }
          />
          <Button type="button" onClick={() => run(() => removeCollaborator({ roomId, email: collaborator.email }))}>
            Remove
          </Button>
        </div>
      )}
    </li>
  );
}
