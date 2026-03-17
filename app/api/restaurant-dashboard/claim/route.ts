import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { restaurantId } = await request.json();
    if (!restaurantId) return Response.json({ error: 'restaurantId is required' }, { status: 400 });

    const supabase = getSupabaseAdmin();

    // Verify restaurant exists
    const { data: restaurant } = await supabase.from('restaurants').select('id').eq('id', restaurantId).maybeSingle();
    if (!restaurant) return Response.json({ error: 'Restaurant not found' }, { status: 404 });

    // Link owner to restaurant (ignore duplicate)
    await supabase.from('restaurant_owners').upsert(
      { user_id: userId, restaurant_id: restaurantId },
      { onConflict: 'user_id,restaurant_id' }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error('Claim restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
