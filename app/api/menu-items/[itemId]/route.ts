import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const db = getDb();
  const item = db.prepare(`
    SELECT mi.id, mi.name, mi.price, mi.image_url, mi.is_available,
           r.id as restaurant_id, r.name as restaurant_name
    FROM menu_items mi
    JOIN restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = ?
  `).get(parseInt(itemId)) as {
    id: number;
    name: string;
    price: number;
    image_url: string | null;
    is_available: number;
    restaurant_id: number;
    restaurant_name: string;
  } | undefined;

  if (!item) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ item });
}
