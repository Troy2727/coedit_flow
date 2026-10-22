'use client';

import { useOthers } from '@liveblocks/react/suspense';
import Image from 'next/image';

/** Avatars of everyone else in the document right now, ringed in their cursor color. */
export default function ActiveCollaborators() {
  const people = useOthers().map((other) => other.info);
  return (
    <ul className="collaborators-list" aria-label="People in this document">
      {people.map((person) => (
        <li key={person.id}>
          <Image
            src={person.avatar}
            alt={person.name}
            title={person.name}
            width={100}
            height={100}
            className="inline-block size-[42px] rounded-full ring-2 ring-dark-100"
            style={{ border: `3px solid ${person.color}` }}
          />
        </li>
      ))}
    </ul>
  );
}
