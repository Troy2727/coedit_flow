import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { Check, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { $listSuggestions, $resolveSuggestion, type SuggestionSummary } from '../suggestions';

const describe = ({ deleted, inserted }: SuggestionSummary) => {
  if (deleted && inserted) return { verb: 'Replace', from: deleted, to: inserted };
  if (deleted) return { verb: 'Delete', from: deleted, to: '' };
  return { verb: 'Add', from: '', to: inserted };
};

/** Pending suggestions with Accept / Reject, kept in sync with the document. */
export default function SuggestionsPanel({ canResolve }: { canResolve: boolean }) {
  const [editor] = useLexicalComposerContext();
  const [suggestions, setSuggestions] = useState<SuggestionSummary[]>([]);

  useEffect(() => {
    const read = () => editor.getEditorState().read(() => $listSuggestions());
    setSuggestions(read());

    return editor.registerUpdateListener(() => {
      const next = read();
      // Skip re-rendering on every keystroke when the suggestions didn't change
      setSuggestions((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
    });
  }, [editor]);

  if (suggestions.length === 0) return null;

  const resolve = (id: string, accept: boolean) => {
    editor.update(() => $resolveSuggestion(id, accept));
  };

  return (
    <section aria-label="Suggestions" className="suggestions-panel">
      <h3 className="text-sm font-semibold text-white">
        Suggestions <span className="text-blue-100">({suggestions.length})</span>
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {suggestions.map((suggestion) => {
          const { verb, from, to } = describe(suggestion);
          return (
            <li key={suggestion.id} className="suggestion-item" data-suggestion-id={suggestion.id}>
              <p className="text-xs text-blue-100">{suggestion.authorName}</p>
              <p className="mt-1 text-sm text-white">
                {verb}{' '}
                {from && <del className="text-red-300">{from}</del>}
                {from && to && ' with '}
                {to && <ins className="text-green-300 no-underline">{to}</ins>}
              </p>
              {canResolve && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => resolve(suggestion.id, true)}
                    className="flex items-center gap-1 rounded-md bg-green-600/80 px-2 py-1 text-xs text-white hover:bg-green-600"
                    aria-label="Accept suggestion"
                    title="Accept suggestion"
                  >
                    <Check className="size-3.5" /> Accept
                  </button>
                  <button
                    onClick={() => resolve(suggestion.id, false)}
                    className="flex items-center gap-1 rounded-md bg-dark-400 px-2 py-1 text-xs text-white hover:bg-dark-500"
                    aria-label="Reject suggestion"
                    title="Reject suggestion"
                  >
                    <X className="size-3.5" /> Reject
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
