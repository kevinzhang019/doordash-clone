import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { dealId } = await params;
  const { is_active } = await request.json();
  const db = getDb();

  const deal = db.prepare('SELECT id FROM deals WHERE id = ? AND restaurant_id = ?').get(parseInt(dealId), restaurantId);
  if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 });

  db.prepare('UPDATE deals SET is_active = ? WHERE id = ?').run(is_active ? 1 : 0, parseInt(dealId));
  return Response.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ dealId: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { dealId } = await params;
  const db = getDb();

  const deal = db.prepare('SELECT id FROM deals WHERE id = ? AND restaurant_id = ?').get(parseInt(dealId), restaurantId);
  if (!deal) return Response.json({ error: 'Deal not found' }, { status: 404 });

  db.prepare('DELETE FROM deals WHERE id = ?').run(parseInt(dealId));
  return Response.json({ ok: true });
}
