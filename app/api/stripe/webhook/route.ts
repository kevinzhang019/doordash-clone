import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

// Helper to extract period end from subscription object (handles different Stripe SDK versions)
function getSubscriptionData(sub: Record<string, unknown>) {
  return {
    id: sub.id as string,
    currentPeriodEnd: new Date((sub.current_period_end as number) * 1000).toISOString(),
    customer: sub.customer as string,
    metadata: sub.metadata as Record<string, string> | undefined,
    status: sub.status as string,
    cancelAtPeriodEnd: sub.cancel_at_period_end as boolean,
  };
}

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Stripe webhook not configured' }, { status: 500 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription' || !session.subscription) break;

        const userId = parseInt(session.metadata?.user_id ?? '');
        if (!userId) break;

        const rawSub = await stripe.subscriptions.retrieve(session.subscription as string) as unknown as Record<string, unknown>;
        const sub = getSubscriptionData(rawSub);

        await supabase.from('dashpass_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: sub.id,
          status: 'active',
          current_period_end: sub.currentPeriodEnd,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subId = invoice.subscription as string | null;
        if (!subId) break;

        const rawSub = await stripe.subscriptions.retrieve(subId) as unknown as Record<string, unknown>;
        const sub = getSubscriptionData(rawSub);
        const userId = parseInt(sub.metadata?.user_id ?? '');
        if (!userId) break;

        await supabase.from('dashpass_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: invoice.customer as string,
          stripe_subscription_id: sub.id,
          status: 'active',
          current_period_end: sub.currentPeriodEnd,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as unknown as Record<string, unknown>;
        const subId = invoice.subscription as string | null;
        if (!subId) break;

        await supabase.from('dashpass_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);
        break;
      }

      case 'customer.subscription.updated': {
        const rawSub = event.data.object as unknown as Record<string, unknown>;
        const sub = getSubscriptionData(rawSub);
        const userId = parseInt(sub.metadata?.user_id ?? '');
        if (!userId) break;

        await supabase.from('dashpass_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
          current_period_end: sub.currentPeriodEnd,
          canceled_at: sub.cancelAtPeriodEnd ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'customer.subscription.deleted': {
        const rawSub = event.data.object as unknown as Record<string, unknown>;
        const sub = getSubscriptionData(rawSub);

        await supabase.from('dashpass_subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}
