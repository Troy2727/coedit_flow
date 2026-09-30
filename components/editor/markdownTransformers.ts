import {
  CHECK_LIST,
  HEADING,
  LINK,
  ORDERED_LIST,
  QUOTE,
  TEXT_FORMAT_TRANSFORMERS,
  UNORDERED_LIST,
} from '@lexical/markdown';

// Only transformers whose nodes are registered in Editor.tsx.
// CHECK_LIST must come before UNORDERED_LIST so "- [ ] " isn't read as a bullet.
export const MARKDOWN_TRANSFORMERS = [
  HEADING,
  QUOTE,
  CHECK_LIST,
  UNORDERED_LIST,
  ORDERED_LIST,
  ...TEXT_FORMAT_TRANSFORMERS,
  LINK,
];
