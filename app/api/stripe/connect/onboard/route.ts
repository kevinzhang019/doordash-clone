import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import getDb from '@/db/database';

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
  const db = getDb();

  let stripeAccountId: string | null = null;
  let entityId: number = userId;

  if (userRole === 'restaurant') {
    const row = db.prepare(`
      SELECT r.id, r.stripe_account_id
      FROM restaurants r
      JOIN restaurant_owners ro ON ro.restaurant_id = r.id
      WHERE ro.user_id = ?
    `).get(userId) as { id: number; stripe_account_id: string | null } | undefined;

    if (!row) return Response.json({ error: 'No restaurant found' }, { status: 404 });

    entityId = row.id;
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
      db.prepare('UPDATE restaurants SET stripe_account_id = ? WHERE id = ?').run(stripeAccountId, row.id);
    }
  } else {
    const row = db.prepare('SELECT stripe_account_id FROM users WHERE id = ?').get(userId) as { stripe_account_id: string | null } | undefined;
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
      db.prepare('UPDATE users SET stripe_account_id = ? WHERE id = ?').run(stripeAccountId, userId);
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
