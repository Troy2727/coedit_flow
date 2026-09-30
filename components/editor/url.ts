import { createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin';

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

export const validateUrl = (url: string) => {
  try {
    return ALLOWED_PROTOCOLS.includes(new URL(url).protocol);
  } catch {
    return false;
  }
};

// "example.com" -> "https://example.com"
export const normalizeUrl = (url: string) => {
  const trimmed = url.trim();
  return /^(https?:|mailto:)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const URL_REGEX =
  /((https?:\/\/(www\.)?)|(www\.))[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/;

export const AUTO_LINK_MATCHERS = [createLinkMatcherWithRegExp(URL_REGEX, normalizeUrl)];
