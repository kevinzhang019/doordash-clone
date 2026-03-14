import { NextRequest } from 'next/server';
import getDb from '@/db/database';

interface SelectionDraft {
  option_id?: number | null;
  name: string;
  price_modifier?: number;
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { menuItemId, quantity = 1, selections = [] } = await request.json();

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

    // Check for cart conflicts (different restaurant)
    const existingCartItem = db.prepare(
      'SELECT restaurant_id FROM cart_items WHERE user_id = ? LIMIT 1'
    ).get(userId) as { restaurant_id: number } | undefined;

    if (existingCartItem && existingCartItem.restaurant_id !== menuItem.restaurant_id) {
      const existingRestaurant = db.prepare(
        'SELECT name FROM restaurants WHERE id = ?'
      ).get(existingCartItem.restaurant_id) as { name: string };

      return Response.json({
        error: 'Your cart contains items from another restaurant',
        conflictingRestaurant: existingRestaurant.name,
      }, { status: 409 });
    }

    const selectionList: SelectionDraft[] = Array.isArray(selections) ? selections : [];

    // Normalize selections for comparison
    const normalizeSelections = (sels: SelectionDraft[]) =>
      sels.map(s => ({ option_id: s.option_id ?? null, name: s.name?.trim() ?? '', price_modifier: s.price_modifier ?? 0 }))
          .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));

    const newSels = normalizeSelections(selectionList);

    // Read-then-write: find existing cart row with same item + identical selections
    const existingRows = db.prepare(
      'SELECT ci.id FROM cart_items ci WHERE ci.user_id = ? AND ci.menu_item_id = ?'
    ).all(userId, menuItemId) as { id: number }[];

    let matchedCartItemId: number | null = null;

    for (const row of existingRows) {
      const rowSels = db.prepare(
        'SELECT option_id, name, price_modifier FROM cart_item_selections WHERE cart_item_id = ?'
      ).all(row.id) as { option_id: number | null; name: string; price_modifier: number }[];

      const normalizedRowSels = rowSels
        .map(s => ({ option_id: s.option_id, name: s.name, price_modifier: s.price_modifier }))
        .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));

      if (JSON.stringify(normalizedRowSels) === JSON.stringify(newSels)) {
        matchedCartItemId = row.id;
        break;
      }
    }

    const txn = db.transaction(() => {
      if (matchedCartItemId !== null) {
        // Increment quantity on existing row
        db.prepare('UPDATE cart_items SET quantity = quantity + ? WHERE id = ?').run(quantity, matchedCartItemId);
      } else {
        // Insert new row
        const result = db.prepare(
          'INSERT INTO cart_items (user_id, restaurant_id, menu_item_id, quantity) VALUES (?, ?, ?, ?)'
        ).run(userId, menuItem.restaurant_id, menuItemId, quantity);

        const cartItemId = result.lastInsertRowid;

        // Insert selections
        const insertSel = db.prepare(
          'INSERT INTO cart_item_selections (cart_item_id, option_id, name, price_modifier) VALUES (?, ?, ?, ?)'
        );
        for (const sel of newSels) {
          insertSel.run(cartItemId, sel.option_id, sel.name, sel.price_modifier);
        }
      }
    });

    txn();
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
