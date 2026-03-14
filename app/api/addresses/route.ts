import { NextRequest } from 'next/server';
import getDb from '@/db/database';

type AddressRow = { id: number; address: string; lat: number; lng: number; created_at: string };

function migrateGuestAddresses(db: ReturnType<typeof getDb>, guestId: string, userId: number) {
  const guestAddresses = db
    .prepare('SELECT * FROM guest_addresses WHERE guest_id = ? AND is_active = 1')
    .all(guestId) as AddressRow[];
  for (const ga of guestAddresses) {
    const existing = db
      .prepare('SELECT id, is_active FROM user_addresses WHERE user_id = ? AND address = ?')
      .get(userId, ga.address) as { id: number; is_active: number } | undefined;
    if (existing && !existing.is_active) {
      db.prepare('UPDATE user_addresses SET is_active = 1, lat = ?, lng = ? WHERE id = ?').run(ga.lat, ga.lng, existing.id);
    } else if (!existing) {
      db.prepare('INSERT INTO user_addresses (user_id, address, lat, lng, is_active) VALUES (?, ?, ?, ?, 1)').run(userId, ga.address, ga.lat, ga.lng);
    }
  }
  if (guestAddresses.length > 0) {
    db.prepare('UPDATE guest_addresses SET is_active = 0 WHERE guest_id = ?').run(guestId);
  }
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const guestId = request.headers.get('x-guest-id') ?? '';

  const db = getDb();

  if (userId) {
    // Migrate any guest addresses before fetching
    if (guestId) migrateGuestAddresses(db, guestId, userId);

    try {
      const addresses = db
        .prepare('SELECT * FROM user_addresses WHERE user_id = ? AND is_active = 1 ORDER BY created_at DESC')
        .all(userId) as AddressRow[];
      return Response.json({ address: addresses[0] ?? null, addresses });
    } catch (error) {
      console.error('Get addresses error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  if (guestId) {
    try {
      const addresses = db
        .prepare('SELECT * FROM guest_addresses WHERE guest_id = ? AND is_active = 1 ORDER BY created_at DESC')
        .all(guestId) as AddressRow[];
      return Response.json({ address: addresses[0] ?? null, addresses });
    } catch (error) {
      console.error('Get guest addresses error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const guestId = request.headers.get('x-guest-id') ?? '';

  try {
    const { address, lat, lng } = await request.json();
    if (!address || typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'address, lat, and lng are required' }, { status: 400 });
    }

    const db = getDb();

    if (userId) {
      // Migrate guest addresses first
      if (guestId) migrateGuestAddresses(db, guestId, userId);

      const existing = db
        .prepare('SELECT id, is_active FROM user_addresses WHERE user_id = ? AND address = ?')
        .get(userId, address) as { id: number; is_active: number } | undefined;
      if (existing && !existing.is_active) {
        db.prepare('UPDATE user_addresses SET is_active = 1, lat = ?, lng = ? WHERE id = ?').run(lat, lng, existing.id);
      } else if (!existing) {
        db.prepare('INSERT INTO user_addresses (user_id, address, lat, lng, is_active) VALUES (?, ?, ?, ?, 1)').run(userId, address, lat, lng);
      }
      return Response.json({ success: true });
    }

    if (guestId) {
      const existing = db
        .prepare('SELECT id, is_active FROM guest_addresses WHERE guest_id = ? AND address = ?')
        .get(guestId, address) as { id: number; is_active: number } | undefined;
      if (existing && !existing.is_active) {
        db.prepare('UPDATE guest_addresses SET is_active = 1, lat = ?, lng = ? WHERE id = ?').run(lat, lng, existing.id);
      } else if (!existing) {
        db.prepare('INSERT INTO guest_addresses (guest_id, address, lat, lng, is_active) VALUES (?, ?, ?, ?, 1)').run(guestId, address, lat, lng);
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Save address error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
