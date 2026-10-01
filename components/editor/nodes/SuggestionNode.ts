import {
  $applyNodeReplacement,
  ElementNode,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedElementNode,
  type Spread,
} from 'lexical';

export type SuggestionKind = 'insert' | 'delete';

export type SuggestionAuthor = { id: string; name: string };

export type SerializedSuggestionNode = Spread<
  { kind: SuggestionKind; suggestionId: string; authorId: string; authorName: string; createdAt: number },
  SerializedElementNode
>;

/**
 * Inline wrapper around text that someone suggested inserting or deleting.
 * A suggested replacement is a "delete" and an "insert" node sharing one
 * suggestionId, so they are accepted or rejected together. Being a regular
 * Lexical node, it syncs to collaborators through Yjs like any other content.
 */
export class SuggestionNode extends ElementNode {
  __kind: SuggestionKind;
  __suggestionId: string;
  __authorId: string;
  __authorName: string;
  __createdAt: number;

  static getType() {
    return 'suggestion';
  }

  static clone(node: SuggestionNode) {
    return new SuggestionNode(
      node.__kind,
      node.__suggestionId,
      { id: node.__authorId, name: node.__authorName },
      node.__createdAt,
      node.__key,
    );
  }

  static importJSON(json: SerializedSuggestionNode) {
    return $createSuggestionNode(json.kind, json.suggestionId, { id: json.authorId, name: json.authorName }, json.createdAt);
  }

  // Defaults matter: when loading from Yjs, Lexical constructs nodes without
  // arguments and fills in the synced properties afterwards
  constructor(
    kind: SuggestionKind = 'insert',
    suggestionId = '',
    author: SuggestionAuthor = { id: '', name: '' },
    createdAt = 0,
    key?: NodeKey,
  ) {
    super(key);
    this.__kind = kind;
    this.__suggestionId = suggestionId;
    this.__authorId = author.id;
    this.__authorName = author.name;
    this.__createdAt = createdAt;
  }

  exportJSON(): SerializedSuggestionNode {
    return {
      ...super.exportJSON(),
      type: 'suggestion',
      version: 1,
      kind: this.__kind,
      suggestionId: this.__suggestionId,
      authorId: this.__authorId,
      authorName: this.__authorName,
      createdAt: this.__createdAt,
    };
  }

  createDOM(config: EditorConfig) {
    const element = document.createElement(this.__kind === 'insert' ? 'ins' : 'del');
    const theme = config.theme as { suggestionInsert?: string; suggestionDelete?: string };
    const className = this.__kind === 'insert' ? theme.suggestionInsert : theme.suggestionDelete;
    if (className) element.className = className;
    element.title = `Suggested by ${this.__authorName}`;
    element.dataset.suggestionId = this.__suggestionId;
    return element;
  }

  updateDOM() {
    return false;
  }

  getKind() {
    return this.getLatest().__kind;
  }

  getSuggestionId() {
    return this.getLatest().__suggestionId;
  }

  getAuthorName() {
    return this.getLatest().__authorName;
  }

  getCreatedAt() {
    return this.getLatest().__createdAt;
  }

  isInline() {
    return true;
  }

  // Typing right next to a suggestion goes outside it, as with links
  canInsertTextBefore() {
    return false;
  }

  canInsertTextAfter() {
    return false;
  }

  canBeEmpty() {
    return false;
  }
}

export function $createSuggestionNode(kind: SuggestionKind, suggestionId: string, author: SuggestionAuthor, createdAt = Date.now()) {
  return $applyNodeReplacement(new SuggestionNode(kind, suggestionId, author, createdAt));
}

export function $isSuggestionNode(node: LexicalNode | null | undefined): node is SuggestionNode {
  return node instanceof SuggestionNode;
}
