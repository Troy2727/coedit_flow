'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isListNode,
  INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $setBlocksType } from '@lexical/selection';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  type ElementFormatType,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  type TextFormatType,
  UNDO_COMMAND,
} from 'lexical';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListChecks,
  ListOrdered,
  type LucideIcon,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import ImageButton from './ImageButton';
import LinkButton from './LinkButton';
import SuggestEditButton from './SuggestEditButton';
import TableControls from './TableControls';
import TextStyleControls from './TextStyleControls';

type Heading = 'h1' | 'h2' | 'h3';
type ListKind = 'bullet' | 'number' | 'check';

// aria-labels are what screen readers announce and what the e2e tests click.
const HEADINGS: { tag: Heading; label: string; icon: LucideIcon }[] = [
  { tag: 'h1', label: 'Heading 1', icon: Heading1 },
  { tag: 'h2', label: 'Heading 2', icon: Heading2 },
  { tag: 'h3', label: 'Heading 3', icon: Heading3 },
];

const TEXT_FORMATS: { format: TextFormatType; label: string; title: string; icon: LucideIcon }[] = [
  { format: 'bold', label: 'Format Bold', title: 'Bold (Ctrl+B)', icon: Bold },
  { format: 'italic', label: 'Format Italics', title: 'Italic (Ctrl+I)', icon: Italic },
  { format: 'underline', label: 'Format Underline', title: 'Underline (Ctrl+U)', icon: Underline },
  { format: 'strikethrough', label: 'Format Strikethrough', title: 'Strikethrough', icon: Strikethrough },
];

const ALIGNMENTS: { align: ElementFormatType; label: string; title: string; icon: LucideIcon }[] = [
  { align: 'left', label: 'Left Align', title: 'Align left', icon: AlignLeft },
  { align: 'center', label: 'Center Align', title: 'Align center', icon: AlignCenter },
  { align: 'right', label: 'Right Align', title: 'Align right', icon: AlignRight },
  { align: 'justify', label: 'Justify Align', title: 'Justify', icon: AlignJustify },
];

const LISTS: { kind: ListKind; label: string; icon: LucideIcon }[] = [
  { kind: 'check', label: 'Checklist', icon: ListChecks },
  { kind: 'bullet', label: 'Bulleted list', icon: List },
  { kind: 'number', label: 'Numbered list', icon: ListOrdered },
];

const LIST_COMMANDS = {
  bullet: INSERT_UNORDERED_LIST_COMMAND,
  number: INSERT_ORDERED_LIST_COMMAND,
  check: INSERT_CHECK_LIST_COMMAND,
};

function ToolButton({
  label,
  title = label,
  icon: Icon,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  title?: string;
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`toolbar-item spaced${active ? ' active' : ''}`}
      aria-label={label}
      aria-pressed={active}
      title={title}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="toolbar-icon" />
    </button>
  );
}

const Divider = () => <div className="divider" aria-hidden />;

/**
 * The block type at the caret: 'h1'..'h3', 'bullet' | 'number' | 'check' for lists,
 * otherwise the node type ('paragraph', 'quote'...). Re-renders on every editor update.
 */
function useCurrentBlock(): string | null {
  const [editor] = useLexicalComposerContext();
  const subscribe = useCallback((notify: () => void) => editor.registerUpdateListener(notify), [editor]);
  const read = useCallback(
    () =>
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return null;
        const node = selection.anchor.getNode();
        const block =
          node.getKey() === 'root'
            ? node
            : ($findMatchingParent(node, (n) => {
                const parent = n.getParent();
                return parent !== null && $isRootOrShadowRoot(parent);
              }) ?? node.getTopLevelElementOrThrow());
        if ($isHeadingNode(block)) return block.getTag();
        if ($isListNode(block)) return block.getListType();
        return block.getType();
      }),
    [editor],
  );
  return useSyncExternalStore(subscribe, read, read);
}

/** Text formats active on the current selection, plus undo/redo availability. */
function useSelectionState() {
  const [editor] = useLexicalComposerContext();
  const [formats, setFormats] = useState<Set<TextFormatType>>(new Set());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(
    () =>
      mergeRegister(
        editor.registerUpdateListener(({ editorState }) =>
          editorState.read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              setFormats(new Set(TEXT_FORMATS.map((f) => f.format).filter((f) => selection.hasFormat(f))));
            }
          }),
        ),
        editor.registerCommand(CAN_UNDO_COMMAND, (can) => (setCanUndo(can), false), COMMAND_PRIORITY_LOW),
        editor.registerCommand(CAN_REDO_COMMAND, (can) => (setCanRedo(can), false), COMMAND_PRIORITY_LOW),
      ),
    [editor],
  );

  return { formats, canUndo, canRedo };
}

/** The editing toolbar above the document (editors only). */
export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const block = useCurrentBlock();
  const { formats, canUndo, canRedo } = useSelectionState();

  // Clicking the active heading turns the block back into a paragraph.
  const setHeading = (tag: Heading) =>
    editor.update(() => {
      const selection = $getSelection();
      $setBlocksType(selection, () => (block === tag ? $createParagraphNode() : $createHeadingNode(tag)));
    });

  const toggleList = (kind: ListKind) =>
    editor.dispatchCommand(block === kind ? REMOVE_LIST_COMMAND : LIST_COMMANDS[kind], undefined);

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo" title="Undo (Ctrl+Z)" icon={Undo2} disabled={!canUndo} onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)} />
      <ToolButton label="Redo" title="Redo (Ctrl+Y)" icon={Redo2} disabled={!canRedo} onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)} />
      <Divider />
      {HEADINGS.map((h) => (
        <ToolButton key={h.tag} label={h.label} icon={h.icon} active={block === h.tag} onClick={() => setHeading(h.tag)} />
      ))}
      <Divider />
      {TEXT_FORMATS.map((f) => (
        <ToolButton
          key={f.format}
          label={f.label}
          title={f.title}
          icon={f.icon}
          active={formats.has(f.format)}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, f.format)}
        />
      ))}
      <Divider />
      <TextStyleControls />
      <LinkButton />
      <ImageButton />
      <SuggestEditButton />
      <Divider />
      {ALIGNMENTS.map((a) => (
        <ToolButton
          key={a.align}
          label={a.label}
          title={a.title}
          icon={a.icon}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, a.align)}
        />
      ))}
      <Divider />
      {LISTS.map((l) => (
        <ToolButton key={l.kind} label={l.label} icon={l.icon} active={block === l.kind} onClick={() => toggleList(l.kind)} />
      ))}
      <Divider />
      <TableControls />
    </div>
  );
}

