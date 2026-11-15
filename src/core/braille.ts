// Grade-1 North American / Unified English Braille ASCII-to-Unicode mapping
const BRAILLE_MAP: Record<string, string> = {
  ' ': '⠀',
  a: '⠁',
  b: '⠃',
  c: '⠉',
  d: '⠙',
  e: '⠑',
  f: '⠋',
  g: '⠛',
  h: '⠓',
  i: '⠊',
  j: '⠚',
  k: '⠅',
  l: '⠇',
  m: '⠍',
  n: '⠝',
  o: '⠕',
  p: '⠏',
  q: '⠟',
  r: '⠗',
  s: '⠎',
  t: '⠞',
  u: '⠥',
  v: '⠧',
  w: '⠺',
  x: '⠭',
  y: '⠽',
  z: '⠵',
  '1': '⠼⠁',
  '2': '⠼⠃',
  '3': '⠼⠉',
  '4': '⠼⠙',
  '5': '⠼⠑',
  '6': '⠼⠋',
  '7': '⠼⠛',
  '8': '⠼⠓',
  '9': '⠼⠊',
  '0': '⠼⠚',
  '.': '⠲',
  ',': '⠂',
  ':': '⠒',
  ';': '⠆',
  '-': '⠤',
  '/': '⠌',
  '|': '⠳',
  '>': '⠜',
  '<': '⠣',
  '=': '⠶',
  '(': '⠐⠣',
  ')': '⠐⠜',
  '[': '⠨⠣',
  ']': '⠨⠜',
};

function normalizeForBraille(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .replace(/đ/g, 'd')
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/ı/g, 'i')
    .replace(/[·•]/g, '.')
    .replace(/[—–]/g, '-')
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[。．]/g, '.')
    .replace(/[，、]/g, ',')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function toUnicodeBraille(text: string): string {
  const lower = normalizeForBraille(text);
  let out = '';
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i];
    out += BRAILLE_MAP[ch] ?? '⠐';
  }
  return out;
}

/**
 * Formats linear text into clean fixed-width lines suitable for 40-cell or 80-cell
 * refreshable Braille displays without mid-word splitting where avoidable.
 */
export function chunkForBrailleCells(text: string, cellWidth: 40 | 80 = 40): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return [''];

  const words = normalized.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          lines.push(word.slice(i, i + cellWidth));
        }
      }
    } else if (current.length + 1 + word.length <= cellWidth) {
      current = `${current} ${word}`;
    } else {
      lines.push(current);
      if (word.length <= cellWidth) {
        current = word;
      } else {
        for (let i = 0; i < word.length; i += cellWidth) {
          const slice = word.slice(i, i + cellWidth);
          if (i + cellWidth < word.length) {
            lines.push(slice);
          } else {
            current = slice;
          }
        }
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function formatBrailleAnnouncement(
  moduleTag: string,
  severity: 'info' | 'warning' | 'success',
  summary: string
): string {
  const prefix =
    severity === 'warning' ? 'ALERT' : severity === 'success' ? 'OK' : 'INFO';
  return `[${prefix} ${moduleTag.toUpperCase()}] ${summary}`;
}
