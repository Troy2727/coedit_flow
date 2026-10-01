import { $dfs } from '@lexical/utils';
import {
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  type LexicalNode,
} from 'lexical';
import { nanoid } from 'nanoid';

import {
  $createSuggestionNode,
  $isSuggestionNode,
  type SuggestionAuthor,
  type SuggestionKind,
  type SuggestionNode,
} from './nodes/SuggestionNode';

export type SuggestEditResult = 'ok' | 'empty' | 'unsupported-selection';

export type SuggestionSummary = {
  id: string;
  authorName: string;
  createdAt: number;
  deleted: string;
  inserted: string;
};

/** A paragraph-like block, not an inline element such as a link, comment highlight, or suggestion. */
const isBlock = (node: LexicalNode | null) => $isElementNode(node) && !node.isInline();

/**
 * Turns the current selection into a suggestion: the selected text is marked for
 * deletion and `replacement` (if any) is marked for insertion right after it. With a
 * collapsed selection, `replacement` is suggested as an insertion at the caret.
 *
 * Scope for now: plain text within one paragraph. Selections spanning paragraphs,
 * links, comment highlights, images, or other suggestions are refused, not mangled.
 */
export function $suggestEdit(replacement: string, author: SuggestionAuthor): SuggestEditResult {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return 'unsupported-selection';

  const id = nanoid();
  let deletion: SuggestionNode | null = null;

  if (selection.isCollapsed()) {
    const anchor = selection.anchor.getNode();
    if (!isBlock($isTextNode(anchor) ? anchor.getParent() : anchor)) return 'unsupported-selection';
    if (!replacement) return 'empty';
  } else {
    const selected = selection.getNodes();
    const parent = selected[0]?.getParent() ?? null;
    if (!isBlock(parent) || !selected.every((node) => $isTextNode(node) && node.getParent() === parent)) {
      return 'unsupported-selection';
    }

    // Splits the boundary text nodes so exactly the selected text can be wrapped
    const nodes = selection.extract();
    deletion = $createSuggestionNode('delete', id, author);
    nodes[0].insertBefore(deletion);
    deletion.append(...nodes);
  }

  if (replacement) {
    const insertion = $createSuggestionNode('insert', id, author);
    insertion.append($createTextNode(replacement));
    if (deletion) deletion.insertAfter(insertion);
    else selection.insertNodes([insertion]);
    insertion.selectNext();
  } else {
    deletion?.selectNext();
  }

  return 'ok';
}

const $suggestionNodes = (suggestionId?: string) =>
  $dfs($getRoot())
    .map(({ node }) => node)
    .filter((node): node is SuggestionNode => $isSuggestionNode(node))
    .filter((node) => suggestionId === undefined || node.getSuggestionId() === suggestionId);

/** Accepting keeps the inserted text and drops the deleted text; rejecting does the opposite. */
export function $resolveSuggestion(suggestionId: string, accept: boolean) {
  const keep: SuggestionKind = accept ? 'insert' : 'delete';

  for (const node of $suggestionNodes(suggestionId)) {
    if (node.getKind() === keep) {
      for (const child of node.getChildren()) node.insertBefore(child);
    }
    node.remove();
  }
}

/** Pending suggestions in document order, one entry per suggestion id. */
export function $listSuggestions(): SuggestionSummary[] {
  const byId = new Map<string, SuggestionSummary>();

  for (const node of $suggestionNodes()) {
    const id = node.getSuggestionId();
    const entry = byId.get(id) ?? { id, authorName: node.getAuthorName(), createdAt: node.getCreatedAt(), deleted: '', inserted: '' };
    if (node.getKind() === 'insert') entry.inserted += node.getTextContent();
    else entry.deleted += node.getTextContent();
    byId.set(id, entry);
  }

  return Array.from(byId.values());
}
