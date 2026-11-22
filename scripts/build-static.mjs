// Builds the banner, stack and work-card images in Paper (light) and Night (dark).
// Work cards use the real screenshots, so they are rebuilt on the owner's machine only:
//   SCREENSHOTS_DIR="C:\Users\<you>\Documents" npm run build:static
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import sharp from 'sharp';
import { THEMES, fonts, text, measure, wrap, labels, svg, save, paperGround, grainDefs } from './lib.mjs';
import { HERO, CASE_STUDIES, MORE_WORK, STACK } from './content.mjs';

const logos = JSON.parse(readFileSync(new URL('../data/logos.json', import.meta.url), 'utf8'));
const NEUTRAL = { vb: '0 0 128 128', d: 'M24 24h80v80H24zM36 36v56h56V36z', rule: 'evenodd' };
const shots = process.env.SCREENSHOTS_DIR || join(homedir(), 'Documents');

/** Arrows drawn as strokes (the web font subsets have no arrow glyphs). */
function arrow(kind, x, baseline, size, color) {
  const s = size * 0.62;
  const y = baseline - size * 0.32;
  const d = kind === 'external'
    ? `M${x} ${y + s / 2}L${x + s} ${y - s / 2}M${x + s * 0.3} ${y - s / 2}H${x + s}V${y + s * 0.2}`
    : `M${x} ${y}H${x + s}M${x + s * 0.55} ${y - s * 0.45}L${x + s} ${y}L${x + s * 0.55} ${y + s * 0.45}`;
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${Math.max(1.4, size / 11)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/** Wraps a list joined by middots, so a line never starts with one. */
function wrapList(items, font, size, maxWidth) {
  const lines = [];
  let line = '';
  for (const item of items) {
    const next = line ? `${line} · ${item}` : item;
    if (line && measure(next, font, size) > maxWidth) { lines.push(line); line = item; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function logo(key, x, y, size, fill) {
  const l = logos[key] ?? NEUTRAL;
  const scale = size / 128;
  return `<path d="${l.d}" fill-rule="${l.rule}" fill="${fill}" transform="translate(${x} ${y}) scale(${scale})"/>`;
}

/* ---------- Banner ---------- */
function banner(theme) {
  const W = 1200;
  const pad = 64;
  const size = 68;
  const lineHeight = size * 1.02;
  // Lay out the headline word by word, switching to the cobalt italic for the phrase.
  const words = [
    ...HERO.headline.split(' ').map((word) => ({ word, font: fonts.serif, fill: theme.ink })),
    ...HERO.italic.split(' ').map((word) => ({ word, font: fonts.serifItalic, fill: theme.cobalt })),
  ];
  const maxWidth = W - pad * 2 - 40;
  const lines = [[]];
  let width = 0;
  for (const item of words) {
    const w = measure(item.word, item.font, size);
    const space = lines.at(-1).length ? measure(' ', fonts.serif, size) : 0;
    if (width + space + w > maxWidth && lines.at(-1).length) { lines.push([]); width = 0; }
    width += (lines.at(-1).length ? space : 0) + w;
    lines.at(-1).push(item);
  }
  let y = pad + 40;
  const parts = [labels(HERO.labels, { x: pad, y: pad + 12, theme, size: 14 })];
  y += 70;
  for (const line of lines) {
    let x = pad;
    for (const item of line) {
      parts.push(text(item.word, { x, y, font: item.font, size, fill: item.fill }));
      x += measure(item.word, item.font, size) + measure(' ', fonts.serif, size);
    }
    y += lineHeight;
  }
  y += 20;
  for (const line of wrap(HERO.sub, fonts.sans, 22, 760)) {
    parts.push(text(line, { x: pad, y, font: fonts.sans, size: 22, fill: theme.soft }));
    y += 32;
  }
  const H = Math.round(y + pad - 16);
  return svg(W, H, theme, paperGround(theme, W, H) + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="none" stroke="${theme.rule}"/>` + parts.join(''),
    `${HERO.labels.join(' · ')}. ${HERO.headline} ${HERO.italic} ${HERO.sub}`);
}

/* ---------- Stack: logo + name tiles in six layers ---------- */
function stack(theme) {
  const W = 1200;
  const pad = 40;
  const headW = 260;
  const cols = 4;
  const gap = 12;
  const tileW = (W - pad * 2 - headW - gap * (cols - 1)) / cols;
  const tileH = 64;
  const parts = [];
  let y = pad;
  STACK.forEach(([layer, items], index) => {
    const rows = Math.ceil(items.length / cols);
    const blockH = rows * tileH + (rows - 1) * gap;
    if (index > 0) parts.push(`<rect x="${pad}" y="${y - 20}" width="${W - pad * 2}" height="1" fill="${theme.rule}"/>`);
    parts.push(text(layer, { x: pad, y: y + 30, font: fonts.serif, size: 28, fill: theme.ink }));
    parts.push(text(`${items.length} ${items.length === 1 ? 'TOOL' : 'TOOLS'}`, { x: pad, y: y + 54, font: fonts.mono, size: 12, fill: theme.muted, tracking: 0.06 }));
    items.forEach(([name, key], i) => {
      const x = pad + headW + (i % cols) * (tileW + gap);
      const ty = y + Math.floor(i / cols) * (tileH + gap);
      parts.push(`<rect x="${x + 0.5}" y="${ty + 0.5}" width="${tileW - 1}" height="${tileH - 1}" rx="2" fill="${theme.raised}" stroke="${theme.rule}"/>`);
      parts.push(logo(key, x + 18, ty + (tileH - 30) / 2, 30, theme.ink));
      parts.push(text(name, { x: x + 62, y: ty + tileH / 2 + 6, font: fonts.sansMedium, size: 18, fill: theme.ink }));
    });
    y += blockH + 40;
  });
  const H = Math.round(y - 40 + pad);
  const names = STACK.map(([layer, items]) => `${layer}: ${items.map(([name]) => name).join(', ')}`).join('. ');
  return svg(W, H, theme, paperGround(theme, W, H) + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="none" stroke="${theme.rule}"/>` + parts.join(''), `Stack. ${names}.`);
}

/* ---------- Showcase: desktop browser window with a phone over its corner ---------- */
async function crop(file, width, height) {
  const source = join(shots, file);
  if (!existsSync(source)) throw new Error(`Missing screenshot: ${source}`);
  const buffer = await sharp(source).rotate().resize(width, height, { fit: 'cover', position: 'top' }).jpeg({ quality: 86 }).toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

/** The site's .pp-showcase geometry, in a box of w × h at (x, y). */
async function showcase(project, theme, x, y, w, h, scale) {
  const browserW = w * 0.74;
  const barH = browserW / 20;
  const shotH = browserW / 2;
  const bx = x + w * 0.05;
  const by = y + h * 0.16;
  const phoneW = w * 0.19;
  const inset = phoneW * 0.05;
  const phoneH = (phoneW - inset * 2) * 2 + inset * 2;
  const px = x + w - w * 0.08 - phoneW;
  const py = y + h - h * 0.112 - phoneH;
  const desktop = await crop(project.desktop, Math.round(browserW * scale), Math.round(shotH * scale));
  const phone = await crop(project.phone, Math.round((phoneW - inset * 2) * scale), Math.round((phoneW - inset * 2) * 2 * scale));
  const id = `c${Math.round(x)}${Math.round(y)}`;
  return [
    `<clipPath id="${id}-box"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2"/></clipPath>`,
    `<clipPath id="${id}-screen"><rect x="${px + inset}" y="${py + inset}" width="${phoneW - inset * 2}" height="${(phoneW - inset * 2) * 2}" rx="${phoneW * 0.15}"/></clipPath>`,
    `<g clip-path="url(#${id}-box)">`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${theme.sunken}"/>`,
    `<rect x="${bx + 4}" y="${by + 10}" width="${browserW}" height="${barH + shotH}" rx="3" fill="#000" opacity=".12"/>`,
    `<rect x="${bx}" y="${by}" width="${browserW}" height="${barH + shotH}" rx="3" fill="${theme.raised}" stroke="${theme.rule}"/>`,
    text(project.bar, { x: bx + browserW / 2, y: by + barH * 0.66, font: fonts.mono, size: barH * 0.42, fill: theme.muted, anchor: 'middle' }),
    `<rect x="${bx}" y="${by + barH}" width="${browserW}" height="1" fill="${theme.rule}"/>`,
    `<image href="${desktop}" x="${bx + 0.5}" y="${by + barH + 1}" width="${browserW - 1}" height="${shotH - 1}" preserveAspectRatio="xMidYMin slice"/>`,
    `<rect x="${px + 3}" y="${py + 8}" width="${phoneW}" height="${phoneH}" rx="${phoneW * 0.19}" fill="#000" opacity=".22"/>`,
    `<rect x="${px}" y="${py}" width="${phoneW}" height="${phoneH}" rx="${phoneW * 0.19}" fill="${theme.bezel}"${theme.name === 'dark' ? ` stroke="${theme.rule}"` : ''}/>`,
    `<image href="${phone}" x="${px + inset}" y="${py + inset}" width="${phoneW - inset * 2}" height="${(phoneW - inset * 2) * 2}" clip-path="url(#${id}-screen)" preserveAspectRatio="xMidYMin slice"/>`,
    `</g>`,
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="2" fill="none" stroke="${theme.rule}"/>`,
  ].join('');
}

async function render(name, markup, width) {
  // Rendered to WebP at 2x: embedded screenshots stay crisp and the file stays small.
  const png = await sharp(Buffer.from(markup), { density: 144 }).resize({ width: width * 2 }).webp({ quality: 86 }).toBuffer();
  save(name, png);
}

/* ---------- Case-study card: showcase left, facts right ---------- */
async function caseCard(project, theme) {
  const W = 1200;
  const H = 520;
  const pad = 40;
  const showW = 680;
  const showH = showW * 10 / 16;
  const parts = [await showcase(project, theme, pad, (H - showH) / 2, showW, showH, 2)];
  const tx = pad + showW + 48;
  const tw = W - tx - pad;
  let y = 96;
  parts.push(labels(project.labels, { x: tx, y, theme, size: 13 }));
  y += 62;
  parts.push(text(project.name, { x: tx, y, font: fonts.serif, size: 52, fill: theme.ink }));
  y += 40;
  for (const line of wrap(project.tagline, fonts.sans, 21, tw)) { parts.push(text(line, { x: tx, y, font: fonts.sans, size: 21, fill: theme.soft })); y += 30; }
  y += 14;
  parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="1" fill="${theme.rule}"/>`);
  y += 30;
  parts.push(text('ROLE', { x: tx, y, font: fonts.mono, size: 12, fill: theme.muted, tracking: 0.06 }));
  for (const line of wrap(project.role, fonts.sans, 16, tw - 90)) { parts.push(text(line, { x: tx + 90, y, font: fonts.sans, size: 16, fill: theme.ink })); y += 24; }
  y += 8;
  parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="1" fill="${theme.rule}"/>`);
  y += 30;
  parts.push(text('STACK', { x: tx, y, font: fonts.mono, size: 12, fill: theme.muted, tracking: 0.06 }));
  for (const line of wrapList(project.stack, fonts.sans, 16, tw - 90)) { parts.push(text(line, { x: tx + 90, y, font: fonts.sans, size: 16, fill: theme.ink })); y += 24; }
  y += 34;
  const cta = 'Read the case study';
  parts.push(text(cta, { x: tx, y, font: fonts.sansMedium, size: 18, fill: theme.ink }));
  parts.push(`<rect x="${tx}" y="${y + 7}" width="${measure(cta, fonts.sansMedium, 18)}" height="1.2" fill="${theme.cobalt}"/>`);
  parts.push(arrow('external', tx + measure(cta, fonts.sansMedium, 18) + 10, y, 18, theme.cobalt));
  const body = `<defs>${grainDefs(theme)}</defs>` + paperGround(theme, W, H) + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="none" stroke="${theme.rule}"/>` + parts.join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

/* ---------- More work card: showcase, name, one line, stack ---------- */
async function workCard(project, theme) {
  const W = 400;
  const pad = 16;
  const showW = W - pad * 2;
  const showH = showW * 10 / 16;
  const parts = [await showcase(project, theme, pad, pad, showW, showH, 3)];
  let y = pad + showH + 44;
  parts.push(text(project.name, { x: pad, y, font: fonts.serif, size: 32, fill: theme.ink }));
  y += 30;
  parts.push(text(project.tagline, { x: pad, y, font: fonts.sans, size: 15, fill: theme.soft }));
  y += 28;
  parts.push(text(project.stack.toUpperCase(), { x: pad, y, font: fonts.mono, size: 11, fill: theme.muted, tracking: 0.05 }));
  y += 30;
  parts.push(text('Details', { x: pad, y, font: fonts.sansMedium, size: 15, fill: theme.cobalt }));
  parts.push(arrow('next', pad + measure('Details', fonts.sansMedium, 15) + 8, y, 15, theme.cobalt));
  const H = Math.round(y + pad + 4);
  const body = `<defs>${grainDefs(theme)}</defs>` + paperGround(theme, W, H) + `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="4" fill="none" stroke="${theme.rule}"/>` + parts.join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${body}</svg>`;
}

for (const theme of Object.values(THEMES)) {
  save(`banner-${theme.name}.svg`, banner(theme));
  save(`stack-${theme.name}.svg`, stack(theme));
  for (const project of CASE_STUDIES) await render(`case-${project.slug}-${theme.name}.webp`, await caseCard(project, theme), 1200);
  for (const project of MORE_WORK) await render(`work-${project.slug}-${theme.name}.webp`, await workCard(project, theme), 400);
  console.log(`built ${theme.name}`);
}
