// Shared drawing helpers for the profile images: Printed Paper tokens, paper grain,
// and text set as vector paths (GitHub shows SVGs as images, so web fonts can't load).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import opentype from 'opentype.js';

const require = createRequire(import.meta.url);
const fontFile = (pkg, file) => require.resolve(`@fontsource/${pkg}/files/${file}`);
const load = (pkg, file) => {
  const buffer = readFileSync(fontFile(pkg, file));
  return opentype.parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
};

export const fonts = {
  serif: load('instrument-serif', 'instrument-serif-latin-400-normal.woff'),
  serifItalic: load('instrument-serif', 'instrument-serif-latin-400-italic.woff'),
  sans: load('schibsted-grotesk', 'schibsted-grotesk-latin-400-normal.woff'),
  sansMedium: load('schibsted-grotesk', 'schibsted-grotesk-latin-500-normal.woff'),
  sansBold: load('schibsted-grotesk', 'schibsted-grotesk-latin-600-normal.woff'),
  mono: load('geist-mono', 'geist-mono-latin-500-normal.woff'),
};

/** The site's tokens (design/design-system/tokens.json in the portfolio). */
export const THEMES = {
  light: {
    name: 'light', paper: '#f3f3f0', raised: '#fafaf8', sunken: '#e9e9e4', ink: '#14181d', soft: '#2a2f35',
    muted: '#5b6066', rule: '#d9dbd6', cobalt: '#2c57e0', success: '#2f6b3f', bezel: '#14181d',
    heat: ['#e2e3de', '#c3cff6', '#8ea5ef', '#4c70e5', '#1c3ba8'], grain: { color: '0.08 0.09 0.1', opacity: 0.32 },
  },
  dark: {
    name: 'dark', paper: '#0e1216', raised: '#151a20', sunken: '#1b2129', ink: '#e9ecef', soft: '#c3c8cd',
    muted: '#8c949c', rule: '#262d35', cobalt: '#7f9bff', success: '#7cc48e', bezel: '#05070a',
    heat: ['#1a2027', '#1e2b57', '#2d4499', '#4f6cda', '#a5b8ff'], grain: { color: '0.92 0.93 0.95', opacity: 0.11 },
  },
};

/** Paper grain: the same feTurbulence noise as the site's background. */
export function grainDefs(theme, id = 'grain') {
  const [r, g, b] = theme.grain.color.split(' ');
  return `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" stitchTiles="stitch"/>`
    + `<feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  0 0 0 .9 0"/></filter>`;
}
export function paperGround(theme, width, height, radius = 4) {
  return `<rect width="${width}" height="${height}" rx="${radius}" fill="${theme.paper}"/>`
    + `<rect width="${width}" height="${height}" rx="${radius}" filter="url(#grain)" opacity="${theme.grain.opacity}"/>`;
}

const round = (value) => Math.round(value * 100) / 100;

/** Width of a line of text, including letter spacing in em. */
export function measure(text, font, size, tracking = 0) {
  return font.getAdvanceWidth(text, size) + tracking * size * Math.max(0, text.length - 1);
}

/** Text as a filled path. Letter spacing (tracking, in em) is applied per glyph. */
export function text(value, { x, y, font, size, fill, tracking = 0, anchor = 'start' }) {
  const width = measure(value, font, size, tracking);
  let cursor = anchor === 'end' ? x - width : anchor === 'middle' ? x - width / 2 : x;
  if (!tracking) {
    const d = font.getPath(value, cursor, y, size).toPathData(2);
    return d ? `<path d="${d}" fill="${fill}"/>` : '';
  }
  const parts = [];
  for (const char of value) {
    const d = font.getPath(char, cursor, y, size).toPathData(2);
    if (d) parts.push(d);
    cursor += font.getAdvanceWidth(char, size) + tracking * size;
  }
  return `<path d="${parts.join('')}" fill="${fill}"/>`;
}

/** Breaks text into lines that fit a width, keeping words whole. */
export function wrap(value, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of value.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && font.getAdvanceWidth(next, size) > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** The mono label row: "FULL-STACK DEVELOPER · METRO MANILA". */
export function labels(items, { x, y, size = 13, theme, gap = 12 }) {
  let cursor = x;
  const out = [];
  items.forEach((item, index) => {
    const value = (typeof item === 'string' ? item : item.text).toUpperCase();
    const color = typeof item === 'string' ? theme.muted : theme[item.color] ?? theme.muted;
    if (index > 0) {
      out.push(text('·', { x: cursor, y, font: fonts.mono, size, fill: theme.muted }));
      cursor += measure('·', fonts.mono, size) + gap;
    }
    out.push(text(value, { x: cursor, y, font: fonts.mono, size, fill: color, tracking: 0.06 }));
    cursor += measure(value, fonts.mono, size, 0.06) + gap;
  });
  return out.join('');
}

export function svg(width, height, theme, body, title) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${title.replace(/"/g, '&quot;')}">`
    + `<title>${title.replace(/</g, '&lt;')}</title><defs>${grainDefs(theme)}</defs>${body}</svg>\n`;
}

export function save(file, content) {
  mkdirSync(new URL('../assets/', import.meta.url), { recursive: true });
  writeFileSync(new URL(`../assets/${file}`, import.meta.url), content);
}

export { round };
