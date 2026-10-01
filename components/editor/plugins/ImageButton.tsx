import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $insertNodes } from 'lexical';
import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { $createImageNode, isSafeImageSrc } from '../nodes/ImageNode';

export default function ImageButton() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const isValid = isSafeImageSrc(src.trim());

  const insertImage = () => {
    if (!isValid) return;

    editor.update(() => {
      $insertNodes([$createImageNode(src.trim(), altText.trim())]);
    });

    setSrc('');
    setAltText('');
    setOpen(false);
    editor.focus();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="toolbar-item spaced" aria-label="Insert image" title="Insert image">
          <ImageIcon className="toolbar-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 border-dark-400 bg-dark-200 p-3 text-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            insertImage();
          }}
          className="flex flex-col gap-2"
        >
          <input
            autoFocus
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="Image URL (https://...)"
            aria-label="Image URL"
            className="rounded-md bg-dark-400 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          />
          <input
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="Description (alt text)"
            aria-label="Image description"
            className="rounded-md bg-dark-400 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!isValid}
            className="self-end rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
          >
            Insert
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
