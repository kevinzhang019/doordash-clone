/** Pure functions for virtual restaurant positions and delivery calculations. */

function lcg(seed: number): () => number {
  let s = ((seed * 1664525) + 1013904223) >>> 0;
  return () => {
    s = ((s * 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Hash the user's location into a number so changing address re-randomizes positions. */
function hashCoords(lat: number, lng: number): number {
  const latI = Math.round(lat * 10000);
  const lngI = Math.round(lng * 10000);
  return (((latI * 73856093) ^ (lngI * 19349663)) >>> 0);
}

/**
 * Returns a deterministic virtual lat/lng for a restaurant.
 * Seed combines restaurantId + hashed delivery location, so positions
 * fully re-randomize when the delivery address changes.
 */
export function getVirtualRestaurantCoords(
  restaurantId: number,
  userLat: number,
  userLng: number
): { lat: number; lng: number } {
  const locationHash = hashCoords(userLat, userLng);
  const rng = lcg(((restaurantId * 2654435761) ^ locationHash) >>> 0);
  const angleRad = rng() * 2 * Math.PI;
  const distanceMiles = 1 + rng() * 9;
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
  // DoorDash-like pricing: $1.99 base, +$0.75/mile, capped at $7.99, rounded to .99
  const raw = Math.max(1.99, 1.49 + 0.75 * miles);
  return Math.min(7.99, Math.ceil(raw) - 0.01);
}

export function deliveryTimeFromDistance(miles: number): { min: number; max: number } {
  const min = Math.round(8 + miles * 2.2);
  return { min, max: min + 10 };
}
