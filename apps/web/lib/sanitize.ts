import sanitizeHtmlLib from 'sanitize-html';

/**
 * Allowed HTML tags for sanitization
 */
const ALLOWED_TAGS = [
  // Text formatting
  'b', 'i', 'em', 'strong', 'u', 's', 'strike',
  // Headings
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  // Structure
  'p', 'br', 'hr', 'div', 'span',
  // Lists
  'ul', 'ol', 'li',
  // Links and media
  'a', 'img',
  // Quotes and code
  'blockquote', 'code', 'pre',
];

/**
 * Allowed HTML attributes per tag
 */
const ALLOWED_ATTR: sanitizeHtmlLib.IOptions['allowedAttributes'] = {
  a: ['href', 'title', 'target', 'rel', 'class'],
  img: ['src', 'alt', 'title', 'width', 'height', 'class'],
  '*': ['class'],
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * Used for user-generated content from CMS (articles, news, glossary)
 *
 * Uses sanitize-html which works natively in Node.js (no JSDOM required)
 * for reliable SSG builds.
 */
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTR,
    // Transform all links to be safe
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    },
    // Disallow javascript: URLs
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
  });
}

/**
 * Sanitize plain text (strips all HTML)
 * Used for excerpts, meta descriptions, etc.
 */
export function sanitizeText(text: string): string {
  return sanitizeHtmlLib(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
}
