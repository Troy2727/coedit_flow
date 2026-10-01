import {
  DecoratorNode,
  type DOMExportOutput,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from 'lexical';
import { useFileUrl } from '@liveblocks/react';
import type { JSX } from 'react';

export type SerializedImageNode = Spread<{ src: string; altText: string; fileId?: string }, SerializedLexicalNode>;

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
  // Set for images uploaded to the room's Liveblocks file storage ("fl_..."); src is empty then
  __fileId: string;

  static getType() {
    return 'image';
  }

  static clone(node: ImageNode) {
    return new ImageNode(node.__src, node.__altText, node.__fileId, node.__key);
  }

  static importJSON(json: SerializedImageNode) {
    return $createImageNode(json.src, json.altText, json.fileId);
  }

  // Defaults matter: Lexical builds nodes from Yjs without arguments
  constructor(src = '', altText = '', fileId = '', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__fileId = fileId;
  }

  exportJSON(): SerializedImageNode {
    return { ...super.exportJSON(), type: 'image', version: 1, src: this.__src, altText: this.__altText, fileId: this.__fileId };
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
    if (this.__fileId) return <UploadedImage fileId={this.__fileId} altText={this.__altText} />;
    if (!isSafeImageSrc(this.__src)) return <span>[image removed]</span>;

    // eslint-disable-next-line @next/next/no-img-element -- user-supplied URLs from any host
    return <img src={this.__src} alt={this.__altText} draggable={false} />;
  }
}

/** Fetches a short-lived URL for the uploaded file; Liveblocks checks the viewer's room access. */
function UploadedImage({ fileId, altText }: { fileId: string; altText: string }) {
  const file = useFileUrl(fileId);

  if (file.isLoading) return <span className="text-sm text-blue-100">Loading image…</span>;
  if (file.error) return <span>[image unavailable]</span>;

  // eslint-disable-next-line @next/next/no-img-element -- presigned Liveblocks storage URL
  return <img src={file.url} alt={altText} draggable={false} />;
}

export function $createImageNode(src: string, altText = '', fileId = '') {
  return new ImageNode(src, altText, fileId);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
