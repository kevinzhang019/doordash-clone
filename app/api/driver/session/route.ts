import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import type { DriverSession } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const session = db.prepare(
    'SELECT * FROM driver_sessions WHERE user_id = ? AND ended_at IS NULL ORDER BY started_at DESC LIMIT 1'
  ).get(userId) as DriverSession | undefined;

  return Response.json({ session: session || null });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const { action } = await request.json();

  if (action === 'start') {
    // End any existing active sessions first
    db.prepare("UPDATE driver_sessions SET ended_at = datetime('now') WHERE user_id = ? AND ended_at IS NULL").run(userId);

    const result = db.prepare(
      'INSERT INTO driver_sessions (user_id, total_earnings, deliveries_completed) VALUES (?, 0, 0)'
    ).run(userId);

    const session = db.prepare('SELECT * FROM driver_sessions WHERE id = ?').get(result.lastInsertRowid) as DriverSession;
    return Response.json({ session }, { status: 201 });
  }

  if (action === 'end') {
    db.prepare("UPDATE driver_sessions SET ended_at = datetime('now') WHERE user_id = ? AND ended_at IS NULL").run(userId);
    return Response.json({ success: true });
  }

  return Response.json({ error: 'Invalid action' }, { status: 400 });
}
