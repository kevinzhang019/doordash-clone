import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import type { DriverJob } from '@/lib/types';

// SF-area coordinates for simulated jobs
const SF_RESTAURANTS = [
  { name: 'The Golden Gate Diner', address: '1 Market St, San Francisco, CA', lat: 37.7945, lng: -122.3954 },
  { name: 'Mission Burrito House', address: '2901 Mission St, San Francisco, CA', lat: 37.7501, lng: -122.4184 },
  { name: 'North Beach Pasta', address: '512 Columbus Ave, San Francisco, CA', lat: 37.7998, lng: -122.4101 },
  { name: 'Sunset Sushi', address: '1316 9th Ave, San Francisco, CA', lat: 37.7639, lng: -122.4671 },
  { name: 'Castro Cafe', address: '4001 18th St, San Francisco, CA', lat: 37.7607, lng: -122.4350 },
];

const DELIVERY_ADDRESSES = [
  { address: '100 Pine St, San Francisco, CA', lat: 37.7922, lng: -122.3982 },
  { address: '250 Polk St, San Francisco, CA', lat: 37.7752, lng: -122.4197 },
  { address: '800 Divisadero St, San Francisco, CA', lat: 37.7757, lng: -122.4376 },
  { address: '3200 Fillmore St, San Francisco, CA', lat: 37.7993, lng: -122.4359 },
  { address: '1500 Haight St, San Francisco, CA', lat: 37.7693, lng: -122.4459 },
  { address: '900 Valencia St, San Francisco, CA', lat: 37.7571, lng: -122.4214 },
];

const ITEM_NAMES = [
  ['Cheeseburger', 'Fries', 'Coke'],
  ['Burrito Bowl', 'Chips & Guac'],
  ['Margherita Pizza', 'Caesar Salad'],
  ['Pad Thai', 'Spring Rolls', 'Thai Iced Tea'],
  ['Spicy Tuna Roll', 'Miso Soup'],
  ['Chicken Tikka Masala', 'Naan'],
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function generateSimulatedJob(): DriverJob {
  const restaurant = SF_RESTAURANTS[Math.floor(Math.random() * SF_RESTAURANTS.length)];
  const delivery = DELIVERY_ADDRESSES[Math.floor(Math.random() * DELIVERY_ADDRESSES.length)];
  const items = ITEM_NAMES[Math.floor(Math.random() * ITEM_NAMES.length)];
  const pay = Math.round(randomBetween(4, 9) * 100) / 100;
  const tip = Math.round(randomBetween(1, 5) * 100) / 100;

  return {
    id: `sim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    isSimulated: true,
    restaurantName: restaurant.name,
    restaurantAddress: restaurant.address,
    restaurantCoords: { lat: restaurant.lat, lng: restaurant.lng },
    deliveryAddress: delivery.address,
    customerCoords: { lat: delivery.lat, lng: delivery.lng },
    items,
    payAmount: pay,
    tip,
  };
}

// Module-level geocode cache
const geocodeCache = new Map<string, { lat: number; lng: number }>();

async function geocodeWithCache(address: string): Promise<{ lat: number; lng: number } | null> {
  if (geocodeCache.has(address)) return geocodeCache.get(address)!;
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) return null;
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`;
    const res = await fetch(url);
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

  const db = getDb();

  // Try to find real unassigned orders
  const realOrders = db.prepare(`
    SELECT o.id, o.delivery_address, o.subtotal, o.tip,
           r.name as restaurant_name, r.address as restaurant_address, r.lat as r_lat, r.lng as r_lng
    FROM orders o
    JOIN restaurants r ON r.id = o.restaurant_id
    WHERE o.status = 'placed' AND o.driver_user_id IS NULL
    ORDER BY o.placed_at DESC
    LIMIT 2
  `).all() as {
    id: number; delivery_address: string; subtotal: number; tip: number;
    restaurant_name: string; restaurant_address: string; r_lat: number | null; r_lng: number | null;
  }[];

  const jobs: DriverJob[] = [];

  for (const order of realOrders) {
    const restaurantCoords = order.r_lat && order.r_lng
      ? { lat: order.r_lat, lng: order.r_lng }
      : await geocodeWithCache(order.restaurant_address);

    const customerCoords = await geocodeWithCache(order.delivery_address);

    if (!restaurantCoords || !customerCoords) continue;

    // Get order items
    const orderItems = db.prepare('SELECT name FROM order_items WHERE order_id = ?').all(order.id) as { name: string }[];
    const pay = Math.round((order.subtotal * 0.1 + 3) * 100) / 100;

    jobs.push({
      id: `order_${order.id}`,
      isSimulated: false,
      orderId: order.id,
      restaurantName: order.restaurant_name,
      restaurantAddress: order.restaurant_address,
      restaurantCoords,
      deliveryAddress: order.delivery_address,
      customerCoords,
      items: orderItems.map(i => i.name),
      payAmount: pay,
      tip: order.tip,
    });
  }

  // Fill with simulated jobs if needed
  const count = Math.max(1, 2 - jobs.length);
  for (let i = 0; i < count; i++) {
    jobs.push(generateSimulatedJob());
  }

  return Response.json({ jobs: jobs.slice(0, 2) });
}
