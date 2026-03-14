import { NextRequest } from 'next/server';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();

  const sessions = db.prepare(`
    SELECT
      s.id, s.started_at, s.ended_at, s.total_earnings, s.deliveries_completed,
      COALESCE(SUM(d.estimated_minutes), 0) as active_minutes
    FROM driver_sessions s
    LEFT JOIN driver_deliveries d ON d.session_id = s.id AND d.status = 'delivered'
    WHERE s.user_id = ? AND s.ended_at IS NOT NULL
    GROUP BY s.id
    ORDER BY s.started_at DESC
  `).all(userId) as {
    id: number;
    started_at: string;
    ended_at: string;
    total_earnings: number;
    deliveries_completed: number;
    active_minutes: number;
  }[];

  const result = sessions.map(s => {
    const start = new Date(s.started_at + 'Z');
    const end = new Date(s.ended_at + 'Z');
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60_000);
    const activeHours = s.active_minutes / 60;
    const earningsPerHour = activeHours > 0 ? s.total_earnings / activeHours : 0;
    return {
      id: s.id,
      started_at: s.started_at,
      ended_at: s.ended_at,
      durationMinutes,
      total_earnings: s.total_earnings,
      deliveries_completed: s.deliveries_completed,
      earningsPerHour: Math.round(earningsPerHour * 100) / 100,
    };
  });

  return Response.json({ sessions: result });
}
