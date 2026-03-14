import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { getVirtualRestaurantCoords } from '@/lib/restaurantDistance';
import type { DriverJob } from '@/lib/types';

// ── Geo helpers ──────────────────────────────────────────────────────────────

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function randomCoordWithinMiles(lat: number, lng: number, maxMiles: number): { lat: number; lng: number } {
  const R = 3958.8;
  const maxDist = maxMiles / R;
  const dist = maxDist * Math.sqrt(Math.random());
  const bearing = Math.random() * 2 * Math.PI;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dist) +
    Math.cos(lat1) * Math.sin(dist) * Math.cos(bearing),
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(dist) * Math.cos(lat1),
    Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2),
  );
  return { lat: lat2 * 180 / Math.PI, lng: ((lng2 * 180 / Math.PI) + 540) % 360 - 180 };
}

// ── Pay / time formulas ───────────────────────────────────────────────────────

function calcPay(totalMiles: number): number {
  const raw = 2.00 + totalMiles * 0.65;
  const floored = Math.max(3.50, raw);
  return Math.round(floored * 4) / 4;
}

function calcMinutes(totalMiles: number): number {
  const drive = (totalMiles / 20) * 60;
  return Math.max(10, Math.round((drive + 6) / 5) * 5);
}

function randomTip(): number {
  const steps = [0, 0, 0.5, 0.5, 1, 1, 1.5, 2, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8];
  return steps[Math.floor(Math.random() * steps.length)];
}

// ── Reverse geocode ───────────────────────────────────────────────────────────

const reverseCache = new Map<string, string>();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (reverseCache.has(key)) return reverseCache.get(key)!;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return key;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`,
    );
    const data = await res.json();
    const address: string = data.results?.[0]?.formatted_address ?? key;
    reverseCache.set(key, address);
    return address;
  } catch {
    return key;
  }
}

// ── Forward geocode ───────────────────────────────────────────────────────────

const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodeWithCache(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address)!;
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`,
    );
    const data = await res.json();
    if (data.status === 'OK' && data.results?.[0]) {
      const coords = data.results[0].geometry.location as { lat: number; lng: number };
      geocodeCache.set(address, coords);
      return coords;
    }
  } catch { /* silent */ }
  return null;
}

// ── Build a DriverJob from an order row ──────────────────────────────────────

type OrderRow = {
  id: number; restaurant_id: number; delivery_address: string; subtotal: number; tip: number;
  restaurant_name: string; restaurant_address: string;
  r_lat: number | null; r_lng: number | null;
  delivery_lat: number | null; delivery_lng: number | null;
};

async function buildJobFromOrder(
  order: OrderRow,
  driverPos: { lat: number; lng: number } | null,
  db: ReturnType<typeof getDb>,
): Promise<DriverJob | null> {
  const customerCoords = order.delivery_lat && order.delivery_lng
    ? { lat: order.delivery_lat, lng: order.delivery_lng }
    : await geocodeWithCache(order.delivery_address);

  let restaurantCoords: { lat: number; lng: number } | null;
  let restaurantAddress: string;
  if (order.r_lat && order.r_lng) {
    restaurantCoords = { lat: order.r_lat, lng: order.r_lng };
    restaurantAddress = order.restaurant_address;
  } else if (customerCoords) {
    restaurantCoords = getVirtualRestaurantCoords(order.restaurant_id, customerCoords.lat, customerCoords.lng);
    restaurantAddress = await reverseGeocode(restaurantCoords.lat, restaurantCoords.lng);
  } else {
    restaurantCoords = await geocodeWithCache(order.restaurant_address);
    restaurantAddress = order.restaurant_address;
  }

  if (!restaurantCoords || !customerCoords) return null;

  const d1 = driverPos ? haversineMiles(driverPos, restaurantCoords) : 1.5;
  const d2 = haversineMiles(restaurantCoords, customerCoords);
  const totalMiles = d1 + d2;
  const orderItems = db.prepare('SELECT name FROM order_items WHERE order_id = ?').all(order.id) as { name: string }[];

  return {
    id: `order_${order.id}`,
    isSimulated: false,
    orderId: order.id,
    restaurantName: order.restaurant_name,
    restaurantAddress,
    restaurantCoords,
    deliveryAddress: order.delivery_address,
    customerCoords,
    items: orderItems.map(i => i.name),
    payAmount: calcPay(totalMiles),
    tip: order.tip,
    estimatedMinutes: calcMinutes(totalMiles),
    totalMiles,
  };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const driverLat = parseFloat(searchParams.get('lat') ?? '');
  const driverLng = parseFloat(searchParams.get('lng') ?? '');
  const rangeParam = parseInt(searchParams.get('range') ?? '');
  const simulate = searchParams.get('simulate') === 'true';
  const range = !isNaN(rangeParam) && rangeParam >= 5 && rangeParam <= 100 ? rangeParam : 10;
  const driverPos = !isNaN(driverLat) && !isNaN(driverLng)
    ? { lat: driverLat, lng: driverLng }
    : null;

  const db = getDb();

  // ── 1. Check if driver already has an active (non-expired) dispatched offer ──
  const existingDispatch = db.prepare(`
    SELECT o.id, o.restaurant_id, o.delivery_address, o.delivery_lat, o.delivery_lng, o.subtotal, o.tip,
           r.name as restaurant_name, r.address as restaurant_address,
           r.lat as r_lat, r.lng as r_lng
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.dispatched_to = ? AND o.dispatch_expires_at > datetime('now')
      AND o.driver_user_id IS NULL
      AND o.status IN ('placed', 'preparing', 'ready')
      AND NOT EXISTS (
        SELECT 1 FROM driver_available_jobs
        WHERE driver_user_id = ? AND order_id = o.id
      )
    LIMIT 1
  `).get(userId, userId) as OrderRow | undefined;

  if (existingDispatch) {
    const job = await buildJobFromOrder(existingDispatch, driverPos, db);
    if (job) return Response.json({ jobs: [job] });
  }

  // ── 2. Find candidate orders this driver hasn't declined ──────────────────
  const candidates = db.prepare(`
    SELECT o.id, o.restaurant_id, o.delivery_address, o.delivery_lat, o.delivery_lng, o.subtotal, o.tip,
           r.name as restaurant_name, r.address as restaurant_address,
           r.lat as r_lat, r.lng as r_lng
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.status IN ('placed', 'preparing', 'ready')
      AND o.driver_user_id IS NULL
      AND (o.dispatched_to IS NULL OR o.dispatch_expires_at < datetime('now'))
      AND NOT EXISTS (
        SELECT 1 FROM driver_job_declines
        WHERE driver_user_id = ? AND order_id = o.id
      )
      AND NOT EXISTS (
        SELECT 1 FROM driver_available_jobs
        WHERE driver_user_id = ? AND order_id = o.id
      )
    ORDER BY o.placed_at ASC
    LIMIT 5
  `).all(userId, userId) as OrderRow[];

  // ── 3. Atomically lock one candidate ─────────────────────────────────────
  let lockedOrder: OrderRow | null = null;
  for (const candidate of candidates) {
    const result = db.prepare(`
      UPDATE orders
      SET dispatched_to = ?, dispatch_expires_at = datetime('now', '+15 seconds')
      WHERE id = ?
        AND (dispatched_to IS NULL OR dispatch_expires_at < datetime('now'))
        AND driver_user_id IS NULL
    `).run(userId, candidate.id);
    if (result.changes === 1) {
      lockedOrder = candidate;
      break;
    }
  }

  if (lockedOrder) {
    const job = await buildJobFromOrder(lockedOrder, driverPos, db);
    if (job) return Response.json({ jobs: [job] });
  }

  // ── 4. Simulation (only when no real job found AND simulate=true) ─────────
  if (simulate) {
    const anchor = driverPos ?? { lat: 37.7749, lng: -122.4194 };
    const restaurantCoords = randomCoordWithinMiles(anchor.lat, anchor.lng, range);
    const customerCoords = randomCoordWithinMiles(restaurantCoords.lat, restaurantCoords.lng, range);

    const [restaurantAddress, deliveryAddress] = await Promise.all([
      reverseGeocode(restaurantCoords.lat, restaurantCoords.lng),
      reverseGeocode(customerCoords.lat, customerCoords.lng),
    ]);

    const d1 = driverPos ? haversineMiles(driverPos, restaurantCoords) : haversineMiles(anchor, restaurantCoords);
    const d2 = haversineMiles(restaurantCoords, customerCoords);
    const totalMiles = d1 + d2;

    return Response.json({
      jobs: [{
        id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        isSimulated: true,
        restaurantName: '',
        restaurantAddress,
        restaurantCoords,
        deliveryAddress,
        customerCoords,
        items: [],
        payAmount: calcPay(totalMiles),
        tip: randomTip(),
        estimatedMinutes: calcMinutes(totalMiles),
        totalMiles,
      }],
    });
  }

  return Response.json({ jobs: [] });
}
