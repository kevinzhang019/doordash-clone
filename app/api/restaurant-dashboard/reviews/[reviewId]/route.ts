import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { reviewId } = await params;
  const id = parseInt(reviewId);
  if (isNaN(id)) return Response.json({ error: 'Invalid review ID' }, { status: 400 });

  const { reply } = await request.json();
  if (typeof reply !== 'string' || reply.trim().length === 0) {
    return Response.json({ error: 'Reply cannot be empty' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare(`
    UPDATE reviews
    SET owner_reply = ?, owner_reply_at = datetime('now')
    WHERE id = ? AND restaurant_id = ?
  `).run(reply.trim(), id, restaurantId);

  if (result.changes === 0) {
    return Response.json({ error: 'Review not found' }, { status: 404 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { reviewId } = await params;
  const id = parseInt(reviewId);
  if (isNaN(id)) return Response.json({ error: 'Invalid review ID' }, { status: 400 });

  const db = getDb();
  const result = db.prepare(`
    UPDATE reviews
    SET owner_reply = NULL, owner_reply_at = NULL
    WHERE id = ? AND restaurant_id = ?
  `).run(id, restaurantId);

  if (result.changes === 0) {
    return Response.json({ error: 'Review not found' }, { status: 404 });
  }

  return Response.json({ ok: true });
}
