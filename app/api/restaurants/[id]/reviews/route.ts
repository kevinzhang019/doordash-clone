import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const restaurantId = parseInt(id);
    if (isNaN(restaurantId)) {
      return Response.json({ error: 'Invalid restaurant ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return Response.json({ reviews: reviews || [] });
  } catch (error) {
    console.error('Get reviews error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
