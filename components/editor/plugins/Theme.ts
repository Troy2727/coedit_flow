import type { EditorThemeClasses } from 'lexical';

// Lexical tags each node it renders with these classes; styles/editor.css
// styles them and the e2e tests select on several (editor-text-bold, editor-list-ol...).
const cls = (name: string) => `editor-${name}`;

const theme: EditorThemeClasses = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: cls('paragraph'),
  quote: cls('quote'),
  code: cls('code'),
  link: cls('link'),
  image: cls('image'),
  heading: Object.fromEntries(['h1', 'h2', 'h3', 'h4', 'h5'].map((h) => [h, cls(`heading-${h}`)])),
  list: {
    ol: cls('list-ol'),
    ul: cls('list-ul'),
    listitem: cls('listitem'),
    listitemChecked: cls('listitem-checked'),
    listitemUnchecked: cls('listitem-unchecked'),
    nested: { listitem: cls('nested-listitem') },
  },
  table: cls('table'),
  tableCell: cls('table-cell'),
  tableCellHeader: cls('table-cell-header'),
  tableSelection: cls('table-selection'),
  tableCellSelected: cls('table-cell-selected'),
  text: Object.fromEntries(
    ['bold', 'italic', 'underline', 'strikethrough', 'underlineStrikethrough', 'code', 'hashtag', 'overflowed'].map(
      (format) => [format, cls(`text-${format}`)],
    ),
  ),
  // Custom keys read by SuggestionNode
  suggestionInsert: cls('suggestion-insert'),
  suggestionDelete: cls('suggestion-delete'),
};

export default theme;
