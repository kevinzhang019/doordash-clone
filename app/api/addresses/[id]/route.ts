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
