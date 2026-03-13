import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { restaurantId } = await request.json();
    if (!restaurantId) return Response.json({ error: 'restaurantId is required' }, { status: 400 });

    const db = getDb();

    // Verify restaurant exists
    const restaurant = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(restaurantId);
    if (!restaurant) return Response.json({ error: 'Restaurant not found' }, { status: 404 });

    // Link owner to restaurant (ignore duplicate)
    db.prepare('INSERT OR IGNORE INTO restaurant_owners (user_id, restaurant_id) VALUES (?, ?)').run(userId, restaurantId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Claim restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
