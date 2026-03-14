import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import type { DriverJob } from '@/lib/types';

function haversineMiles(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function calcPay(totalMiles: number): number {
  return Math.round(Math.max(3.50, 2.00 + totalMiles * 0.65) * 4) / 4;
}

function calcMinutes(totalMiles: number): number {
  return Math.max(10, Math.round(((totalMiles / 20) * 60 + 6) / 5) * 5);
}

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

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const driverLat = parseFloat(searchParams.get('lat') ?? '');
  const driverLng = parseFloat(searchParams.get('lng') ?? '');
  const driverPos = !isNaN(driverLat) && !isNaN(driverLng) ? { lat: driverLat, lng: driverLng } : null;

  const db = getDb();

  const rows = db.prepare(`
    SELECT o.id, o.delivery_address, o.subtotal, o.tip,
           r.name as restaurant_name, r.address as restaurant_address,
           r.lat as r_lat, r.lng as r_lng,
           daj.added_at
    FROM driver_available_jobs daj
    JOIN orders o ON o.id = daj.order_id
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE daj.driver_user_id = ?
      AND o.driver_user_id IS NULL
      AND o.status IN ('placed', 'preparing', 'ready')
    ORDER BY daj.added_at DESC
  `).all(userId) as {
    id: number; delivery_address: string; subtotal: number; tip: number;
    restaurant_name: string; restaurant_address: string;
    r_lat: number | null; r_lng: number | null; added_at: string;
  }[];

  const jobs: DriverJob[] = [];

  for (const row of rows) {
    const restaurantCoords = row.r_lat && row.r_lng
      ? { lat: row.r_lat, lng: row.r_lng }
      : await geocodeWithCache(row.restaurant_address);
    const customerCoords = await geocodeWithCache(row.delivery_address);
    if (!restaurantCoords || !customerCoords) continue;

    const d1 = driverPos ? haversineMiles(driverPos, restaurantCoords) : 1.5;
    const d2 = haversineMiles(restaurantCoords, customerCoords);
    const totalMiles = d1 + d2;
    const orderItems = db.prepare('SELECT name FROM order_items WHERE order_id = ?').all(row.id) as { name: string }[];

    jobs.push({
      id: `order_${row.id}`,
      isSimulated: false,
      orderId: row.id,
      restaurantName: row.restaurant_name,
      restaurantAddress: row.restaurant_address,
      restaurantCoords,
      deliveryAddress: row.delivery_address,
      customerCoords,
      items: orderItems.map(i => i.name),
      payAmount: calcPay(totalMiles),
      tip: row.tip,
      estimatedMinutes: calcMinutes(totalMiles),
      totalMiles,
    });
  }

  return Response.json({ jobs });
}
