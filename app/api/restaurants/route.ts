import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';
import { getSession } from '@/lib/auth';

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

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'restaurant') return Response.json({ error: 'Only restaurant accounts can create restaurants' }, { status: 403 });

  try {
    const { name, cuisine, address, image_url, lat, lng } = await request.json();

    if (!name?.trim() || !cuisine?.trim() || !address?.trim()) {
      return Response.json({ error: 'Name, cuisine, and address are required' }, { status: 400 });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'Please select the address from the dropdown suggestions' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO restaurants (name, cuisine, description, image_url, rating, delivery_fee, delivery_min, delivery_max, address, lat, lng)
      VALUES (?, ?, '', ?, 5.0, 0, 20, 40, ?, ?, ?)
    `).run(
      name.trim(), cuisine.trim(),
      image_url?.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      address.trim(),
      lat,
      lng
    );

    return Response.json({ restaurantId: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
