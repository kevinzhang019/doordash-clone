import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

async function getRestaurantId(userId: number) {
  const supabase = getSupabaseAdmin();
  const { data: owner } = await supabase.from('restaurant_owners').select('restaurant_id').eq('user_id', userId).maybeSingle();
  return owner?.restaurant_id ?? null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { reviewId } = await params;
  const id = parseInt(reviewId);
  if (isNaN(id)) return Response.json({ error: 'Invalid review ID' }, { status: 400 });

  const { reply } = await request.json();
  if (typeof reply !== 'string' || reply.trim().length === 0) {
    return Response.json({ error: 'Reply cannot be empty' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (!existing) {
    return Response.json({ error: 'Review not found' }, { status: 404 });
  }

  await supabase
    .from('reviews')
    .update({ owner_reply: reply.trim(), owner_reply_at: new Date().toISOString() })
    .eq('id', id)
    .eq('restaurant_id', restaurantId);

  return Response.json({ ok: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = await getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  const { reviewId } = await params;
  const id = parseInt(reviewId);
  if (isNaN(id)) return Response.json({ error: 'Invalid review ID' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('id', id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (!existing) {
    return Response.json({ error: 'Review not found' }, { status: 404 });
  }

  await supabase
    .from('reviews')
    .update({ owner_reply: null, owner_reply_at: null })
    .eq('id', id)
    .eq('restaurant_id', restaurantId);

  return Response.json({ ok: true });
}
