import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const { data: sub } = await supabase
      .from('dashpass_subscriptions')
      .select('id, status, current_period_end, canceled_at, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (!sub) {
      return Response.json({ active: false, subscription: null });
    }

    const active = sub.status === 'active' && new Date(sub.current_period_end) > new Date();

    return Response.json({ active, subscription: sub });
  } catch (error) {
    console.error('PassDash status error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
