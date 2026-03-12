import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';

export async function GET() {
  try {
    const db = getDb();
    const restaurants = db.prepare('SELECT * FROM restaurants ORDER BY rating DESC').all() as Restaurant[];
    return Response.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
