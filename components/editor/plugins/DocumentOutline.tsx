import { TableOfContentsPlugin } from '@lexical/react/LexicalTableOfContentsPlugin';

const INDENT: Record<string, string> = { h1: 'pl-0', h2: 'pl-3', h3: 'pl-6' };

// Google Docs-style outline built from the document's headings.
export default function DocumentOutline() {
  return (
    <TableOfContentsPlugin>
      {(headings, editor) => (
        <nav className="document-outline" aria-label="Document outline">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-blue-100/60">Outline</p>
          {headings.length === 0 ? (
            <p className="text-sm text-blue-100/50">Headings you add to the document will appear here.</p>
          ) : (
            <ul className="space-y-1">
              {headings.map(([key, text, tag]) => (
                <li key={key} className={INDENT[tag] ?? 'pl-6'}>
                  <button
                    onClick={() => editor.getElementByKey(key)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="line-clamp-2 text-left text-sm text-blue-100 hover:text-white"
                  >
                    {text || 'Untitled heading'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
    </TableOfContentsPlugin>
  );
}
