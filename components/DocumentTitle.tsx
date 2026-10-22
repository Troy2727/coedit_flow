'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { updateDocument } from '@/lib/actions/room.actions';
import { Input } from './ui/input';

/**
 * The document name in the header. Editors click the pencil to rename; Enter or
 * clicking anywhere else saves. Viewers see a "View only" tag instead.
 */
export default function DocumentTitle({ roomId, initialTitle, canEdit, onRenamed }: {
  roomId: string;
  initialTitle: string;
  canEdit: boolean;
  onRenamed: (title: string) => void;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [savedTitle, setSavedTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  async function save(next: string) {
    setEditing(false);
    if (next === savedTitle) return;
    setSaving(true);
    if (await updateDocument(roomId, next)) {
      setSavedTitle(next);
      onRenamed(next);
    }
    setSaving(false);
  }

  // Clicking outside the title while renaming saves, like pressing Enter.
  useEffect(() => {
    if (!editing) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) save(title);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  });

  return (
    <div ref={wrapperRef} className="flex w-fit items-center justify-center gap-2">
      {editing ? (
        <Input
          autoFocus
          value={title}
          placeholder="Enter title"
          aria-label="Document title"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save(title)}
          className="document-title-input"
        />
      ) : (
        <p className="document-title">{title}</p>
      )}

      {canEdit && !editing && !saving && (
        <button type="button" className="pointer" aria-label="Rename document" onClick={() => setEditing(true)}>
          <Image src="/assets/icons/edit.svg" alt="edit" width={24} height={24} />
        </button>
      )}
      {!canEdit && <p className="view-only-tag">View only</p>}
      {saving && <p className="text-sm text-gray-400">saving...</p>}
    </div>
  );
}
