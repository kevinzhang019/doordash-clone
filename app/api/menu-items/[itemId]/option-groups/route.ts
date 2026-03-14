import { NextRequest } from 'next/server';
import getDb from '@/db/database';

// Public endpoint — no auth required
export async function GET(_request: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const db = getDb();

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
