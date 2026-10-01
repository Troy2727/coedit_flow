import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $deleteTableColumnAtSelection,
  $deleteTableRowAtSelection,
  $findTableNode,
  $getTableCellNodeFromLexicalNode,
  $insertTableColumnAtSelection,
  $insertTableRowAtSelection,
  INSERT_TABLE_COMMAND,
} from '@lexical/table';
import { $getSelection, $isRangeSelection } from 'lexical';
import { Table } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export default function TableControls() {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);
  const [inTable, setInTable] = useState(false);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        setInTable($isRangeSelection(selection) && $getTableCellNodeFromLexicalNode(selection.anchor.getNode()) !== null);
      });
    });
  }, [editor]);

  const run = (action: () => void) => {
    editor.update(action);
    setOpen(false);
  };

  const insertTable = () => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: '3', columns: '3' });
    setOpen(false);
  };

  const deleteTable = () => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) $findTableNode(selection.anchor.getNode())?.remove();
  };

  const actions: [string, () => void][] = [
    ['Insert row above', () => $insertTableRowAtSelection(false)],
    ['Insert row below', () => $insertTableRowAtSelection(true)],
    ['Insert column left', () => $insertTableColumnAtSelection(false)],
    ['Insert column right', () => $insertTableColumnAtSelection(true)],
    ['Delete row', $deleteTableRowAtSelection],
    ['Delete column', $deleteTableColumnAtSelection],
    ['Delete table', deleteTable],
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={'toolbar-item spaced ' + (inTable ? 'active' : '')} aria-label="Table" title="Table">
          <Table className="toolbar-icon" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="flex w-48 flex-col border-dark-400 bg-dark-200 p-1 text-sm text-white">
        {inTable ? (
          actions.map(([label, action]) => (
            <button key={label} onClick={() => run(action)} className="rounded-md px-3 py-1.5 text-left hover:bg-dark-400">
              {label}
            </button>
          ))
        ) : (
          <button onClick={insertTable} className="rounded-md px-3 py-1.5 text-left hover:bg-dark-400">
            Insert 3 × 3 table
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
