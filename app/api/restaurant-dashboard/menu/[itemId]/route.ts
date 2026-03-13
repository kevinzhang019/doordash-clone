import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const db = getDb();

  // Verify item belongs to this restaurant
  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(parseInt(itemId), restaurantId);
  if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 });

  try {
    const { name, category, description, price, image_url, is_available, allow_special_requests } = await request.json();

    db.prepare(`
      UPDATE menu_items
      SET name = ?, category = ?, description = ?, price = ?, image_url = ?, is_available = ?, allow_special_requests = ?
      WHERE id = ? AND restaurant_id = ?
    `).run(
      name, category, description, parseFloat(price), image_url,
      is_available ? 1 : 0,
      allow_special_requests ? 1 : 0,
      parseInt(itemId), restaurantId,
    );

    const item = db.prepare('SELECT * FROM menu_items WHERE id = ?').get(parseInt(itemId));
    return Response.json({ item });
  } catch (error) {
    console.error('Update menu item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(parseInt(itemId), restaurantId);
  if (!existing) return Response.json({ error: 'Item not found' }, { status: 404 });

  db.prepare('DELETE FROM menu_items WHERE id = ? AND restaurant_id = ?').run(parseInt(itemId), restaurantId);
  return Response.json({ success: true });
}
