import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Restaurant, MenuItem } from '@/lib/types';

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
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId) as Restaurant | undefined;
    if (!restaurant) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const menuItems = db.prepare(
      'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, name'
    ).all(restaurantId) as MenuItem[];

    // Group by category
    const menuByCategory: Record<string, MenuItem[]> = {};
    for (const item of menuItems) {
      if (!menuByCategory[item.category]) {
        menuByCategory[item.category] = [];
      }
      menuByCategory[item.category].push(item);
    }

    return Response.json({ restaurant, menu: menuByCategory });
  } catch (error) {
    console.error('Get restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
