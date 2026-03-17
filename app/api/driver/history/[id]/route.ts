import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id);
  const supabase = getSupabaseAdmin();

  const { data: session } = await supabase
    .from('driver_sessions')
    .select('id, started_at, ended_at')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .not('ended_at', 'is', null)
    .maybeSingle();

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

  const { data: deliveries } = await supabase
    .from('driver_deliveries')
    .select('id, pay_amount, tip, miles, estimated_minutes, accepted_at, delivered_at, status, restaurant_name')
    .eq('session_id', sessionId)
    .eq('status', 'delivered')
    .order('accepted_at', { ascending: true });

  const deliveriesList = deliveries ?? [];
  const activeMinutes = deliveriesList.reduce((sum, d) => sum + d.estimated_minutes, 0);
  const durationMinutes = activeMinutes;
  const total_earnings = deliveriesList.reduce((sum, d) => sum + d.pay_amount + d.tip, 0);
  const deliveries_completed = deliveriesList.length;
  const activeHours = activeMinutes / 60;
  const earningsPerHour = activeHours > 0 ? total_earnings / activeHours : 0;

  return Response.json({
    session: {
      id: session.id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      durationMinutes,
      total_earnings,
      deliveries_completed,
      earningsPerHour: Math.round(earningsPerHour * 100) / 100,
    },
    deliveries: deliveriesList.map((d, i) => ({
      number: i + 1,
      restaurantName: d.restaurant_name,
      estimatedMinutes: d.estimated_minutes,
      miles: Math.round(d.miles * 10) / 10,
      pay: d.pay_amount,
      tip: d.tip,
      total: d.pay_amount + d.tip,
    })),
  });
}
