import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { LiveMap } from '@liveblocks/client';
import { useRoom } from '@liveblocks/react/suspense';
import { $insertNodes } from 'lexical';
import { ImageIcon } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { $createImageNode, isSafeImageSrc } from '../nodes/ImageNode';

const UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export default function ImageButton() {
  const [editor] = useLexicalComposerContext();
  const room = useRoom();
  const [open, setOpen] = useState(false);
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isValid = isSafeImageSrc(src.trim());

  const insertImage = (imageSrc: string, alt: string, fileId = '') => {
    editor.update(() => {
      $insertNodes([$createImageNode(imageSrc, alt, fileId)]);
    });

    setSrc('');
    setAltText('');
    setUploadError('');
    setOpen(false);
    editor.focus();
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file) return;
    if (!UPLOAD_TYPES.includes(file.type)) return setUploadError('Use a PNG, JPEG, GIF, or WebP image.');
    if (file.size > MAX_UPLOAD_BYTES) return setUploadError('Images can be up to 5 MB.');

    setUploading(true);
    setUploadError('');
    try {
      const liveFile = await room.uploadFile(file);

      // Also reference the file from the room's Storage, as Liveblocks documents for uploads
      const { root } = await room.getStorage();
      let images = root.get('images');
      if (!images) {
        images = new LiveMap();
        root.set('images', images);
      }
      images.set(liveFile.id, liveFile);

      insertImage('', altText.trim() || file.name, liveFile.id);
    } catch (error) {
      console.error('Image upload failed:', error);
      setUploadError("Couldn't upload the image. Please try again.");
    } finally {
      setUploading(false);
    }
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
            if (isValid) insertImage(src.trim(), altText.trim());
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
          <div className="flex items-center justify-between gap-2">
            <label className="cursor-pointer text-sm text-blue-400 hover:underline">
              {uploading ? 'Uploading…' : 'Upload from computer'}
              <input
                type="file"
                accept={UPLOAD_TYPES.join(',')}
                aria-label="Upload image"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  uploadImage(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium disabled:opacity-40"
            >
              Insert
            </button>
          </div>
          {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
        </form>
      </PopoverContent>
    </Popover>
  );
}
