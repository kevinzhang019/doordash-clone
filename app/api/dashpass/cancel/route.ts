import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: sub } = await supabase
      .from('dashpass_subscriptions')
      .select('stripe_subscription_id, current_period_end')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();

    if (!sub) {
      return Response.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    await supabase
      .from('dashpass_subscriptions')
      .update({ canceled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    return Response.json({ endsAt: sub.current_period_end });
  } catch (error) {
    console.error('PassDash cancel error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
