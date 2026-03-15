import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params;
    const driverUserId = parseInt(driverId);
    if (isNaN(driverUserId)) {
      return Response.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      SELECT AVG(rating) as averageRating, COUNT(*) as totalRatings
      FROM driver_ratings
      WHERE driver_user_id = ?
    `).get(driverUserId) as { averageRating: number | null; totalRatings: number };

    return Response.json({
      averageRating: result.averageRating ? Math.round(result.averageRating * 10) / 10 : null,
      totalRatings: result.totalRatings,
    });
  } catch (error) {
    console.error('Get driver rating error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
