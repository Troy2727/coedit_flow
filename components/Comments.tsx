'use client';

// The non-suspense hook, which survives a temporary 403 for new invitees (see Editor.tsx).
import { useThreads } from '@liveblocks/react';
import { useIsThreadActive } from '@liveblocks/react-lexical';
import { Composer, Thread } from '@liveblocks/react-ui';
import type { ThreadData } from '@liveblocks/client';
import { cn } from '@/lib/utils';
import SuggestionsPanel from './editor/plugins/SuggestionsPanel';

/** A comment thread, highlighted while its anchored text is selected and faded once resolved. */
function CommentThread({ thread }: { thread: ThreadData }) {
  const active = useIsThreadActive(thread.id);
  return (
    <Thread
      thread={thread}
      data-state={active ? 'active' : undefined}
      className={cn('comment-thread border', active && '!border-blue-500 shadow-md', thread.resolved && 'opacity-40')}
    />
  );
}

/** The right-hand column: pending suggestions, a new-comment box, then every thread. */
export default function Comments({ canResolveSuggestions }: { canResolveSuggestions: boolean }) {
  const { threads = [] } = useThreads();
  return (
    <aside className="comments-container" aria-label="Comments">
      <SuggestionsPanel canResolve={canResolveSuggestions} />
      <Composer className="comment-composer" />
      {threads.map((thread) => (
        <CommentThread key={thread.id} thread={thread} />
      ))}
    </aside>
  );
}
