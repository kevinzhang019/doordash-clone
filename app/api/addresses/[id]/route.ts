import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getDb();
  // Only delete if it belongs to this user
  db.prepare('UPDATE user_addresses SET is_active = 0 WHERE id = ? AND user_id = ?').run(parseInt(id), userId);
  return Response.json({ success: true });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { delivery_instructions, handoff_option } = await request.json();

  const db = getDb();
  const address = db.prepare('SELECT id FROM user_addresses WHERE id = ? AND user_id = ? AND is_active = 1').get(parseInt(id), userId);
  if (!address) return Response.json({ error: 'Address not found' }, { status: 404 });

  db.prepare(
    'UPDATE user_addresses SET delivery_instructions = ?, handoff_option = ? WHERE id = ? AND user_id = ?'
  ).run(
    delivery_instructions?.trim() || null,
    handoff_option || 'hand_off',
    parseInt(id),
    userId,
  );

  return Response.json({ success: true });
}
