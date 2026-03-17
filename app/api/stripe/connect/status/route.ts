import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const userRole = request.headers.get('x-user-role');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (userRole !== 'restaurant' && userRole !== 'driver') {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  let stripeAccountId: string | null = null;
  let isComplete = false;
  let entityId: number = userId;

  if (userRole === 'restaurant') {
    const { data: ownership } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!ownership) return Response.json({ complete: false, hasRestaurant: false });

    const { data: row } = await supabase
      .from('restaurants')
      .select('id, stripe_account_id, stripe_onboarding_complete')
      .eq('id', ownership.restaurant_id)
      .single();

    if (!row) return Response.json({ complete: false, hasRestaurant: false });
    stripeAccountId = row.stripe_account_id;
    isComplete = row.stripe_onboarding_complete === true;
    entityId = row.id;
  } else {
    const { data: row } = await supabase
      .from('users')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', userId)
      .maybeSingle();

    if (!row) return Response.json({ complete: false });
    stripeAccountId = row.stripe_account_id;
    isComplete = row.stripe_onboarding_complete === true;
  }

  if (isComplete) {
    return Response.json({ complete: true, stripeAccountId });
  }

  // Check with Stripe API to catch just-completed onboarding
  if (stripeAccountId && process.env.STRIPE_SECRET_KEY) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const account = await stripe.accounts.retrieve(stripeAccountId);

      if (account.details_submitted) {
        if (userRole === 'restaurant') {
          await supabase
            .from('restaurants')
            .update({ stripe_onboarding_complete: true })
            .eq('id', entityId);
        } else {
          await supabase
            .from('users')
            .update({ stripe_onboarding_complete: true })
            .eq('id', userId);
        }
        return Response.json({ complete: true, stripeAccountId });
      }
    } catch (e) {
      console.error('Stripe account check failed:', e);
    }
  }

  return Response.json({ complete: false, stripeAccountId });
}
