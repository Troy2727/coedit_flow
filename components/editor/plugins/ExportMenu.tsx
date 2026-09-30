import { $convertToMarkdownString } from '@lexical/markdown';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Download } from 'lucide-react';
import { useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MARKDOWN_TRANSFORMERS } from '../markdownTransformers';

const toFileName = (title: string) => (title.trim() || 'Untitled').replace(/[\\/:*?"<>|]+/g, '-');

export default function ExportMenu({ title }: { title: string }) {
  const [editor] = useLexicalComposerContext();
  const [open, setOpen] = useState(false);

  const downloadMarkdown = () => {
    const markdown = editor.getEditorState().read(() => $convertToMarkdownString(MARKDOWN_TRANSFORMERS));
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));

    const link = document.createElement('a');
    link.href = url;
    link.download = `${toFileName(title)}.md`;
    link.click();
    URL.revokeObjectURL(url);

    setOpen(false);
  };

  // Print styles in globals.css hide the app chrome, so "Save as PDF" gets just the document.
  const printToPdf = () => {
    setOpen(false);
    setTimeout(() => window.print(), 0);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-blue-100 hover:bg-dark-300"
          aria-label="Download"
          title="Download"
        >
          <Download className="size-5" />
          <span className="hidden md:inline">Download</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 border-dark-400 bg-dark-200 p-1 text-white">
        <button onClick={printToPdf} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-dark-400">
          PDF document (.pdf)
        </button>
        <button onClick={downloadMarkdown} className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-dark-400">
          Markdown (.md)
        </button>
      </PopoverContent>
    </Popover>
  );
}
