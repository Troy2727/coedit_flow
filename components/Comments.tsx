import { cn } from '@/lib/utils';
import { useIsThreadActive } from '@liveblocks/react-lexical';
import { Composer, Thread } from '@liveblocks/react-ui';
// Not the suspense version, which would crash the page on a temporary 403 (see Editor.tsx)
import { useThreads } from '@liveblocks/react';
import React from 'react'
import SuggestionsPanel from './editor/plugins/SuggestionsPanel';

const ThreadWrapper = ({ thread }: ThreadWrapperProps) => {
  const isActive = useIsThreadActive(thread.id);

  return (
    <Thread 
      thread={thread}
      data-state={isActive ? 'active' : null}
      className={cn('comment-thread border', 
        isActive && '!border-blue-500 shadow-md',
        thread.resolved && 'opacity-40'
      )}
    />
  )
}

// The right-hand column: pending suggestions, then comments
const Comments = ({ canResolveSuggestions }: { canResolveSuggestions: boolean }) => {
  const threads = useThreads().threads ?? [];

  return (
    <div className="comments-container">
      <SuggestionsPanel canResolve={canResolveSuggestions} />
      <Composer className="comment-composer" />

      {threads.map((thread) => (
        <ThreadWrapper key={thread.id} thread={thread} />
      ))}
    </div>
  )
}

export default Comments