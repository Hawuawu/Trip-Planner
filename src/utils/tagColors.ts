export interface TagColor {
  bg: string;
  fg: string;
}

// A curated, flat/cel-shaded palette in the spirit of manga & anime color
// design — saturated but not neon, each paired with a text color that stays
// readable on top of it.
const PALETTE: TagColor[] = [
  { bg: '#FF6B9D', fg: '#FFFFFF' }, // Sakura Pink
  { bg: '#3D8BFF', fg: '#FFFFFF' }, // Cerulean Blue
  { bg: '#6FCB63', fg: '#0B2E0A' }, // Matcha Green
  { bg: '#FFD93D', fg: '#3A2E00' }, // Yuzu Yellow
  { bg: '#FF8C42', fg: '#3A1B00' }, // Sunset Orange
  { bg: '#B18CFF', fg: '#241447' }, // Lavender
  { bg: '#2EC4B6', fg: '#06322F' }, // Mint Teal
  { bg: '#FF5A5F', fg: '#FFFFFF' }, // Coral Red
  { bg: '#5C6BC0', fg: '#FFFFFF' }, // Indigo Night
  { bg: '#E76F51', fg: '#FFFFFF' }, // Momiji Red-Orange
  { bg: '#6FD8E8', fg: '#0A3A40' }, // Cotton Candy Blue
  { bg: '#9B59B6', fg: '#FFFFFF' }, // Wisteria Purple
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Deterministic per tag name — the same tag always resolves to the same
// palette entry, so a tag's color stays consistent across every chip it
// appears in and across reloads, rather than reshuffling on each render.
export function getTagColor(tag: string): TagColor {
  return PALETTE[hashString(tag) % PALETTE.length];
}
