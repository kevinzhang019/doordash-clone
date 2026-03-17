import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    const { driverId } = await params;
    const driverUserId = parseInt(driverId);
    if (isNaN(driverUserId)) {
      return Response.json({ error: 'Invalid driver ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Fetch all ratings and compute in JS since Supabase query builder
    // doesn't directly support AVG/COUNT aggregates
    const { data: ratings } = await supabase
      .from('driver_ratings')
      .select('rating')
      .eq('driver_user_id', driverUserId);

    const totalRatings = ratings?.length ?? 0;
    let averageRating: number | null = null;
    if (totalRatings > 0) {
      const sum = ratings!.reduce((acc, r) => acc + r.rating, 0);
      averageRating = Math.round((sum / totalRatings) * 10) / 10;
    }

    return Response.json({
      averageRating,
      totalRatings,
    });
  } catch (error) {
    console.error('Get driver rating error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
