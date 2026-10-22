'use client';

import { autoUpdate, flip, hide, offset, shift, useFloating } from '@floating-ui/react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { OPEN_FLOATING_COMPOSER_COMMAND } from '@liveblocks/react-lexical';
import { $getSelection, $isRangeSelection } from 'lexical';
import { MessageSquarePlus } from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const EDGE_PADDING = 20;

/**
 * The browser's selection range, when the editor has a non-empty text selection.
 * Lexical mirrors its selection into the DOM, so after an update the native
 * range is exactly what the user highlighted.
 */
function useHighlightedRange(): [Range | null, (range: Range | null) => void] {
  const [editor] = useLexicalComposerContext();
  const [range, setRange] = useState<Range | null>(null);

  useEffect(
    () =>
      editor.registerUpdateListener(({ editorState, tags }) => {
        // Other people's edits arrive tagged 'collaboration'; they must not move our button.
        if (tags.has('collaboration')) return;
        const hasHighlight = editorState.read(() => {
          const selection = $getSelection();
          return $isRangeSelection(selection) && !selection.isCollapsed();
        });
        const native = window.getSelection();
        setRange(hasHighlight && native && native.rangeCount > 0 ? native.getRangeAt(0).cloneRange() : null);
      }),
    [editor],
  );

  return [range, setRange];
}

/** A "Comment" button that follows highlighted text and opens the Liveblocks composer. */
function CommentButton({ range, onOpened }: { range: Range; onOpened: () => void }) {
  const [editor] = useLexicalComposerContext();
  const { refs, floatingStyles } = useFloating({
    strategy: 'fixed',
    placement: 'bottom',
    middleware: [offset(10), flip({ padding: EDGE_PADDING }), shift({ padding: EDGE_PADDING }), hide({ padding: EDGE_PADDING })],
    whileElementsMounted: (reference, floating, update) =>
      autoUpdate(reference, floating, update, { animationFrame: true }),
  });

  // Anchor to the highlighted text itself, re-measured as the page scrolls.
  useLayoutEffect(() => {
    refs.setReference({ getBoundingClientRect: () => range.getBoundingClientRect() });
  }, [refs, range]);

  const openComposer = () => {
    if (editor.dispatchCommand(OPEN_FLOATING_COMPOSER_COMMAND, undefined)) onOpened();
  };

  return createPortal(
    <div ref={refs.setFloating} style={{ ...floatingStyles, minWidth: 'max-content' }}>
      <div className="floating-toolbar">
        <button type="button" className="floating-toolbar-btn" aria-label="Comment" title="Comment" onClick={openComposer}>
          <MessageSquarePlus className="size-6" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default function FloatingToolbarPlugin() {
  const [range, setRange] = useHighlightedRange();
  return range ? <CommentButton range={range} onOpened={() => setRange(null)} /> : null;
}
