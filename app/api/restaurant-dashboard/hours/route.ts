import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const supabase = getSupabaseAdmin();
  const { data: hours } = await supabase.from('restaurant_hours').select('*').eq('restaurant_id', restaurantId).order('day_of_week', { ascending: true });

  // Return all 7 days — fill in defaults if not set
  const result = Array.from({ length: 7 }, (_, i) => {
    const existing = (hours ?? []).find((h: { day_of_week: number }) => h.day_of_week === i);
    return existing || { restaurant_id: restaurantId, day_of_week: i, open_time: '09:00', close_time: '21:00', is_closed: false };
  });

  return Response.json({ hours: result });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const { hours } = await request.json();
    if (!Array.isArray(hours)) return Response.json({ error: 'hours must be an array' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    const rows = hours.map((h: { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }) => ({
      restaurant_id: restaurantId,
      day_of_week: h.day_of_week,
      open_time: h.open_time,
      close_time: h.close_time,
      is_closed: !!h.is_closed,
    }));

    await supabase.from('restaurant_hours').upsert(rows, { onConflict: 'restaurant_id,day_of_week' });

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update hours error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
