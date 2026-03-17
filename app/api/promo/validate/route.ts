import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface PromoCode {
  id: number;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  min_order_amount: number;
  expires_at: string | null;
  is_active: boolean;
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { code, cartTotal } = await request.json();

    if (!code || typeof cartTotal !== 'number') {
      return Response.json({ valid: false, error: 'Invalid request' });
    }

    const supabase = getSupabaseAdmin();

    const { data: promo, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .ilike('code', code.trim().toUpperCase())
      .maybeSingle();

    if (promoError) throw promoError;

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

    const { data: alreadyUsed } = await supabase
      .from('promo_code_uses')
      .select('id')
      .eq('promo_code_id', promo.id)
      .eq('user_id', userId)
      .maybeSingle();

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
