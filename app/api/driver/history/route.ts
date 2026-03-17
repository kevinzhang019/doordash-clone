import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();

  // Get all ended sessions for this user
  const { data: sessions } = await supabase
    .from('driver_sessions')
    .select('id, started_at, ended_at')
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: false });

  if (!sessions || sessions.length === 0) {
    return Response.json({ sessions: [] });
  }

  const sessionIds = sessions.map(s => s.id);

  // Get all delivered deliveries for these sessions
  const { data: deliveries } = await supabase
    .from('driver_deliveries')
    .select('id, session_id, pay_amount, tip, estimated_minutes')
    .in('session_id', sessionIds)
    .eq('status', 'delivered');

  // Group deliveries by session
  const deliveriesBySession = new Map<number, typeof deliveries>();
  for (const d of (deliveries ?? [])) {
    const list = deliveriesBySession.get(d.session_id) ?? [];
    list.push(d);
    deliveriesBySession.set(d.session_id, list);
  }

  const result = sessions.map(s => {
    const sessionDeliveries = deliveriesBySession.get(s.id) ?? [];
    const total_earnings = sessionDeliveries.reduce((sum, d) => sum + d.pay_amount + d.tip, 0);
    const deliveries_completed = sessionDeliveries.length;
    const activeMinutes = sessionDeliveries.reduce((sum, d) => sum + d.estimated_minutes, 0);
    const durationMinutes = activeMinutes;
    const activeHours = activeMinutes / 60;
    const earningsPerHour = activeHours > 0 ? total_earnings / activeHours : 0;

    return {
      id: s.id,
      started_at: s.started_at,
      ended_at: s.ended_at,
      durationMinutes,
      total_earnings,
      deliveries_completed,
      earningsPerHour: Math.round(earningsPerHour * 100) / 100,
    };
  });

  return Response.json({ sessions: result });
}
