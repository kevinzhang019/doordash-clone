import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Order } from '@/lib/types';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '@/lib/email';
import { getItemDeal, dealSavings } from '@/lib/dealUtils';
import { calculateFees } from '@/lib/feeCalculation';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();

    // Fetch orders with restaurant name
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*, restaurants(name)')
      .eq('user_id', userId)
      .order('placed_at', { ascending: false });

    if (error) throw error;

    // Fetch item counts for all orders
    const orderIds = (orders || []).map((o: Order) => o.id);
    let itemCountMap: Record<number, number> = {};

    if (orderIds.length > 0) {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id, quantity')
        .in('order_id', orderIds);

      if (!itemsError && orderItems) {
        for (const item of orderItems) {
          itemCountMap[item.order_id] = (itemCountMap[item.order_id] || 0) + item.quantity;
        }
      }
    }

    // Map to expected format
    const mappedOrders = (orders || []).map((o: Record<string, unknown>) => ({
      ...o,
      restaurant_name: (o.restaurants as Record<string, unknown>)?.name,
      item_count: itemCountMap[o.id as number] || 0,
      restaurants: undefined,
    }));

    return Response.json({ orders: mappedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { deliveryAddress, tip = 0, deliveryFee: clientDeliveryFee, deliveryLat, deliveryLng, discountSaved = 0, promoCodeId, paymentIntentId, deliveryInstructions, handoffOption, expectedCartItemIds, dashpassSavings: clientDashpassSavings } = await request.json();

    // Verify Stripe payment authorization if provided
    if (paymentIntentId) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return Response.json({ error: 'Stripe not configured' }, { status: 500 });
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'requires_capture') {
        return Response.json({ error: 'Payment not authorized' }, { status: 402 });
      }
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return Response.json({ error: 'Delivery address is required' }, { status: 400 });
    }
    const tipAmount = Math.max(0, parseFloat(tip) || 0);

    const supabase = getSupabaseAdmin();

    // Check if any expected cart items were removed server-side (e.g. owner edited option groups)
    if (Array.isArray(expectedCartItemIds) && expectedCartItemIds.length > 0) {
      const { data: actualCartItems } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', userId)
        .in('id', expectedCartItemIds);

      const actualIds = new Set((actualCartItems ?? []).map((ci: { id: number }) => ci.id));
      const missingCartItemIds = (expectedCartItemIds as number[]).filter(id => !actualIds.has(id));

      if (missingCartItemIds.length > 0) {
        if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
          try {
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            await stripe.paymentIntents.cancel(paymentIntentId);
          } catch (cancelError) {
            console.error('Failed to cancel payment intent after cart mismatch:', cancelError);
          }
        }
        return Response.json({ error: 'cart_modified', missingCartItemIds }, { status: 409 });
      }
    }

    const lat = typeof deliveryLat === 'number' && isFinite(deliveryLat) ? deliveryLat : null;
    const lng = typeof deliveryLng === 'number' && isFinite(deliveryLng) ? deliveryLng : null;

    // Calculate deal discounts server-side (prevents client-side manipulation)
    let verifiedDealSavings = 0;
    const { data: cartItemsForDeals } = await supabase
      .from('cart_items')
      .select('menu_item_id, quantity, menu_items(price), cart_item_selections(price_modifier, quantity)')
      .eq('user_id', userId);

    if (cartItemsForDeals && cartItemsForDeals.length > 0) {
      const menuItemIds = cartItemsForDeals.map(ci => ci.menu_item_id);

      // Fetch active database deals for cart items
      const { data: activeDeals } = await supabase
        .from('deals')
        .select('menu_item_id, deal_type, discount_value')
        .in('menu_item_id', menuItemIds)
        .eq('is_active', true);

      const dealMap = new Map(activeDeals?.map(d => [d.menu_item_id, d]) ?? []);

      for (const item of cartItemsForDeals) {
        const basePrice = (item.menu_items as unknown as { price: number })?.price ?? 0;
        const selections = (item.cart_item_selections as unknown as { price_modifier: number; quantity: number }[]) ?? [];
        const selectionTotal = selections.reduce((sum, s) => sum + (s.price_modifier ?? 0) * (s.quantity ?? 1), 0);
        const price = basePrice + selectionTotal;

        // Check database deal first, then algorithmic deal
        const dbDeal = dealMap.get(item.menu_item_id);
        if (dbDeal) {
          verifiedDealSavings += dealSavings(
            { deal_type: dbDeal.deal_type as 'percentage_off' | 'bogo', discount_value: dbDeal.discount_value },
            price,
            item.quantity
          );
        } else if (deliveryAddress) {
          const algoDeal = getItemDeal(item.menu_item_id, deliveryAddress.trim());
          if (algoDeal) {
            verifiedDealSavings += dealSavings(algoDeal, price, item.quantity);
          }
        }
      }
    }

    // Verify PassDash subscription server-side
    let hasDashPass = false;
    const { data: dashPassSub } = await supabase
      .from('dashpass_subscriptions')
      .select('status, current_period_end')
      .eq('user_id', userId)
      .maybeSingle();

    if (dashPassSub && dashPassSub.status === 'active' && new Date(dashPassSub.current_period_end) > new Date()) {
      hasDashPass = true;
    }

    // If client claims PassDash savings but server finds no active subscription, reject
    if (clientDashpassSavings > 0 && !hasDashPass) {
      if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripe.paymentIntents.cancel(paymentIntentId);
        } catch (cancelError) {
          console.error('Failed to cancel payment intent after PassDash mismatch:', cancelError);
        }
      }
      return Response.json({ error: 'PassDash subscription is not active. Please refresh and try again.' }, { status: 403 });
    }

    // Compute raw cart total for fee calculation
    const cartTotal = cartItemsForDeals?.reduce((sum, item) => {
      const basePrice = (item.menu_items as unknown as { price: number })?.price ?? 0;
      const selections = (item.cart_item_selections as unknown as { price_modifier: number; quantity: number }[]) ?? [];
      const selectionTotal = selections.reduce((s, sel) => s + (sel.price_modifier ?? 0) * (sel.quantity ?? 1), 0);
      return sum + (basePrice + selectionTotal) * item.quantity;
    }, 0) ?? 0;

    // Server-side fee calculation with PassDash — clientDeliveryFee is the raw base delivery fee
    const rawDeliveryFee = typeof clientDeliveryFee === 'number' && isFinite(clientDeliveryFee) ? clientDeliveryFee : 2.99;
    const serverFees = calculateFees({
      discountedSubtotal: cartTotal - verifiedDealSavings,
      rawDeliveryFee: rawDeliveryFee,
      hasDashPass,
    });

    const verifiedPassDashSavings = hasDashPass ? serverFees.dashPassSavings : 0;

    const { data: result, error: rpcError } = await supabase.rpc('place_order', {
      p_user_id: userId,
      p_delivery_address: deliveryAddress.trim(),
      p_delivery_lat: lat,
      p_delivery_lng: lng,
      p_tip: tipAmount,
      p_delivery_fee_override: serverFees.displayDeliveryFee,
      p_discount_saved: Math.round(verifiedDealSavings * 100) / 100, // Server-verified deal savings
      p_promo_code_id: promoCodeId || null,
      p_payment_intent_id: paymentIntentId || null,
      p_payment_status: paymentIntentId ? 'paid' : 'pending',
      p_delivery_instructions: (typeof deliveryInstructions === 'string' && deliveryInstructions.trim()) ? deliveryInstructions.trim() : null,
      p_handoff_option: handoffOption || 'hand_off',
    });

    if (rpcError || result?.error) {
      const errorMessage = result?.error || rpcError?.message || 'Order placement failed';
      // Release payment authorization on failure
      if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
        try {
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          await stripe.paymentIntents.cancel(paymentIntentId);
        } catch (cancelError) {
          console.error('Failed to cancel payment intent after order failure:', cancelError);
        }
      }
      if (errorMessage === 'Cart is empty') {
        return Response.json({ error: 'Cart is empty' }, { status: 400 });
      }
      if (errorMessage.includes('Promo code already used')) {
        return Response.json({ error: 'This promo code has already been used' }, { status: 409 });
      }
      if (errorMessage === 'Restaurant not accepting orders') {
        return Response.json({ error: 'This restaurant is not accepting orders right now' }, { status: 503 });
      }
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    const orderId = result.orderId ?? result.orderid ?? result.order_id;

    // Store PassDash savings on the order
    if (verifiedPassDashSavings > 0) {
      await supabase.from('orders')
        .update({ dashpass_savings: Math.round(verifiedPassDashSavings * 100) / 100 })
        .eq('id', orderId);
    }

    // Order succeeded — capture the payment now
    if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        await stripe.paymentIntents.capture(paymentIntentId);
      } catch (captureError) {
        console.error('Failed to capture payment intent:', captureError);
        // Don't fail the order — the authorization is still valid and can be retried
      }
    }

    // Fire-and-forget: send order confirmation email
    const { data: orderForEmail } = await supabase
      .from('orders')
      .select('*, restaurants(name, delivery_max)')
      .eq('id', orderId)
      .single();

    const { data: userForEmail } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    const { data: itemsForEmail } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (orderForEmail && userForEmail) {
      const mappedOrder = {
        ...orderForEmail,
        restaurant_name: orderForEmail.restaurants?.name,
        delivery_max: orderForEmail.restaurants?.delivery_max,
      };
      sendOrderConfirmation(mappedOrder, itemsForEmail || [], userForEmail.email, userForEmail.name)
        .catch(err => console.error('Order confirmation email failed:', err));
    }

    return Response.json({ orderId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart is empty') {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }
    if (error instanceof Error && error.message === 'Restaurant not accepting orders') {
      return Response.json({ error: 'This restaurant is not accepting orders right now' }, { status: 503 });
    }
    console.error('Place order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
