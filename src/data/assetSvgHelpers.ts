// SPDX-License-Identifier: AGPL-3.0-or-later

export type EyeStyle = 'happy' | 'cool' | 'wide' | 'angry' | 'visor' | 'cyclops' | 'wink' | 'cute';

/**
 * Encodes an SVG markup string into a browser- & Node-safe UTF-8 data URL.
 */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Wraps vector artwork inside a standard 96x96 sprite SVG viewport.
 */
export function wrapSpriteSvg(body: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

/**
 * Wraps wide tile/platform artwork inside a custom viewBox SVG.
 */
export function wrapSizedSvg(w: number, h: number, body: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

/**
 * Wraps stage backdrop artwork inside a 560x360 widescreen SVG viewport.
 */
export function wrapBackdropSvg(body: string, defs = ''): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 360" width="560" height="360">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`;
}

/**
 * Shades a hex color lighter (+amount) or darker (-amount), where amount is in -1..1.
 */
export function shadeHex(hex: string, amount: number): string {
  const clean = hex.replace('#', '').trim();
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const shift = (c: number) => {
    const next = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `#${[shift(r), shift(g), shift(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function drawEyes(
  cx: number,
  cy: number,
  spread: number,
  style: EyeStyle = 'cute',
  irisColor = '#0F172A'
): string {
  const lx = cx - spread;
  const rx = cx + spread;

  if (style === 'visor') {
    return `<rect x="${cx - spread - 9}" y="${cy - 5}" width="${(spread + 9) * 2}" height="10" rx="5" fill="#0F172A" stroke="#38BDF8" stroke-width="2"/><rect x="${cx - spread - 5}" y="${cy - 2}" width="${(spread + 5) * 2}" height="3" rx="1.5" fill="#7DD3FC" opacity="0.85"/>`;
  }
  if (style === 'cyclops') {
    return `<circle cx="${cx}" cy="${cy}" r="11" fill="#FFFFFF" stroke="#0F172A" stroke-width="2.5"/><circle cx="${cx}" cy="${cy}" r="5.5" fill="${irisColor}"/><circle cx="${cx - 2}" cy="${cy - 2}" r="2" fill="#FFFFFF"/>`;
  }
  if (style === 'cool') {
    return `<rect x="${lx - 8}" y="${cy - 5}" width="15" height="9" rx="2.5" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/><rect x="${rx - 7}" y="${cy - 5}" width="15" height="9" rx="2.5" fill="#0F172A" stroke="#38BDF8" stroke-width="1.5"/><line x1="${lx + 7}" y1="${cy - 2}" x2="${rx - 7}" y2="${cy - 2}" stroke="#0F172A" stroke-width="2.5"/><line x1="${lx - 5}" y1="${cy - 2}" x2="${lx + 1}" y2="${cy - 2}" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`;
  }
  if (style === 'angry') {
    return `<circle cx="${lx}" cy="${cy}" r="5" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/><circle cx="${rx}" cy="${cy}" r="5" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/><circle cx="${lx + 1}" cy="${cy}" r="2.5" fill="${irisColor}"/><circle cx="${rx - 1}" cy="${cy}" r="2.5" fill="${irisColor}"/><path d="M${lx - 6} ${cy - 7} L${lx + 4} ${cy - 4}" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/><path d="M${rx + 6} ${cy - 7} L${rx - 4} ${cy - 4}" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (style === 'wink') {
    return `<circle cx="${lx}" cy="${cy}" r="5.2" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/><circle cx="${lx + 0.8}" cy="${cy}" r="2.8" fill="${irisColor}"/><circle cx="${lx - 1.2}" cy="${cy - 1.5}" r="1.4" fill="#FFFFFF"/><path d="M${rx - 4} ${cy} Q${rx} ${cy - 5} ${rx + 4} ${cy}" fill="none" stroke="#0F172A" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  if (style === 'wide') {
    return `<circle cx="${lx}" cy="${cy}" r="6.5" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/><circle cx="${rx}" cy="${cy}" r="6.5" fill="#FFFFFF" stroke="#0F172A" stroke-width="2"/><circle cx="${lx}" cy="${cy}" r="3.4" fill="${irisColor}"/><circle cx="${rx}" cy="${cy}" r="3.4" fill="${irisColor}"/><circle cx="${lx - 1.5}" cy="${cy - 1.8}" r="1.6" fill="#FFFFFF"/><circle cx="${rx - 1.5}" cy="${cy - 1.8}" r="1.6" fill="#FFFFFF"/>`;
  }
  if (style === 'happy') {
    return `<path d="M${lx - 4.5} ${cy + 1} Q${lx} ${cy - 5} ${lx + 4.5} ${cy + 1}" fill="none" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round"/><path d="M${rx - 4.5} ${cy + 1} Q${rx} ${cy - 5} ${rx + 4.5} ${cy + 1}" fill="none" stroke="#0F172A" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  // default 'cute'
  return `<ellipse cx="${lx}" cy="${cy}" rx="4.5" ry="5.5" fill="#0F172A"/><ellipse cx="${rx}" cy="${cy}" rx="4.5" ry="5.5" fill="#0F172A"/><circle cx="${lx - 1.4}" cy="${cy - 1.8}" r="1.7" fill="#FFFFFF"/><circle cx="${rx - 1.4}" cy="${cy - 1.8}" r="1.7" fill="#FFFFFF"/>`;
}

export function drawMouth(cx: number, cy: number, kind: 'smile' | 'cat' | 'grin' | 'fangs' | 'beak' = 'smile'): string {
  if (kind === 'cat') {
    return `<path d="M${cx - 6} ${cy} Q${cx - 3} ${cy + 4} ${cx} ${cy + 1} Q${cx + 3} ${cy + 4} ${cx + 6} ${cy}" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round"/><polygon points="${cx - 2.5},${cy - 3} ${cx + 2.5},${cy - 3} ${cx},${cy}" fill="#FB7185"/>`;
  }
  if (kind === 'grin') {
    return `<path d="M${cx - 7} ${cy - 1} Q${cx} ${cy + 7} ${cx + 7} ${cy - 1} Z" fill="#FFFFFF" stroke="#0F172A" stroke-width="2" stroke-linejoin="round"/>`;
  }
  if (kind === 'fangs') {
    return `<path d="M${cx - 8} ${cy} Q${cx} ${cy + 5} ${cx + 8} ${cy}" fill="none" stroke="#0F172A" stroke-width="2.3" stroke-linecap="round"/><polygon points="${cx - 5},${cy + 1} ${cx - 2},${cy + 1} ${cx - 3.5},${cy + 6}" fill="#FFFFFF"/><polygon points="${cx + 2},${cy + 1} ${cx + 5},${cy + 1} ${cx + 3.5},${cy + 6}" fill="#FFFFFF"/>`;
  }
  if (kind === 'beak') {
    return `<polygon points="${cx - 5},${cy - 2} ${cx + 5},${cy - 2} ${cx},${cy + 6}" fill="#F59E0B" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round"/>`;
  }
  return `<path d="M${cx - 6} ${cy} Q${cx} ${cy + 6} ${cx + 6} ${cy}" fill="none" stroke="#0F172A" stroke-width="2.2" stroke-linecap="round"/>`;
}

export function starDots(seed: number, count = 40, color = '#FFFFFF'): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = ((Math.sin(i * 19.31 + seed) * 43758.54) % 1 + 1) % 1;
    const y = ((Math.sin(i * 73.17 + seed) * 24634.63) % 1 + 1) % 1;
    const r = 0.8 + (i % 3) * 0.7;
    const op = 0.35 + (i % 5) * 0.14;
    out += `<circle cx="${Math.round(x * 560)}" cy="${Math.round(y * 280)}" r="${r.toFixed(1)}" fill="${color}" opacity="${op.toFixed(2)}"/>`;
  }
  return out;
}
