import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getVirtualRestaurantCoords, deliveryFeeFromDistance } from '@/lib/restaurantDistance';
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

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const driverLat = parseFloat(searchParams.get('lat') ?? '');
  const driverLng = parseFloat(searchParams.get('lng') ?? '');
  const driverPos = !isNaN(driverLat) && !isNaN(driverLng) ? { lat: driverLat, lng: driverLng } : null;

  const supabase = getSupabaseAdmin();

  // Get available jobs for this driver
  const { data: availableJobRows } = await supabase
    .from('driver_available_jobs')
    .select('order_id, added_at')
    .eq('driver_user_id', userId)
    .order('added_at', { ascending: false });

  if (!availableJobRows || availableJobRows.length === 0) {
    return Response.json({ jobs: [] });
  }

  const orderIds = availableJobRows.map(r => r.order_id);

  // Fetch the orders with restaurant info
  const { data: orders } = await supabase
    .from('orders')
    .select('id, restaurant_id, delivery_address, delivery_lat, delivery_lng, subtotal, tip, delivery_instructions, handoff_option, driver_user_id, status, restaurants(name, address, lat, lng)')
    .in('id', orderIds)
    .is('driver_user_id', null)
    .in('status', ['placed', 'preparing', 'ready']);

  if (!orders || orders.length === 0) {
    return Response.json({ jobs: [] });
  }

  const jobs: DriverJob[] = [];

  for (const row of orders) {
    const restaurant = row.restaurants as unknown as { name: string; address: string; lat: number | null; lng: number | null };

    // Check if restaurant is owned
    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('id')
      .eq('restaurant_id', row.restaurant_id)
      .maybeSingle();
    const isOwned = !!ownerRow;

    const customerCoords = row.delivery_lat && row.delivery_lng
      ? { lat: row.delivery_lat, lng: row.delivery_lng }
      : await geocodeWithCache(row.delivery_address);

    let restaurantCoords: { lat: number; lng: number } | null;
    let restaurantAddress: string;
    if (restaurant.lat && restaurant.lng) {
      restaurantCoords = { lat: restaurant.lat, lng: restaurant.lng };
      restaurantAddress = restaurant.address;
    } else if (isOwned) {
      restaurantAddress = restaurant.address;
      restaurantCoords = await geocodeWithCache(restaurant.address);
      if (!restaurantCoords && customerCoords) {
        restaurantCoords = getVirtualRestaurantCoords(row.restaurant_id, customerCoords.lat, customerCoords.lng);
      }
    } else if (customerCoords) {
      restaurantCoords = getVirtualRestaurantCoords(row.restaurant_id, customerCoords.lat, customerCoords.lng);
      restaurantAddress = await reverseGeocode(restaurantCoords.lat, restaurantCoords.lng);
    } else {
      restaurantCoords = await geocodeWithCache(restaurant.address);
      restaurantAddress = restaurant.address;
    }

    if (!restaurantCoords || !customerCoords) continue;

    const d1 = driverPos ? haversineMiles(driverPos, restaurantCoords) : 1.5;
    const d2 = haversineMiles(restaurantCoords, customerCoords);
    const totalMiles = d1 + d2;

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('name')
      .eq('order_id', row.id);

    jobs.push({
      id: `order_${row.id}`,
      isSimulated: false,
      orderId: row.id,
      restaurantName: restaurant.name,
      restaurantAddress,
      restaurantCoords,
      deliveryAddress: row.delivery_address,
      customerCoords,
      items: (orderItems ?? []).map(i => i.name),
      payAmount: deliveryFeeFromDistance(d2),
      tip: row.tip,
      estimatedMinutes: calcMinutes(totalMiles),
      totalMiles,
      deliveryInstructions: row.delivery_instructions ?? null,
      handoffOption: row.handoff_option ?? 'hand_off',
    });
  }

  return Response.json({ jobs });
}
