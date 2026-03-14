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
  const deals = db.prepare(`
    SELECT d.id, d.restaurant_id, d.menu_item_id, d.deal_type, d.discount_value, d.is_active, d.created_at,
      m.name as menu_item_name, m.price as menu_item_price
    FROM deals d
    JOIN menu_items m ON m.id = d.menu_item_id
    WHERE d.restaurant_id = ?
    ORDER BY d.created_at DESC
  `).all(restaurantId);

  return Response.json({ deals });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { menu_item_id, deal_type, discount_value } = await request.json();
  if (!menu_item_id || !deal_type) return Response.json({ error: 'Missing fields' }, { status: 400 });
  if (deal_type === 'percentage_off' && (!discount_value || discount_value <= 0 || discount_value >= 100)) {
    return Response.json({ error: 'Discount must be between 1 and 99' }, { status: 400 });
  }

  const db = getDb();

  // Verify item belongs to this restaurant
  const item = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(menu_item_id, restaurantId);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const result = db.prepare(
    'INSERT INTO deals (restaurant_id, menu_item_id, deal_type, discount_value) VALUES (?, ?, ?, ?)'
  ).run(restaurantId, menu_item_id, deal_type, deal_type === 'percentage_off' ? discount_value : null);

  return Response.json({ dealId: result.lastInsertRowid });
}
