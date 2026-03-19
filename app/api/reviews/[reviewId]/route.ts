import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reviewId } = await params;
  const reviewIdNum = parseInt(reviewId);
  if (isNaN(reviewIdNum)) return Response.json({ error: 'Invalid review ID' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewIdNum)
    .eq('user_id', userId);

  if (error) {
    console.error('Delete review error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
