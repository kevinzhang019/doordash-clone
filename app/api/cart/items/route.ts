import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { menuItemId, quantity = 1 } = await request.json();

    if (!menuItemId) {
      return Response.json({ error: 'menuItemId is required' }, { status: 400 });
    }

    const db = getDb();

    // Get menu item with restaurant info
    const menuItem = db.prepare(
      'SELECT mi.*, r.name as restaurant_name FROM menu_items mi JOIN restaurants r ON mi.restaurant_id = r.id WHERE mi.id = ? AND mi.is_available = 1'
    ).get(menuItemId) as { id: number; restaurant_id: number; restaurant_name: string } | undefined;

    if (!menuItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    // Check if cart already has items from a different restaurant
    const existingCartItem = db.prepare(
      'SELECT restaurant_id FROM cart_items WHERE user_id = ? LIMIT 1'
    ).get(userId) as { restaurant_id: number } | undefined;

    if (existingCartItem && existingCartItem.restaurant_id !== menuItem.restaurant_id) {
      // Get existing restaurant name
      const existingRestaurant = db.prepare(
        'SELECT name FROM restaurants WHERE id = ?'
      ).get(existingCartItem.restaurant_id) as { name: string };

      return Response.json({
        error: 'Your cart contains items from another restaurant',
        conflictingRestaurant: existingRestaurant.name,
      }, { status: 409 });
    }

    // Upsert cart item
    db.prepare(`
      INSERT INTO cart_items (user_id, restaurant_id, menu_item_id, quantity)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, menu_item_id) DO UPDATE SET quantity = quantity + excluded.quantity
    `).run(userId, menuItem.restaurant_id, menuItemId, quantity);

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
