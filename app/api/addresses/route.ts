import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const address = db
      .prepare(
        'SELECT * FROM user_addresses WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC LIMIT 1'
      )
      .get(userId) as { id: number; address: string; lat: number; lng: number } | undefined;

    return Response.json({ address: address ?? null });
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
    db.prepare('UPDATE user_addresses SET is_active = 0 WHERE user_id = ?').run(userId);
    db.prepare(
      'INSERT INTO user_addresses (user_id, address, lat, lng, is_active) VALUES (?, ?, ?, ?, 1)'
    ).run(userId, address, lat, lng);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Save address error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
