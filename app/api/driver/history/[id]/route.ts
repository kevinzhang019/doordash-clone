import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const sessionId = parseInt(id);
  const db = getDb();

  const session = db.prepare(`
    SELECT id, started_at, ended_at, total_earnings, deliveries_completed
    FROM driver_sessions
    WHERE id = ? AND user_id = ? AND ended_at IS NOT NULL
  `).get(sessionId, userId) as {
    id: number; started_at: string; ended_at: string;
    total_earnings: number; deliveries_completed: number;
  } | undefined;

  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

  const deliveries = db.prepare(`
    SELECT id, pay_amount, tip, miles, estimated_minutes, accepted_at, delivered_at, status
    FROM driver_deliveries
    WHERE session_id = ? AND status = 'delivered'
    ORDER BY accepted_at ASC
  `).all(sessionId) as {
    id: number; pay_amount: number; tip: number;
    miles: number; estimated_minutes: number;
    accepted_at: string; delivered_at: string | null; status: string;
  }[];

  const start = new Date(session.started_at + 'Z');
  const end = new Date(session.ended_at + 'Z');
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const activeMinutes = deliveries.reduce((sum, d) => sum + d.estimated_minutes, 0);
  const activeHours = activeMinutes / 60;
  const earningsPerHour = activeHours > 0 ? session.total_earnings / activeHours : 0;

  return Response.json({
    session: {
      id: session.id,
      started_at: session.started_at,
      ended_at: session.ended_at,
      durationMinutes,
      total_earnings: session.total_earnings,
      deliveries_completed: session.deliveries_completed,
      earningsPerHour: Math.round(earningsPerHour * 100) / 100,
    },
    deliveries: deliveries.map((d, i) => ({
      number: i + 1,
      estimatedMinutes: d.estimated_minutes,
      miles: Math.round(d.miles * 10) / 10,
      pay: d.pay_amount,
      tip: d.tip,
      total: d.pay_amount + d.tip,
    })),
  });
}
