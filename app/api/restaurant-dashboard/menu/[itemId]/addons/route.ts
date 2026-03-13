import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const db = getDb();

  // Verify ownership
  const item = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(parseInt(itemId), restaurantId);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const addons = db.prepare('SELECT * FROM menu_item_addons WHERE menu_item_id = ? ORDER BY id').all(parseInt(itemId));
  return Response.json({ addons });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { itemId } = await params;
  const db = getDb();

  const item = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(parseInt(itemId), restaurantId);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  try {
    const { addons } = await request.json();
    if (!Array.isArray(addons)) return Response.json({ error: 'addons must be an array' }, { status: 400 });

    const txn = db.transaction(() => {
      db.prepare('DELETE FROM menu_item_addons WHERE menu_item_id = ?').run(parseInt(itemId));
      const insert = db.prepare('INSERT INTO menu_item_addons (menu_item_id, name, price) VALUES (?, ?, ?)');
      for (const addon of addons) {
        if (addon.name?.trim()) {
          insert.run(parseInt(itemId), addon.name.trim(), parseFloat(addon.price) || 0);
        }
      }
    });
    txn();

    const updated = db.prepare('SELECT * FROM menu_item_addons WHERE menu_item_id = ? ORDER BY id').all(parseInt(itemId));
    return Response.json({ addons: updated });
  } catch (error) {
    console.error('Update addons error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
