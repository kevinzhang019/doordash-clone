import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_DASHPASS_PRICE_ID) {
    return Response.json({ error: 'Stripe not configured for PassDash' }, { status: 500 });
  }

  try {
    const supabase = getSupabaseAdmin();

    // Check for existing active subscription
    const { data: existing } = await supabase
      .from('dashpass_subscriptions')
      .select('id, status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing && existing.status === 'active' && new Date(existing.current_period_end) > new Date()) {
      return Response.json({ error: 'You already have an active PassDash subscription' }, { status: 409 });
    }

    // Get user email
    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Find or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { user_id: userId.toString() },
      });
      customerId = customer.id;
    }

    // Get origin for redirect URLs
    const origin = request.headers.get('origin') || request.headers.get('referer')?.replace(/\/[^/]*$/, '') || 'http://localhost:3000';

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: process.env.STRIPE_DASHPASS_PRICE_ID, quantity: 1 }],
      success_url: `${origin}/settings?dashpass=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?dashpass=canceled`,
      metadata: { user_id: userId.toString() },
      subscription_data: {
        metadata: { user_id: userId.toString() },
      },
    });

    return Response.json({ checkoutUrl: session.url });
  } catch (error) {
    console.error('PassDash subscribe error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
