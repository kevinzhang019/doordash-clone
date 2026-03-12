/** Pure functions for virtual restaurant positions and delivery calculations. */

function lcg(seed: number): () => number {
  let s = ((seed * 1664525) + 1013904223) >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * Returns a deterministic virtual lat/lng for a restaurant relative to the user's location.
 * Position is consistent per restaurantId — distance is 1–24 miles from the user.
 */
export function getVirtualRestaurantCoords(
  restaurantId: number,
  userLat: number,
  userLng: number
): { lat: number; lng: number } {
  const rng = lcg(restaurantId * 2654435761);
  const angleRad = rng() * 2 * Math.PI;
  const distanceMiles = 1 + rng() * 23;
  const latOffset = (distanceMiles / 69) * Math.cos(angleRad);
  const lngOffset =
    (distanceMiles / (69 * Math.cos((userLat * Math.PI) / 180))) * Math.sin(angleRad);
  return { lat: userLat + latOffset, lng: userLng + lngOffset };
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function deliveryFeeFromDistance(miles: number): number {
  const raw = Math.max(0, Math.min(0.49 + miles * 0.65, 9.99));
  if (raw <= 0) return 0;
  // Round up to nearest $X.49 or $X.99
  const dollars = Math.floor(raw);
  const cents = raw - dollars;
  return cents <= 0.49 ? dollars + 0.49 : dollars + 0.99;
}

export function deliveryTimeFromDistance(miles: number): { min: number; max: number } {
  const min = Math.round(8 + miles * 2.2);
  return { min, max: min + 10 };
}
