import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getVirtualRestaurantCoords, deliveryFeeFromDistance } from '@/lib/restaurantDistance';
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

// ── Build a DriverJob from an order row ──────────────────────────────────────

type OrderRow = {
  id: number; restaurant_id: number; delivery_address: string; subtotal: number; tip: number;
  delivery_instructions: string | null; handoff_option: string;
  restaurant_name: string; restaurant_address: string;
  r_lat: number | null; r_lng: number | null;
  delivery_lat: number | null; delivery_lng: number | null;
  is_owned: boolean;
};

async function buildJobFromOrder(
  order: OrderRow,
  driverPos: { lat: number; lng: number } | null,
  supabase: ReturnType<typeof getSupabaseAdmin>,
): Promise<DriverJob | null> {
  const customerCoords = order.delivery_lat && order.delivery_lng
    ? { lat: order.delivery_lat, lng: order.delivery_lng }
    : await geocodeWithCache(order.delivery_address);

  let restaurantCoords: { lat: number; lng: number } | null;
  let restaurantAddress: string;
  if (order.r_lat && order.r_lng) {
    restaurantCoords = { lat: order.r_lat, lng: order.r_lng };
    restaurantAddress = order.restaurant_address;
  } else if (order.is_owned) {
    restaurantAddress = order.restaurant_address;
    restaurantCoords = await geocodeWithCache(order.restaurant_address);
    if (!restaurantCoords && customerCoords) {
      restaurantCoords = getVirtualRestaurantCoords(order.restaurant_id, customerCoords.lat, customerCoords.lng);
    }
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

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('name')
    .eq('order_id', order.id);

  return {
    id: `order_${order.id}`,
    isSimulated: false,
    orderId: order.id,
    restaurantName: order.restaurant_name,
    restaurantAddress,
    restaurantCoords,
    deliveryAddress: order.delivery_address,
    customerCoords,
    items: (orderItems ?? []).map(i => i.name),
    payAmount: deliveryFeeFromDistance(d2),
    tip: order.tip,
    estimatedMinutes: calcMinutes(totalMiles),
    totalMiles,
    deliveryInstructions: order.delivery_instructions ?? null,
    handoffOption: order.handoff_option ?? 'hand_off',
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

  const supabase = getSupabaseAdmin();

  // ── 1. Check if driver already has an active (non-expired) dispatched offer ──
  // We need to find orders dispatched to this driver that haven't expired and haven't been accepted
  const now = new Date().toISOString();
  const { data: dispatchedOrders } = await supabase
    .from('orders')
    .select('id, restaurant_id, delivery_address, delivery_lat, delivery_lng, subtotal, tip, delivery_instructions, handoff_option, restaurants(name, address, lat, lng)')
    .eq('dispatched_to', userId)
    .gt('dispatch_expires_at', now)
    .is('driver_user_id', null)
    .in('status', ['placed', 'preparing', 'ready'])
    .limit(1);

  if (dispatchedOrders && dispatchedOrders.length > 0) {
    const d = dispatchedOrders[0];
    const restaurant = d.restaurants as unknown as { name: string; address: string; lat: number | null; lng: number | null };

    // Check if already in driver_available_jobs
    const { data: alreadyAvailable } = await supabase
      .from('driver_available_jobs')
      .select('id')
      .eq('driver_user_id', userId)
      .eq('order_id', d.id)
      .maybeSingle();

    if (!alreadyAvailable) {
      // Check if restaurant is owned
      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('id')
        .eq('restaurant_id', d.restaurant_id)
        .maybeSingle();

      const orderRow: OrderRow = {
        id: d.id, restaurant_id: d.restaurant_id, delivery_address: d.delivery_address,
        subtotal: d.subtotal, tip: d.tip,
        delivery_instructions: d.delivery_instructions, handoff_option: d.handoff_option,
        restaurant_name: restaurant.name, restaurant_address: restaurant.address,
        r_lat: restaurant.lat, r_lng: restaurant.lng,
        delivery_lat: d.delivery_lat, delivery_lng: d.delivery_lng,
        is_owned: !!ownerRow,
      };

      const job = await buildJobFromOrder(orderRow, driverPos, supabase);
      if (job) return Response.json({ jobs: [job] });
    }
  }

  // ── 2. Find candidate orders this driver hasn't declined ──────────────────
  // Get declined order IDs for this driver
  const { data: declinedRows } = await supabase
    .from('driver_job_declines')
    .select('order_id')
    .eq('driver_user_id', userId);
  const declinedIds = (declinedRows ?? []).map(r => r.order_id);

  // Get available job order IDs for this driver
  const { data: availableRows } = await supabase
    .from('driver_available_jobs')
    .select('order_id')
    .eq('driver_user_id', userId);
  const availableIds = (availableRows ?? []).map(r => r.order_id);

  const excludeIds = [...new Set([...declinedIds, ...availableIds])];

  // Fetch candidate orders
  let candidateQuery = supabase
    .from('orders')
    .select('id, restaurant_id, delivery_address, delivery_lat, delivery_lng, subtotal, tip, delivery_instructions, handoff_option, dispatched_to, dispatch_expires_at, restaurants(name, address, lat, lng)')
    .in('status', ['placed', 'preparing', 'ready'])
    .is('driver_user_id', null)
    .order('placed_at', { ascending: true })
    .limit(5);

  if (excludeIds.length > 0) {
    // We need to filter out excluded IDs — use not.in
    candidateQuery = candidateQuery.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data: candidates } = await candidateQuery;

  // Filter for orders that are either not dispatched or have expired dispatch
  const filteredCandidates = (candidates ?? []).filter(c =>
    c.dispatched_to === null || (c.dispatch_expires_at && c.dispatch_expires_at < now)
  );

  // ── 3. Atomically lock one candidate ─────────────────────────────────────
  let lockedOrder: OrderRow | null = null;
  for (const candidate of filteredCandidates) {
    const restaurant = candidate.restaurants as unknown as { name: string; address: string; lat: number | null; lng: number | null };
    const expiresAt = new Date(Date.now() + 15000).toISOString();

    // Try to lock the order
    const { data: updated, error } = await supabase
      .from('orders')
      .update({ dispatched_to: userId, dispatch_expires_at: expiresAt })
      .eq('id', candidate.id)
      .is('driver_user_id', null)
      .select('id')
      .maybeSingle();

    if (!error && updated) {
      // Check if restaurant is owned
      const { data: ownerRow } = await supabase
        .from('restaurant_owners')
        .select('id')
        .eq('restaurant_id', candidate.restaurant_id)
        .maybeSingle();

      lockedOrder = {
        id: candidate.id, restaurant_id: candidate.restaurant_id, delivery_address: candidate.delivery_address,
        subtotal: candidate.subtotal, tip: candidate.tip,
        delivery_instructions: candidate.delivery_instructions, handoff_option: candidate.handoff_option,
        restaurant_name: restaurant.name, restaurant_address: restaurant.address,
        r_lat: restaurant.lat, r_lng: restaurant.lng,
        delivery_lat: candidate.delivery_lat, delivery_lng: candidate.delivery_lng,
        is_owned: !!ownerRow,
      };
      break;
    }
  }

  if (lockedOrder) {
    const job = await buildJobFromOrder(lockedOrder, driverPos, supabase);
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
        payAmount: deliveryFeeFromDistance(d2),
        tip: randomTip(),
        estimatedMinutes: calcMinutes(totalMiles),
        totalMiles,
      }],
    });
  }

  return Response.json({ jobs: [] });
}
