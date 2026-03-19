import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Review } from '@/lib/types';

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
  const { data: rawReviews } = await supabase
    .from('reviews')
    .select('*, users(avatar_url, name)')
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false });

  const reviews = (rawReviews ?? []).map(({ users, ...r }) => {
    const u = users as { avatar_url: string | null; name: string } | null;
    let reviewer_name = r.reviewer_name;
    if (u?.name) {
      const parts = u.name.trim().split(' ');
      reviewer_name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    }
    return { ...r, reviewer_name, reviewer_avatar_url: u?.avatar_url ?? null };
  }) as Review[];

  return Response.json({ reviews });
}
