import type { TagColorName } from '../components/tag';

// Matches apps/api's LOW_STOCK_THRESHOLD (apps/api/src/constants/index.ts) — the API already
// filters dashboard "low stock" results at this cutoff, so components consuming that data don't
// need to re-derive it, but it's exposed here for anything (like ProductCard) that colors a Tag
// off a raw stock number instead.
export const LOW_STOCK_THRESHOLD = 10;

export function getStockTag(
  stock: number,
  inStockLabel: string,
  outOfStockLabel: string,
): { content: string; color: TagColorName } {
  if (stock <= 0) {
    return { content: outOfStockLabel, color: 'error' };
  }
  return {
    content: inStockLabel,
    color: stock <= LOW_STOCK_THRESHOLD ? 'pending' : 'success',
  };
}
