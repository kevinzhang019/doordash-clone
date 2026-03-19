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
    const { sessionId } = await request.json().catch(() => ({}));
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const supabase = getSupabaseAdmin();

    let stripeCustomerId: string;
    let stripeSubscriptionId: string;
    let currentPeriodEnd: string;

    if (sessionId) {
      // Retrieve session directly — most reliable path
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['subscription.items.data'],
      });

      if (session.mode !== 'subscription' || !session.subscription) {
        return Response.json({ error: 'No subscription in session' }, { status: 400 });
      }

      // Verify this session belongs to this user
      if (session.metadata?.user_id !== userId.toString()) {
        return Response.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const sub = session.subscription as Stripe.Subscription;
      stripeCustomerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? '';
      stripeSubscriptionId = sub.id;
      // In Stripe SDK v20+, current_period_end is on SubscriptionItem, not Subscription
      const periodEnd = sub.items.data[0]?.current_period_end;
      currentPeriodEnd = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Fallback: look up by customer email
      const { data: user } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length === 0) return Response.json({ active: false });

      stripeCustomerId = customers.data[0].id;

      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        limit: 5,
        expand: ['data.items.data'],
      });

      const activeSub = subscriptions.data.find(s => s.status === 'active' || s.status === 'trialing');
      if (!activeSub) return Response.json({ active: false });

      stripeSubscriptionId = activeSub.id;
      const periodEnd = activeSub.items.data[0]?.current_period_end;
      currentPeriodEnd = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const { error } = await supabase.from('dashpass_subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      status: 'active',
      current_period_end: currentPeriodEnd,
      canceled_at: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    if (error) {
      console.error('PassDash sync upsert error:', error);
      return Response.json({ error: 'Database error' }, { status: 500 });
    }

    return Response.json({ active: true });
  } catch (error) {
    console.error('PassDash sync error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
