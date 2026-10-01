import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import type { JSX } from 'react';

export type SerializedImageNode = Spread<{ src: string; altText: string }, SerializedLexicalNode>;

// Collaborators can write any src into the shared document, so only render web images
export const isSafeImageSrc = (src: string) => {
  try {
    return ['http:', 'https:'].includes(new URL(src).protocol);
  } catch {
    return false;
  }
};

export class ImageNode extends DecoratorNode<JSX.Element> {
  __src: string;
  __altText: string;

  static getType() {
    return 'image';
  }

  static clone(node: ImageNode) {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  static importJSON(json: SerializedImageNode) {
    return $createImageNode(json.src, json.altText);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  exportJSON(): SerializedImageNode {
    return { ...super.exportJSON(), type: 'image', version: 1, src: this.__src, altText: this.__altText };
  }

  exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    if (isSafeImageSrc(this.__src)) img.src = this.__src;
    img.alt = this.__altText;
    return { element: img };
  }

  createDOM(config: { theme: { image?: string } }) {
    const span = document.createElement('span');
    if (config.theme.image) span.className = config.theme.image;
    return span;
  }

  updateDOM() {
    return false;
  }

  decorate() {
    if (!isSafeImageSrc(this.__src)) return <span>[image removed]</span>;

    // eslint-disable-next-line @next/next/no-img-element -- user-supplied URLs from any host
    return <img src={this.__src} alt={this.__altText} draggable={false} />;
  }
}

export function $createImageNode(src: string, altText = '') {
  return new ImageNode(src, altText);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
