export type AddressDeal = {
  deal_type: 'percentage_off' | 'bogo';
  discount_value: number | null;
};

const DEAL_TEMPLATES: AddressDeal[] = [
  { deal_type: 'percentage_off', discount_value: 15 },
  { deal_type: 'percentage_off', discount_value: 20 },
  { deal_type: 'percentage_off', discount_value: 25 },
  { deal_type: 'percentage_off', discount_value: 30 },
  { deal_type: 'bogo', discount_value: null },
];

export function seededRng(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(33, h) ^ seed.charCodeAt(i)) >>> 0;
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

/**
 * Returns a deterministic deal for a restaurant given a delivery address,
 * or null (~30% of the time) so not every restaurant always has one.
 */
export function getAddressDeal(address: string, restaurantId: number): AddressDeal | null {
  if (!address) return null;
  const rng = seededRng(`${address}|${restaurantId}`);
  if (rng() < 0.3) return null;
  return DEAL_TEMPLATES[Math.floor(rng() * DEAL_TEMPLATES.length)];
}

export function dealLabel(deal: AddressDeal): string {
  return deal.deal_type === 'bogo' ? 'BOGO' : `${deal.discount_value}% Off`;
}

/** Savings for one cart item given an address-based deal (applies to all items). */
export function dealSavings(deal: AddressDeal, unitPrice: number, quantity: number): number {
  if (deal.deal_type === 'percentage_off' && deal.discount_value) {
    return unitPrice * (deal.discount_value / 100) * quantity;
  }
  if (deal.deal_type === 'bogo') {
    return unitPrice * Math.floor(quantity / 2);
  }
  return 0;
}
