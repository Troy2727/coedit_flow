import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useSelf } from '@liveblocks/react/suspense';
import { FilePenLine } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { $suggestEdit, type SuggestEditResult } from '../suggestions';

const ERRORS: Record<Exclude<SuggestEditResult, 'ok'>, string> = {
  empty: 'Type the text to suggest, or select text to suggest deleting it.',
  'unsupported-selection': 'Select plain text within one paragraph (not across links, comments, or other suggestions).',
};

export default function SuggestEditButton() {
  const [editor] = useLexicalComposerContext();
  const self = useSelf();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const author = { id: self.id, name: self.info?.name ?? 'Someone' };

  const submit = () => {
    // editor.update runs the callback synchronously
    let result = 'ok' as SuggestEditResult;
    editor.update(() => {
      result = $suggestEdit(text, author);
    });

    if (result !== 'ok') return setError(ERRORS[result]);

    setText('');
    setError('');
    setOpen(false);
    editor.focus();
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setError('');
      }}
    >
      <PopoverTrigger asChild>
        <button className="toolbar-item spaced" aria-label="Suggest edit" title="Suggest edit">
          <FilePenLine className="toolbar-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 border-dark-400 bg-dark-200 p-3 text-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex flex-col gap-2"
        >
          <p className="text-xs text-blue-100">
            Select text to suggest replacing it (leave the box empty to suggest deleting it), or place the cursor to suggest adding text.
          </p>
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Suggested text"
            aria-label="Suggested text"
            className="rounded-md bg-dark-400 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button type="submit" className="self-end rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium">
            Suggest
          </button>
        </form>
      </PopoverContent>
    </Popover>
  );
}
