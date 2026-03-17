import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const userRole = request.headers.get('x-user-role');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (!process.env.STRIPE_SECRET_KEY) {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  if (userRole !== 'restaurant' && userRole !== 'driver') {
    return Response.json({ error: 'Invalid role for Connect onboarding' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const supabase = getSupabaseAdmin();

  let stripeAccountId: string | null = null;

  if (userRole === 'restaurant') {
    const { data: ownership } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!ownership) return Response.json({ error: 'No restaurant found' }, { status: 404 });

    const { data: row } = await supabase
      .from('restaurants')
      .select('id, stripe_account_id')
      .eq('id', ownership.restaurant_id)
      .single();

    if (!row) return Response.json({ error: 'No restaurant found' }, { status: 404 });

    stripeAccountId = row.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { restaurantId: String(row.id), userId: String(userId) },
      });
      stripeAccountId = account.id;
      await supabase
        .from('restaurants')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', row.id);
    }
  } else {
    const { data: row } = await supabase
      .from('users')
      .select('stripe_account_id')
      .eq('id', userId)
      .maybeSingle();

    if (!row) return Response.json({ error: 'User not found' }, { status: 404 });

    stripeAccountId = row.stripe_account_id;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        capabilities: {
          transfers: { requested: true },
        },
        metadata: { userId: String(userId), role: 'driver' },
      });
      stripeAccountId = account.id;
      await supabase
        .from('users')
        .update({ stripe_account_id: stripeAccountId })
        .eq('id', userId);
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId!,
    refresh_url: `${baseUrl}/stripe-refresh?role=${userRole}`,
    return_url: `${baseUrl}/stripe-return?role=${userRole}`,
    type: 'account_onboarding',
  });

  return Response.json({ url: accountLink.url });
}
