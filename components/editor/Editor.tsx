'use client';

import { ListItemNode, ListNode } from '@lexical/list';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { AutoLinkPlugin } from '@lexical/react/LexicalAutoLinkPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { ClickableLinkPlugin } from '@lexical/react/LexicalClickableLinkPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
// The non-suspense hook: the suspense one throws when Liveblocks briefly denies a
// newly invited user (403) and crashes the page; this one reports it and retries.
import { useThreads } from '@liveblocks/react';
import {
  FloatingComposer,
  FloatingThreads,
  LiveblocksPlugin,
  liveblocksConfig,
  useIsEditorReady,
} from '@liveblocks/react-lexical';
import { History } from 'lucide-react';
import { useState } from 'react';
import Comments from '../Comments';
import { DeleteModal } from '../DeleteModal';
import Loader from '../Loader';
import VersionHistory from '../VersionHistory';
import { MARKDOWN_TRANSFORMERS } from './markdownTransformers';
import { ImageNode } from './nodes/ImageNode';
import { SuggestionNode } from './nodes/SuggestionNode';
import DocumentOutline from './plugins/DocumentOutline';
import ExportMenu from './plugins/ExportMenu';
import FloatingToolbarPlugin from './plugins/FloatingToolbarPlugin';
import theme from './plugins/Theme';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import WordCount from './plugins/WordCount';
import { AUTO_LINK_MATCHERS, validateUrl } from './url';

const NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  TableNode,
  TableRowNode,
  TableCellNode,
  ImageNode,
  SuggestionNode,
];

interface EditorProps {
  roomId: string;
  currentUserType: UserType;
  isCreator: boolean;
  title: string;
}

/** The shared document: toolbar, Lexical editor synced through Liveblocks, comments and history. */
export function Editor({ roomId, currentUserType, isCreator, title }: EditorProps) {
  const canEdit = currentUserType === 'editor';
  const ready = useIsEditorReady();
  const { threads = [] } = useThreads();
  const [historyOpen, setHistoryOpen] = useState(false);

  const config = liveblocksConfig({
    namespace: 'Editor', // kept: existing documents were created under this namespace
    nodes: NODES,
    theme,
    editable: canEdit,
    onError: (error: Error) => {
      // Rethrow so the error boundary shows it instead of Lexical silently dropping the update.
      console.error(error);
      throw error;
    },
  });

  return (
    <LexicalComposer initialConfig={config}>
      <div className="editor-container size-full">
        <div className="toolbar-wrapper flex min-w-full justify-between">
          {/* Viewers get no toolbar: its buttons would only change their local copy. */}
          {canEdit ? <ToolbarPlugin /> : <div />}
          <div className="flex items-center gap-1">
            <WordCount />
            <ExportMenu title={title} />
            {canEdit && (
              <button
                type="button"
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
          {ready ? (
            <>
              <DocumentOutline />
              <div className="editor-inner relative mb-5 h-fit min-h-[1100px] w-full max-w-[800px] shadow-md lg:mb-10">
                <RichTextPlugin
                  contentEditable={<ContentEditable className="editor-input h-full" />}
                  placeholder={<div className="editor-placeholder">Start writing...</div>}
                  ErrorBoundary={LexicalErrorBoundary}
                />
                {canEdit && <FloatingToolbarPlugin />}
                <HistoryPlugin />
                <AutoFocusPlugin />
                <ListPlugin />
                <CheckListPlugin />
                <TabIndentationPlugin />
                <TablePlugin />
                <LinkPlugin validateUrl={validateUrl} />
                <AutoLinkPlugin matchers={AUTO_LINK_MATCHERS} />
                {/* Editors open links from the link popover; viewers can click them directly. */}
                <ClickableLinkPlugin disabled={canEdit} newTab />
                <MarkdownShortcutPlugin transformers={MARKDOWN_TRANSFORMERS} />
              </div>
            </>
          ) : (
            <Loader />
          )}

          <LiveblocksPlugin>
            <FloatingComposer className="w-[350px]" />
            <FloatingThreads threads={threads} />
            <Comments canResolveSuggestions={canEdit} />
            {canEdit && <VersionHistory roomId={roomId} open={historyOpen} onOpenChange={setHistoryOpen} />}
          </LiveblocksPlugin>
        </div>
      </div>
    </LexicalComposer>
  );
}
