export type ItemDeal = {
  deal_type: 'percentage_off' | 'bogo';
  discount_value: number | null;
};

const DEAL_TEMPLATES: ItemDeal[] = [
  { deal_type: 'percentage_off', discount_value: 15 },
  { deal_type: 'percentage_off', discount_value: 20 },
  { deal_type: 'percentage_off', discount_value: 25 },
  { deal_type: 'percentage_off', discount_value: 30 },
  { deal_type: 'bogo', discount_value: null },
];

/** MurmurHash3 finalizer — well-distributed for integers. */
function murmur(n: number): number {
  let h = n >>> 0;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

/** djb2 hash for a string → uint32. */
function hashString(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(33, h) ^ s.charCodeAt(i)) >>> 0;
  return h >>> 0;
}

/**
 * Returns a deterministic deal for a menu item seeded by both item ID and
 * delivery address (~10% of item+address combinations). Returns null otherwise.
 * Changing the delivery address re-rolls which items have deals.
 */
export function getItemDeal(menuItemId: number, address: string): ItemDeal | null {
  const seed = murmur(menuItemId ^ hashString(address));
  if (seed >= 0.05) return null;
  return DEAL_TEMPLATES[Math.floor(murmur((menuItemId ^ hashString(address)) + 999983) * DEAL_TEMPLATES.length)];
}

export function dealLabel(deal: ItemDeal): string {
  return deal.deal_type === 'bogo' ? 'BOGO' : `${deal.discount_value}% Off`;
}

export function dealSavings(deal: ItemDeal, unitPrice: number, quantity: number): number {
  if (deal.deal_type === 'percentage_off' && deal.discount_value) {
    return unitPrice * (deal.discount_value / 100) * quantity;
  }
  if (deal.deal_type === 'bogo') {
    return unitPrice * Math.floor(quantity / 2);
  }
  return 0;
}
