import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect, useState } from 'react';

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;

export default function WordCount() {
  const [editor] = useLexicalComposerContext();
  const [words, setWords] = useState(0);

  useEffect(() => {
    setWords(countWords(editor.getEditorState().read(() => $getRoot().getTextContent())));
    return editor.registerTextContentListener((text) => setWords(countWords(text)));
  }, [editor]);

  return (
    <span className="hidden whitespace-nowrap px-2 text-sm text-blue-100/70 sm:inline" aria-live="polite">
      {words} {words === 1 ? 'word' : 'words'}
    </span>
  );
}
