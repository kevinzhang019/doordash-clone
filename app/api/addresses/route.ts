import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const addresses = db
      .prepare('SELECT * FROM user_addresses WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC')
      .all(userId) as { id: number; address: string; lat: number; lng: number; created_at: string }[];

    return Response.json({
      address: addresses[0] ?? null,      // backward compat for triggerAddressLoad
      addresses,
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { address, lat, lng } = await request.json();
    if (!address || typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'address, lat, and lng are required' }, { status: 400 });
    }

    const db = getDb();
    // Deduplicate by address text
    const exists = db.prepare('SELECT id FROM user_addresses WHERE user_id = ? AND address = ?').get(userId, address);
    if (!exists) {
      db.prepare('INSERT INTO user_addresses (user_id, address, lat, lng, is_active) VALUES (?, ?, ?, ?, 1)').run(userId, address, lat, lng);
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Save address error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
