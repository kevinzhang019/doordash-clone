import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
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

function getISOWeek(date: Date): number {
  const jan1 = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
}

function getPeriodKey(placedAt: string, period: string): string {
  const d = new Date(placedAt);
  if (period === 'day') return d.toISOString().slice(0, 10);
  if (period === 'month') return d.toISOString().slice(0, 7);
  if (period === 'year') return String(d.getFullYear());
  // week
  const year = d.getFullYear();
  const weekNum = getISOWeek(d);
  return `${year}-${String(weekNum).padStart(2, '0')}`;
}

function getDateFilter(period: string): string {
  const now = new Date();
  if (period === 'day') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return d.toISOString();
  }
  if (period === 'month') {
    const d = new Date(now);
    d.setDate(1);
    d.setMonth(d.getMonth() - 11);
    return d.toISOString();
  }
  if (period === 'year') {
    const d = new Date(now);
    d.setFullYear(d.getFullYear() - 4);
    d.setMonth(0, 1);
    return d.toISOString();
  }
  // week
  const d = new Date(now);
  d.setDate(d.getDate() - 27);
  return d.toISOString();
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const period = request.nextUrl.searchParams.get('period') || 'week';
  const supabase = getSupabaseAdmin();

  let labels: string[];
  if (period === 'day') labels = generateDayLabels();
  else if (period === 'month') labels = generateMonthLabels();
  else if (period === 'year') labels = generateYearLabels();
  else labels = generateWeekLabels();

  const dateFilter = getDateFilter(period);

  // Fetch chart orders (filtered by date)
  const { data: chartOrders } = await supabase
    .from('orders')
    .select('subtotal, discount_saved, placed_at')
    .eq('restaurant_id', restaurantId)
    .gte('placed_at', dateFilter);

  // Aggregate chart data in JS
  const chartMap = new Map<string, { revenue: number; orders: number }>();
  for (const o of chartOrders ?? []) {
    const key = getPeriodKey(o.placed_at, period);
    const existing = chartMap.get(key) || { revenue: 0, orders: 0 };
    existing.revenue += (o.subtotal ?? 0) - (o.discount_saved ?? 0);
    existing.orders += 1;
    chartMap.set(key, existing);
  }

  const chartRows = Array.from(chartMap.entries()).map(([p, v]) => ({
    period: p,
    revenue: v.revenue,
    orders: v.orders,
  }));

  const revenue_chart = fillZeroPeriods(chartRows, labels);

  // Fetch all orders for totals
  const { data: allOrders } = await supabase
    .from('orders')
    .select('subtotal, discount_saved')
    .eq('restaurant_id', restaurantId);

  let total_revenue = 0;
  const order_count = allOrders?.length ?? 0;
  for (const o of allOrders ?? []) {
    total_revenue += (o.subtotal ?? 0) - (o.discount_saved ?? 0);
  }
  const avg_order_value = order_count > 0 ? total_revenue / order_count : 0;

  // Top items by quantity: fetch order_items joined with orders
  const { data: allOrderIds } = await supabase
    .from('orders')
    .select('id')
    .eq('restaurant_id', restaurantId);

  const orderIds = (allOrderIds ?? []).map(o => o.id);

  let top_items_by_qty: { name: string; total_qty: number }[] = [];
  let top_items_by_revenue: { name: string; total_revenue: number }[] = [];

  if (orderIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order_id, name, quantity, price')
      .in('order_id', orderIds);

    // Build order subtotals + discount map for revenue pro-rating
    const orderDiscountMap = new Map<number, { subtotal: number; discount_saved: number }>();
    for (const o of allOrders ?? []) {
      // We need order id - re-fetch with id
    }
    // Re-fetch with id for mapping
    const { data: ordersWithId } = await supabase
      .from('orders')
      .select('id, subtotal, discount_saved')
      .eq('restaurant_id', restaurantId);

    for (const o of ordersWithId ?? []) {
      orderDiscountMap.set(o.id, { subtotal: o.subtotal ?? 0, discount_saved: o.discount_saved ?? 0 });
    }

    // Aggregate by item name
    const qtyMap = new Map<string, number>();
    const revMap = new Map<string, number>();
    for (const item of orderItems ?? []) {
      qtyMap.set(item.name, (qtyMap.get(item.name) ?? 0) + item.quantity);
      const orderInfo = orderDiscountMap.get(item.order_id);
      const ratio = orderInfo && orderInfo.subtotal > 0
        ? (1.0 - (orderInfo.discount_saved / orderInfo.subtotal))
        : 1.0;
      revMap.set(item.name, (revMap.get(item.name) ?? 0) + item.price * item.quantity * ratio);
    }

    top_items_by_qty = Array.from(qtyMap.entries())
      .map(([name, total_qty]) => ({ name, total_qty }))
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, 10);

    top_items_by_revenue = Array.from(revMap.entries())
      .map(([name, total_revenue]) => ({ name, total_revenue }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 10);
  }

  return Response.json({
    period,
    revenue_chart,
    total_revenue,
    order_count,
    avg_order_value,
    top_items_by_qty,
    top_items_by_revenue,
  });
}
