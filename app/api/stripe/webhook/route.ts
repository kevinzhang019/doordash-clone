import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

// Extract period end from subscription — in Stripe SDK v20+ current_period_end
// moved from Subscription to SubscriptionItem, so we read it from items.data[0].
function getSubscriptionData(sub: Stripe.Subscription) {
  const periodEnd = sub.items.data[0]?.current_period_end;
  return {
    id: sub.id,
    currentPeriodEnd: periodEnd
      ? new Date(periodEnd * 1000).toISOString()
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // fallback: 30 days
    customer: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
    metadata: sub.metadata as Record<string, string> | undefined,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
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

        const retrievedSub = await stripe.subscriptions.retrieve(session.subscription as string, { expand: ['items.data'] });
        const sub = getSubscriptionData(retrievedSub);

        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id ?? sub.customer;
        await supabase.from('dashpass_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          status: 'active',
          current_period_end: sub.currentPeriodEnd,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id ?? null;
        if (!subId) break;

        const retrievedSub = await stripe.subscriptions.retrieve(subId, { expand: ['items.data'] });
        const sub = getSubscriptionData(retrievedSub);
        const userId = parseInt(sub.metadata?.user_id ?? '');
        if (!userId) break;

        await supabase.from('dashpass_subscriptions').upsert({
          user_id: userId,
          stripe_customer_id: sub.customer,
          stripe_subscription_id: sub.id,
          status: 'active',
          current_period_end: sub.currentPeriodEnd,
          canceled_at: null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subRef = invoice.parent?.subscription_details?.subscription;
        const subId = typeof subRef === 'string' ? subRef : subRef?.id ?? null;
        if (!subId) break;

        await supabase.from('dashpass_subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subId);
        break;
      }

      case 'customer.subscription.updated': {
        // Webhook payload may not include items — retrieve with expansion
        const updatedSubRaw = event.data.object as Stripe.Subscription;
        const updatedSub = updatedSubRaw.items?.data?.length
          ? updatedSubRaw
          : await stripe.subscriptions.retrieve(updatedSubRaw.id, { expand: ['items.data'] });
        const sub = getSubscriptionData(updatedSub);
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
        // Subscription is already deleted — do NOT try to retrieve it from Stripe.
        // Use the event payload directly; we only need the ID for the DB update.
        const deletedSub = event.data.object as Stripe.Subscription;

        await supabase.from('dashpass_subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', deletedSub.id);
        break;
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error);
    return Response.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return Response.json({ received: true });
}
