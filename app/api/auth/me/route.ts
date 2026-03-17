import { NextRequest } from 'next/server';
import { getSessionFromHeader } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromHeader(request);
    if (!session) {
      return Response.json({ user: null });
    }

    const supabase = getSupabaseAdmin();
    const { data: dbUser } = await supabase
      .from('users')
      .select('avatar_url')
      .eq('id', session.userId)
      .maybeSingle();

    if (!dbUser) {
      return Response.json({ user: null });
    }

    return Response.json({
      user: {
        id: session.userId,
        email: session.email,
        name: session.name,
        role: session.role || 'customer',
        avatar_url: dbUser.avatar_url ?? null,
      },
    });
  } catch (error) {
    console.error('Me error:', error);
    return Response.json({ user: null });
  }
}
