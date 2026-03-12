import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Review } from '@/lib/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);
    if (isNaN(restaurantId)) {
      return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const db = getDb();
    const reviews = db.prepare(`
      SELECT * FROM reviews
      WHERE restaurant_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(restaurantId) as Review[];

    return Response.json({ reviews });
  } catch (error) {
    console.error('Get reviews error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
