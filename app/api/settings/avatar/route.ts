import { NextRequest } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import getDb from '@/db/database';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('avatar') as File | null;
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 });

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return Response.json({ error: 'File must be JPEG, PNG, or WebP' }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return Response.json({ error: 'File too large (max 5MB)' }, { status: 400 });
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp';
  const filename = `${userId}_${Date.now()}.${ext}`;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
  await mkdir(uploadDir, { recursive: true });

  // Delete old avatar file if it exists
  const db = getDb();
  const existing = db.prepare('SELECT avatar_url FROM users WHERE id = ?').get(userId) as { avatar_url: string | null } | undefined;
  if (existing?.avatar_url) {
    const oldFilename = existing.avatar_url.split('/').pop();
    if (oldFilename) {
      const oldPath = path.join(uploadDir, oldFilename);
      if (existsSync(oldPath)) await unlink(oldPath).catch(() => {});
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), buffer);

  const avatarUrl = `/uploads/avatars/${filename}`;
  db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, userId);

  return Response.json({ avatarUrl });
}
