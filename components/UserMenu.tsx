'use client'

import { UserButton, useUser } from '@clerk/nextjs';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';
import { updateCursorColor } from '@/lib/actions/user.actions';
import { cursorColors, getCursorColor } from '@/lib/utils';

const CursorColorPicker = () => {
  const { user } = useUser();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  if (!user) return null;

  const currentColor = getCursorColor(user.id, user.publicMetadata.cursorColor);

  const pickColor = async (color: string) => {
    setSaving(true);
    setStatus('');

    const saved = await updateCursorColor(color);
    if (saved) await user.reload();

    setStatus(saved
      ? 'Saved. Refresh any open documents to see it.'
      : 'Could not save the color. Please try again.');
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-[17px] font-bold">Cursor color</h1>
      <p className="mt-1 text-sm opacity-70">
        Collaborators see your cursor, name tag, and avatar ring in this color.
      </p>

      <div className="mt-6 grid grid-cols-4 gap-4 sm:grid-cols-6">
        {Object.entries(cursorColors).map(([name, color]) => (
          <button
            key={color}
            type="button"
            aria-label={name}
            aria-pressed={color === currentColor}
            disabled={saving}
            onClick={() => pickColor(color)}
            className="flex flex-col items-center gap-1 text-xs disabled:opacity-50"
          >
            <span className="flex size-10 items-center justify-center rounded-full" style={{ backgroundColor: color }}>
              {color === currentColor && <Check className="size-5 text-white" />}
            </span>
            {name}
          </button>
        ))}
      </div>

      {status && <p role="status" className="mt-4 text-sm">{status}</p>}
    </div>
  )
}

const UserMenu = () => {
  return (
    <UserButton afterSignOutUrl="/modern-sign-in">
      <UserButton.MenuItems>
        <UserButton.Action label="Cursor color" labelIcon={<Palette className="size-4" />} open="cursor-color" />
      </UserButton.MenuItems>
      <UserButton.UserProfilePage label="Cursor color" url="cursor-color" labelIcon={<Palette className="size-4" />}>
        <CursorColorPicker />
      </UserButton.UserProfilePage>
    </UserButton>
  )
}

export default UserMenu
