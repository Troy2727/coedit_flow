import { $createLinkNode, $isLinkNode, $toggleLink, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $createTextNode,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_NORMAL,
  KEY_MODIFIER_COMMAND,
} from 'lexical';
import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { normalizeUrl, validateUrl } from '../url';

export default function LinkButton() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return;

          const linkNode = $findMatchingParent(selection.anchor.getNode(), $isLinkNode);
          setLinkUrl($isLinkNode(linkNode) ? linkNode.getURL() : null);
        });
      }),
      // Ctrl/Cmd + K, same shortcut as Google Docs
      editor.registerCommand(
        KEY_MODIFIER_COMMAND,
        (event) => {
          if (event.key.toLowerCase() !== 'k' || !(event.ctrlKey || event.metaKey)) return false;

          event.preventDefault();
          setOpen(true);
          return true;
        },
        COMMAND_PRIORITY_NORMAL,
      ),
    );
  }, [editor]);

  useEffect(() => {
    if (open) setDraft(linkUrl ?? '');
  }, [open, linkUrl]);

  const url = normalizeUrl(draft);
  const isValid = draft.trim() !== '' && validateUrl(url);

  const applyLink = () => {
    if (!isValid) return;

    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      const existingLink = $findMatchingParent(selection.anchor.getNode(), $isLinkNode);

      if (selection.isCollapsed() && $isLinkNode(existingLink)) {
        existingLink.setURL(url);
      } else if (selection.isCollapsed()) {
        // Nothing selected: insert the URL itself as the link text
        const linkNode = $createLinkNode(url);
        linkNode.append($createTextNode(url));
        $insertNodes([linkNode]);
      } else {
        $toggleLink(url);
      }
    });

    setOpen(false);
    editor.focus();
  };

  const removeLink = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    setOpen(false);
    editor.focus();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={'toolbar-item spaced ' + (linkUrl !== null ? 'active' : '')}
          aria-label="Insert link (Ctrl+K)"
          title="Insert link (Ctrl+K)"
        >
          <Link2 className="toolbar-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 border-dark-400 bg-dark-200 p-3 text-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyLink();
          }}
          className="flex flex-col gap-2"
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste or type a link"
            className="rounded-md bg-dark-400 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between gap-2 text-sm">
            <div className="flex gap-3">
              {linkUrl !== null && (
                <>
                  <a href={linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Open
                  </a>
                  <button type="button" onClick={removeLink} className="text-red-400 hover:underline">
                    Remove
                  </button>
                </>
              )}
            </div>
            <button
              type="submit"
              disabled={!isValid}
              className="rounded-md bg-blue-500 px-3 py-1.5 font-medium disabled:opacity-40"
            >
              Apply
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
