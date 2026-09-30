import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelectionStyleValueForProperty, $patchStyleText } from '@lexical/selection';
import { $getSelection, $isRangeSelection } from 'lexical';
import { Baseline, Highlighter, Minus, Plus } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const DEFAULT_FONT_SIZE = 15; // matches .editor-input
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;

const PALETTE = [
  '#ffffff', '#cccccc', '#999999', '#666666', '#000000',
  '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af',
  '#6fa8dc', '#8e7cc3', '#c27ba0', '#cc0000', '#e69138',
  '#f1c232', '#6aa84f', '#45818e', '#3d85c6', '#674ea7',
];

type StyleProperty = 'font-size' | 'color' | 'background-color';

export default function TextStyleControls() {
  const [editor] = useLexicalComposerContext();
  const [fontSize, setFontSize] = useState(String(DEFAULT_FONT_SIZE));
  const [color, setColor] = useState('');
  const [highlight, setHighlight] = useState('');

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        // Empty string means the selection has mixed values
        const size = $getSelectionStyleValueForProperty(selection, 'font-size', `${DEFAULT_FONT_SIZE}px`);
        setFontSize(size === '' ? '' : String(parseInt(size, 10)));
        setColor($getSelectionStyleValueForProperty(selection, 'color', ''));
        setHighlight($getSelectionStyleValueForProperty(selection, 'background-color', ''));
      });
    });
  }, [editor]);

  const applyStyle = (property: StyleProperty, value: string | null) => {
    editor.update(() => {
      const selection = $getSelection();
      if (selection !== null) $patchStyleText(selection, { [property]: value });
    });
  };

  const applyFontSize = (size: number) => {
    if (Number.isNaN(size)) return;

    const clamped = Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, size));
    setFontSize(String(clamped));
    applyStyle('font-size', `${clamped}px`);
  };

  const currentSize = parseInt(fontSize, 10) || DEFAULT_FONT_SIZE;

  return (
    <>
      <div className="flex items-center">
        <button className="toolbar-item" aria-label="Decrease font size" title="Decrease font size" onClick={() => applyFontSize(currentSize - 1)}>
          <Minus className="toolbar-icon" />
        </button>
        <input
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              applyFontSize(parseInt(fontSize, 10));
              editor.focus();
            }
          }}
          aria-label="Font size"
          title="Font size"
          className="font-size-input"
        />
        <button className="toolbar-item spaced" aria-label="Increase font size" title="Increase font size" onClick={() => applyFontSize(currentSize + 1)}>
          <Plus className="toolbar-icon" />
        </button>
      </div>

      <ColorPicker
        label="Text color"
        icon={<Baseline className="toolbar-icon" />}
        value={color}
        onChange={(value) => applyStyle('color', value)}
      />
      <ColorPicker
        label="Highlight color"
        icon={<Highlighter className="toolbar-icon" />}
        value={highlight}
        onChange={(value) => applyStyle('background-color', value)}
      />
    </>
  );
}

function ColorPicker({
  label,
  icon,
  value,
  onChange,
}: {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="toolbar-item spaced flex-col items-center" aria-label={label} title={label}>
          {icon}
          <span className="mt-0.5 h-[3px] w-[18px] rounded-sm" style={{ backgroundColor: value || 'transparent' }} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-dark-400 bg-dark-200 p-3 text-white">
        <p className="mb-2 text-xs text-blue-100">{label}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {PALETTE.map((swatch) => (
            <button
              key={swatch}
              onClick={() => choose(swatch)}
              aria-label={swatch}
              className={'size-6 rounded-full border border-dark-500 ' + (value === swatch ? 'ring-2 ring-blue-500' : '')}
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
        <button onClick={() => choose(null)} className="mt-3 w-full rounded-md bg-dark-400 py-1.5 text-sm hover:bg-dark-500">
          Reset
        </button>
      </PopoverContent>
    </Popover>
  );
}
