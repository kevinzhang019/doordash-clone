import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import type { DriverSession } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const session = db.prepare(
    'SELECT * FROM driver_sessions WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  ).get(userId) as DriverSession | undefined;

  if (!session) return Response.json({ session: null, activeDelivery: null });

  // Check for an active delivery in this session
  const delivery = db.prepare(`
    SELECT dd.id, dd.order_id, dd.is_simulated,
           dd.restaurant_name, dd.restaurant_address, dd.restaurant_lat, dd.restaurant_lng,
           dd.delivery_address, dd.customer_lat, dd.customer_lng,
           dd.pay_amount, dd.tip, dd.miles, dd.estimated_minutes,
           o.status as order_status
    FROM driver_deliveries dd
    LEFT JOIN orders o ON o.id = dd.order_id
    WHERE dd.session_id = ? AND dd.status = 'accepted'
    ORDER BY dd.accepted_at DESC
    LIMIT 1
  `).get(session.id) as {
    id: number; order_id: number | null; is_simulated: number;
    restaurant_name: string; restaurant_address: string; restaurant_lat: number | null; restaurant_lng: number | null;
    delivery_address: string; customer_lat: number | null; customer_lng: number | null;
    pay_amount: number; tip: number; miles: number; estimated_minutes: number;
    order_status: string | null;
  } | undefined;

  if (!delivery || delivery.is_simulated || !delivery.restaurant_lat || !delivery.customer_lat) {
    return Response.json({ session, activeDelivery: null });
  }

  const phase = delivery.order_status === 'picked_up' ? 'job_accepted_deliver' : 'job_accepted_pickup';

  const job = {
    id: `order_${delivery.order_id}`,
    isSimulated: false,
    orderId: delivery.order_id ?? undefined,
    restaurantName: delivery.restaurant_name,
    restaurantAddress: delivery.restaurant_address,
    restaurantCoords: { lat: delivery.restaurant_lat, lng: delivery.restaurant_lng },
    deliveryAddress: delivery.delivery_address,
    customerCoords: { lat: delivery.customer_lat, lng: delivery.customer_lng },
    items: [] as string[],
    payAmount: delivery.pay_amount,
    tip: delivery.tip,
    estimatedMinutes: delivery.estimated_minutes,
    totalMiles: delivery.miles,
  };

  return Response.json({
    session,
    activeDelivery: {
      deliveryId: delivery.id,
      job,
      phase,
      orderStatus: delivery.order_status,
    },
  });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { action } = await request.json();

  if (action === 'start') {
    // End any existing active sessions first
    db.prepare("UPDATE driver_sessions SET ended_at = datetime('now') WHERE user_id = ? AND ended_at IS NULL").run(userId);

    const result = db.prepare(
      'INSERT INTO driver_sessions (user_id, total_earnings, deliveries_completed) VALUES (?, 0, 0)'
    ).run(userId);

    const session = db.prepare('SELECT * FROM driver_sessions WHERE id = ?').get(result.lastInsertRowid) as DriverSession;
    return Response.json({ session }, { status: 201 });
  }

  if (action === 'end') {
    db.prepare("UPDATE driver_sessions SET ended_at = datetime('now') WHERE user_id = ? AND ended_at IS NULL").run(userId);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
