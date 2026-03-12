import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { CartItem } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const cartItems = db.prepare(`
      SELECT
        ci.id, ci.user_id, ci.restaurant_id, ci.menu_item_id, ci.quantity,
        mi.name, mi.description, mi.price, mi.image_url,
        r.name as restaurant_name
      FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      JOIN restaurants r ON ci.restaurant_id = r.id
      WHERE ci.user_id = ?
      ORDER BY ci.id
    `).all(userId) as CartItem[];

    return Response.json({ cartItems });
  } catch (error) {
    console.error('Get cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
