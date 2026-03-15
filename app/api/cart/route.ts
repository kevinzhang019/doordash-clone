import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { CartItem } from '@/lib/types';

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const cartItems = db.prepare(`
      SELECT
        ci.id, ci.user_id, ci.restaurant_id, ci.menu_item_id, ci.quantity, ci.special_requests,
        mi.name, mi.description, mi.price, mi.image_url,
        r.name as restaurant_name
      FROM cart_items ci
      JOIN menu_items mi ON ci.menu_item_id = mi.id
      JOIN restaurants r ON ci.restaurant_id = r.id
      WHERE ci.user_id = ?
      ORDER BY ci.id
    `).all(userId) as CartItem[];

    if (cartItems.length > 0) {
      const ids = cartItems.map(ci => ci.id);
      const allSelections = db.prepare(
        `SELECT cis.*, g.name as group_name
         FROM cart_item_selections cis
         LEFT JOIN menu_item_options o ON o.id = cis.option_id
         LEFT JOIN menu_item_option_groups g ON g.id = o.group_id
         WHERE cis.cart_item_id IN (${ids.map(() => '?').join(',')})
         ORDER BY cis.id`
      ).all(...ids) as { id: number; cart_item_id: number; option_id: number | null; name: string; price_modifier: number; quantity: number; group_name: string | null }[];

      for (const item of cartItems) {
        item.selections = allSelections.filter(s => s.cart_item_id === item.id);
        const selectionTotal = item.selections.reduce((sum, s) => sum + s.price_modifier * (s.quantity ?? 1), 0);
        item.effective_price = (item.price || 0) + selectionTotal;
      }
    }

    return Response.json({ cartItems });
  } catch (error) {
    console.error('Get cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
