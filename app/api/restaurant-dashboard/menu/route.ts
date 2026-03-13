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
  const items = db.prepare('SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category, name').all(restaurantId);
  return Response.json({ items });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const { name, category, description, price, image_url, is_available, allow_special_requests } = await request.json();

    if (!name?.trim() || !category?.trim() || price === undefined) {
      return Response.json({ error: 'name, category, and price are required' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO menu_items (restaurant_id, name, category, description, price, image_url, is_available, allow_special_requests)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      restaurantId,
      name.trim(),
      category.trim(),
      description?.trim() || '',
      parseFloat(price),
      image_url?.trim() || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80',
      is_available !== false ? 1 : 0,
      allow_special_requests ? 1 : 0,
    );

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(result.lastInsertRowid);
    return Response.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Create menu item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
