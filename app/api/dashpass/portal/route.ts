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
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!sub) {
      return Response.json({ error: 'No subscription found' }, { status: 404 });
    }

    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return Response.json({ portalUrl: session.url });
  } catch (error) {
    console.error('DashPass portal error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
