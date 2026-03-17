import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import getDb from '@/db/database';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const userRole = request.headers.get('x-user-role');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  if (userRole !== 'restaurant' && userRole !== 'driver') {
    return Response.json({ error: 'Invalid role' }, { status: 400 });
  }

  const db = getDb();
  let stripeAccountId: string | null = null;
  let isComplete = false;
  let entityId: number = userId;

  if (userRole === 'restaurant') {
    const row = db.prepare(`
      SELECT r.id, r.stripe_account_id, r.stripe_onboarding_complete
      FROM restaurants r
      JOIN restaurant_owners ro ON ro.restaurant_id = r.id
      WHERE ro.user_id = ?
    `).get(userId) as { id: number; stripe_account_id: string | null; stripe_onboarding_complete: number } | undefined;

    if (!row) return Response.json({ complete: false, hasRestaurant: false });
    stripeAccountId = row.stripe_account_id;
    isComplete = row.stripe_onboarding_complete === 1;
    entityId = row.id;
  } else {
    const row = db.prepare('SELECT stripe_account_id, stripe_onboarding_complete FROM users WHERE id = ?').get(userId) as { stripe_account_id: string | null; stripe_onboarding_complete: number } | undefined;
    if (!row) return Response.json({ complete: false });
    stripeAccountId = row.stripe_account_id;
    isComplete = row.stripe_onboarding_complete === 1;
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
          db.prepare('UPDATE restaurants SET stripe_onboarding_complete = 1 WHERE id = ?').run(entityId);
        } else {
          db.prepare('UPDATE users SET stripe_onboarding_complete = 1 WHERE id = ?').run(userId);
        }
        return Response.json({ complete: true, stripeAccountId });
      }
    } catch (e) {
      console.error('Stripe account check failed:', e);
    }
  }

  return Response.json({ complete: false, stripeAccountId });
}
