import { NextRequest } from 'next/server';
import getDb from '@/db/database';

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  min_order_amount: number;
  expires_at: string | null;
  is_active: number;
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { code, cartTotal } = await request.json();

    if (!code || typeof cartTotal !== 'number') {
      return Response.json({ valid: false, error: 'Invalid request' });
    }

    const db = getDb();
    const promo = db.prepare(
      'SELECT * FROM promo_codes WHERE code = ? COLLATE NOCASE'
    ).get(code.trim().toUpperCase()) as PromoCode | undefined;

    if (!promo) {
      return Response.json({ valid: false, error: 'Promo code not found' });
    }
    if (!promo.is_active) {
      return Response.json({ valid: false, error: 'Promo code is no longer active' });
    }
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return Response.json({ valid: false, error: 'Promo code has expired' });
    }
    if (promo.max_uses !== null && promo.uses_count >= promo.max_uses) {
      return Response.json({ valid: false, error: 'Promo code has reached its usage limit' });
    }
    if (cartTotal < promo.min_order_amount) {
      return Response.json({ valid: false, error: `Minimum order of $${promo.min_order_amount.toFixed(2)} required` });
    }

    const alreadyUsed = db.prepare(
      'SELECT 1 FROM promo_code_uses WHERE promo_code_id = ? AND user_id = ?'
    ).get(promo.id, userId);
    if (alreadyUsed) {
      return Response.json({ valid: false, error: 'You have already used this promo code' });
    }

    const savings = promo.discount_type === 'flat'
      ? Math.min(promo.discount_value, cartTotal)
      : Math.round(cartTotal * (promo.discount_value / 100) * 100) / 100;

    return Response.json({
      valid: true,
      promo: {
        id: promo.id,
        code: promo.code,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        savings,
      },
    });
  } catch (error) {
    console.error('Promo validate error:', error);
    return Response.json({ valid: false, error: 'Internal server error' });
  }
}
