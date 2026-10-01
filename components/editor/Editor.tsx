'use client';

import Theme from './plugins/Theme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { ImageNode } from './nodes/ImageNode';
import { History } from 'lucide-react';
import React, { useState } from 'react';
import { MARKDOWN_TRANSFORMERS } from './markdownTransformers';
import { AUTO_LINK_MATCHERS, validateUrl } from './url';

import { FloatingComposer, FloatingThreads, liveblocksConfig, LiveblocksPlugin, useIsEditorReady } from '@liveblocks/react-lexical'
import Loader from '../Loader';

import FloatingToolbarPlugin from './plugins/FloatingToolbarPlugin'
import DocumentOutline from './plugins/DocumentOutline';
import WordCount from './plugins/WordCount';
import ExportMenu from './plugins/ExportMenu';
// Not the suspense version: that one throws if Liveblocks briefly denies a newly
// invited user (403), crashing the page. This one reports it and Liveblocks retries.
import { useThreads } from '@liveblocks/react';
import Comments from '../Comments';
import { DeleteModal } from '../DeleteModal';
import VersionHistory from '../VersionHistory';

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.

function Placeholder() {
  return <div className="editor-placeholder">Enter some rich text...</div>;
}

export function Editor({ roomId, currentUserType, isCreator, title }: { roomId: string, currentUserType: UserType, isCreator: boolean, title: string }) {
  const ready = useIsEditorReady();
  const threads = useThreads().threads ?? [];
  const [historyOpen, setHistoryOpen] = useState(false);

  const initialConfig = liveblocksConfig({
    namespace: 'Editor',
    nodes: [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, AutoLinkNode, TableNode, TableRowNode, TableCellNode, ImageNode],
    onError: (error: Error) => {
      console.error(error);
      throw error;
    },
    theme: Theme,
    editable: currentUserType === 'editor',
  });

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container size-full">
        <div className="toolbar-wrapper flex min-w-full justify-between">
          {/* Viewers can't edit; toolbar buttons would only change their local copy */}
          {currentUserType === 'editor' ? <ToolbarPlugin /> : <div />}
          <div className="flex items-center gap-1">
            <WordCount />
            <ExportMenu title={title} />
            {currentUserType === 'editor' && (
              <button
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-blue-100 hover:bg-dark-300"
                aria-label="Version history"
                title="Version history"
              >
                <History className="size-5" />
                <span className="hidden md:inline">History</span>
              </button>
            )}
            {isCreator && <DeleteModal roomId={roomId} />}
          </div>
        </div>

        <div className="editor-wrapper flex flex-col items-center justify-start">
          {!ready ? <Loader /> : (
            <>
            <DocumentOutline />
            <div className="editor-inner min-h-[1100px] relative mb-5 h-fit w-full max-w-[800px] shadow-md lg:mb-10">
              <RichTextPlugin
                contentEditable={
                  <ContentEditable className="editor-input h-full" />
                }
                placeholder={<Placeholder />}
                ErrorBoundary={LexicalErrorBoundary}
              />
              {currentUserType === 'editor' && <FloatingToolbarPlugin />}
              <HistoryPlugin />
              <AutoFocusPlugin />
              <ListPlugin />
              <CheckListPlugin />
              <TabIndentationPlugin />
              <TablePlugin />
              <LinkPlugin validateUrl={validateUrl} />
              <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
              {/* Editors follow links from the link popover; viewers can click them directly */}
              <ClickableLinkPlugin disabled={currentUserType === 'editor'} newTab />
              <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
            </div>
            </>
          )}

          <LiveblocksPlugin>
            <FloatingComposer className="w-[350px]" />
            <FloatingThreads threads={threads} />
            <Comments />
            {currentUserType === 'editor' && (
              <VersionHistory roomId={roomId} open={historyOpen} onOpenChange={setHistoryOpen} />
            )}
          </LiveblocksPlugin>
        </div>
      </div>
    </LexicalComposer>
  );
}
