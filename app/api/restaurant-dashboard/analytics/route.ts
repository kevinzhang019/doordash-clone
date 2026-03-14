import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

function fillZeroPeriods(
  data: { period: string; revenue: number; orders: number }[],
  labels: string[]
): { label: string; revenue: number; orders: number }[] {
  const map = new Map(data.map(d => [d.period, d]));
  return labels.map(label => {
    const entry = map.get(label);
    return { label, revenue: entry?.revenue ?? 0, orders: entry?.orders ?? 0 };
  });
}

function generateDayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toISOString().slice(0, 10));
  }
  return labels;
}

function generateWeekLabels(): string[] {
  const labels: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    // ISO week number
    const jan1 = new Date(year, 0, 1);
    const weekNum = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    labels.push(`${year}-${String(weekNum).padStart(2, '0')}`);
  }
  return [...new Set(labels)];
}

function generateMonthLabels(): string[] {
  const labels: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    labels.push(d.toISOString().slice(0, 7));
  }
  return labels;
}

function generateYearLabels(): string[] {
  const labels: string[] = [];
  const currentYear = new Date().getFullYear();
  for (let i = 4; i >= 0; i--) {
    labels.push(String(currentYear - i));
  }
  return labels;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const period = request.nextUrl.searchParams.get('period') || 'week';
  const db = getDb();

  let groupByExpr: string;
  let dateFilter: string;
  let labels: string[];

  if (period === 'day') {
    groupByExpr = "date(placed_at)";
    dateFilter = "date(placed_at) >= date('now', '-6 days')";
    labels = generateDayLabels();
  } else if (period === 'month') {
    groupByExpr = "strftime('%Y-%m', placed_at)";
    dateFilter = "date(placed_at) >= date('now', '-11 months', 'start of month')";
    labels = generateMonthLabels();
  } else if (period === 'year') {
    groupByExpr = "strftime('%Y', placed_at)";
    dateFilter = "strftime('%Y', placed_at) >= strftime('%Y', 'now', '-4 years')";
    labels = generateYearLabels();
  } else {
    // week (default)
    groupByExpr = "strftime('%Y-%W', placed_at)";
    dateFilter = "date(placed_at) >= date('now', '-27 days')";
    labels = generateWeekLabels();
  }

  const chartRows = db.prepare(`
    SELECT ${groupByExpr} as period,
           SUM(oi.price * oi.quantity) as revenue,
           COUNT(DISTINCT o.id) as orders
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.restaurant_id = ? AND ${dateFilter}
    GROUP BY ${groupByExpr}
    ORDER BY period ASC
  `).all(restaurantId) as { period: string; revenue: number; orders: number }[];

  const revenue_chart = fillZeroPeriods(chartRows, labels);

  const totals = db.prepare(`
    SELECT COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue, COUNT(DISTINCT o.id) as order_count
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    WHERE o.restaurant_id = ?
  `).get(restaurantId) as { total_revenue: number; order_count: number };

  const avg_order_value = totals.order_count > 0 ? totals.total_revenue / totals.order_count : 0;

  const top_items_by_qty = db.prepare(`
    SELECT oi.name, SUM(oi.quantity) as total_qty
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.restaurant_id = ?
    GROUP BY oi.name
    ORDER BY total_qty DESC
    LIMIT 10
  `).all(restaurantId) as { name: string; total_qty: number }[];

  const top_items_by_revenue = db.prepare(`
    SELECT oi.name, SUM(oi.price * oi.quantity) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.restaurant_id = ?
    GROUP BY oi.name
    ORDER BY total_revenue DESC
    LIMIT 10
  `).all(restaurantId) as { name: string; total_revenue: number }[];

  return Response.json({
    period,
    revenue_chart,
    total_revenue: totals.total_revenue,
    order_count: totals.order_count,
    avg_order_value,
    top_items_by_qty,
    top_items_by_revenue,
  });
}
