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

  const item = db.prepare('SELECT id FROM menu_items WHERE id = ? AND restaurant_id = ?').get(parseInt(itemId), restaurantId);
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const groups = db.prepare(
    'SELECT * FROM menu_item_option_groups WHERE menu_item_id = ? ORDER BY sort_order, id'
  ).all(parseInt(itemId)) as { id: number; menu_item_id: number; name: string; required: number; max_selections: number | null; sort_order: number }[];

  const options = groups.length > 0
    ? db.prepare(
        `SELECT * FROM menu_item_options WHERE group_id IN (${groups.map(() => '?').join(',')}) ORDER BY sort_order, id`
      ).all(...groups.map(g => g.id)) as { id: number; group_id: number; name: string; price_modifier: number; sort_order: number }[]
    : [];

  const grouped = groups.map(g => ({
    ...g,
    options: options.filter(o => o.group_id === g.id),
  }));

  return Response.json({ groups: grouped });
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
    const { groups } = await request.json();
    if (!Array.isArray(groups)) return Response.json({ error: 'groups must be an array' }, { status: 400 });

    const txn = db.transaction(() => {
      db.prepare('DELETE FROM menu_item_option_groups WHERE menu_item_id = ?').run(parseInt(itemId));
      const insertGroup = db.prepare(
        'INSERT INTO menu_item_option_groups (menu_item_id, name, required, max_selections, sort_order, selection_type) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const insertOption = db.prepare(
        'INSERT INTO menu_item_options (group_id, name, price_modifier, sort_order) VALUES (?, ?, ?, ?)'
      );
      for (let gi = 0; gi < groups.length; gi++) {
        const g = groups[gi];
        if (!g.name?.trim()) continue;
        const groupResult = insertGroup.run(
          parseInt(itemId),
          g.name.trim(),
          g.required ? 1 : 0,
          g.max_selections ?? null,
          gi,
          g.selection_type === 'quantity' ? 'quantity' : 'check'
        );
        const groupId = groupResult.lastInsertRowid;
        const opts = Array.isArray(g.options) ? g.options : [];
        for (let oi = 0; oi < opts.length; oi++) {
          const o = opts[oi];
          if (!o.name?.trim()) continue;
          insertOption.run(groupId, o.name.trim(), parseFloat(o.price_modifier) || 0, oi);
        }
      }
    });
    txn();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update option groups error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
