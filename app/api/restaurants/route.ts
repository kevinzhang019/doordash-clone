import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';
import { getSession } from '@/lib/auth';
import { geocodeAddress } from '@/lib/geocode';

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

  try {
    const { name, cuisine, description, address, delivery_fee, delivery_min, delivery_max, image_url } = await request.json();

    if (!name?.trim() || !cuisine?.trim() || !description?.trim() || !address?.trim()) {
      return Response.json({ error: 'Name, cuisine, description, and address are required' }, { status: 400 });
    }
    if (delivery_min >= delivery_max) {
      return Response.json({ error: 'Min delivery time must be less than max' }, { status: 400 });
    }

    const db = getDb();
    const coords = await geocodeAddress(address.trim());
    const result = db.prepare(`
      INSERT INTO restaurants (name, cuisine, description, image_url, rating, delivery_fee, delivery_min, delivery_max, address, lat, lng)
      VALUES (?, ?, ?, ?, 5.0, ?, ?, ?, ?, ?, ?)
    `).run(
      name.trim(), cuisine.trim(), description.trim(),
      image_url?.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      parseFloat(delivery_fee) || 0,
      parseInt(delivery_min) || 20,
      parseInt(delivery_max) || 40,
      address.trim(),
      coords?.lat ?? null,
      coords?.lng ?? null
    );

    return Response.json({ restaurantId: result.lastInsertRowid }, { status: 201 });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
