import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const db = getDb();
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
  return Response.json({ restaurant });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const body = await request.json();
    const { name, cuisine, description, image_url, delivery_fee, delivery_min, delivery_max, address, lat, lng, is_accepting_orders } = body;

    const db = getDb();

    // If only toggling is_accepting_orders
    if (is_accepting_orders !== undefined && Object.keys(body).length === 1) {
      db.prepare('UPDATE restaurants SET is_accepting_orders = ? WHERE id = ?').run(is_accepting_orders ? 1 : 0, restaurantId);
      const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
      return Response.json({ restaurant });
    }

    if (typeof lat === 'number' && typeof lng === 'number') {
      db.prepare(`
        UPDATE restaurants
        SET name = ?, cuisine = ?, description = ?, image_url = ?, delivery_fee = ?, delivery_min = ?, delivery_max = ?, address = ?, lat = ?, lng = ?,
            is_accepting_orders = COALESCE(?, is_accepting_orders)
        WHERE id = ?
      `).run(name, cuisine, description, image_url, delivery_fee, delivery_min, delivery_max, address, lat, lng,
             is_accepting_orders !== undefined ? (is_accepting_orders ? 1 : 0) : null, restaurantId);
    } else {
      db.prepare(`
        UPDATE restaurants
        SET name = ?, cuisine = ?, description = ?, image_url = ?, delivery_fee = ?, delivery_min = ?, delivery_max = ?,
            address = ?, is_accepting_orders = COALESCE(?, is_accepting_orders)
        WHERE id = ?
      `).run(name, cuisine, description, image_url, delivery_fee, delivery_min, delivery_max, address,
             is_accepting_orders !== undefined ? (is_accepting_orders ? 1 : 0) : null, restaurantId);
    }

    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
    return Response.json({ restaurant });
  } catch (error) {
    console.error('Update restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
