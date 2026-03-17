import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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

  const supabase = getSupabaseAdmin();

  // Delete old avatar from storage if it exists
  const { data: existing } = await supabase
    .from('users')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (existing?.avatar_url && existing.avatar_url.includes('supabase.co')) {
    const oldFilename = existing.avatar_url.split('/').pop();
    if (oldFilename) {
      await supabase.storage.from('avatars').remove([oldFilename]);
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filename, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Avatar upload error:', uploadError);
    return Response.json({ error: 'Upload failed' }, { status: 500 });
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename);

  await supabase
    .from('users')
    .update({ avatar_url: publicUrl })
    .eq('id', userId);

  return Response.json({ avatarUrl: publicUrl });
}
