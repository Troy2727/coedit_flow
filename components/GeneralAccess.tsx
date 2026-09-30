'use client';

import { Globe, Lock } from 'lucide-react';
import { useState } from 'react';

import { updateGeneralAccess } from '@/lib/actions/room.actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';

const DESCRIPTIONS: Record<GeneralAccess, string> = {
  restricted: 'Only people with access can open with the link',
  viewer: 'Anyone signed in with the link can view',
  editor: 'Anyone signed in with the link can edit',
};

const GeneralAccessSection = ({ roomId, initialAccess, canChange }: { roomId: string; initialAccess: GeneralAccess; canChange: boolean }) => {
  const [access, setAccess] = useState(initialAccess);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const changeAccessHandler = async (next: GeneralAccess) => {
    const previous = access;
    setAccess(next);
    setSaving(true);

    const room = await updateGeneralAccess(roomId, next);
    if (!room) setAccess(previous);

    setSaving(false);
  };

  const copyLinkHandler = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 space-y-3 border-t border-dark-400 pt-4">
      <p className="text-sm font-semibold text-white">General access</p>
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-dark-400">
          {access === 'restricted' ? <Lock className="size-4 text-blue-100" /> : <Globe className="size-4 text-blue-100" />}
        </div>
        <div className="flex-1">
          <Select value={access} onValueChange={(value: GeneralAccess) => changeAccessHandler(value)} disabled={!canChange || saving}>
            <SelectTrigger className="shad-select h-auto p-0 text-sm font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-none bg-dark-200">
              <SelectItem value="restricted" className="shad-select-item">Restricted</SelectItem>
              <SelectItem value="viewer" className="shad-select-item">Anyone with the link can view</SelectItem>
              <SelectItem value="editor" className="shad-select-item">Anyone with the link can edit</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-blue-100/70">{saving ? 'Saving...' : DESCRIPTIONS[access]}</p>
        </div>
        <Button type="button" onClick={copyLinkHandler} className="bg-dark-400 px-3 text-sm hover:bg-dark-500">
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>
    </div>
  );
};

export default GeneralAccessSection;
