import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { orderId, rating, comment } = await request.json();

    if (!orderId || !rating || !comment?.trim()) {
      return Response.json({ error: 'orderId, rating, and comment are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Verify the order belongs to this user and get restaurant_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, restaurant_id, user_id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .maybeSingle();

    if (orderError) throw orderError;
    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    // Get reviewer name from user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('name')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const nameParts = user.name.trim().split(' ');
    const reviewerName = nameParts.length > 1
      ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
      : nameParts[0];

    const { data, error: insertError } = await supabase
      .from('reviews')
      .insert({
        user_id: userId,
        restaurant_id: order.restaurant_id,
        order_id: orderId,
        rating,
        comment: comment.trim(),
        reviewer_name: reviewerName,
      })
      .select('id')
      .single();

    if (insertError) {
      // Check for unique constraint violation (already reviewed this order)
      if (insertError.code === '23505') {
        return Response.json({ error: 'You have already reviewed this order' }, { status: 409 });
      }
      throw insertError;
    }

    return Response.json({ reviewId: data.id }, { status: 201 });
  } catch (error: unknown) {
    console.error('Post review error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
