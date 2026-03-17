import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { Order } from '@/lib/types';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '@/lib/email';

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
    const { deliveryAddress, tip = 0, deliveryFee: clientDeliveryFee, deliveryLat, deliveryLng, discountSaved = 0, promoCodeId, paymentIntentId, deliveryInstructions, handoffOption } = await request.json();

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

    const lat = typeof deliveryLat === 'number' && isFinite(deliveryLat) ? deliveryLat : null;
    const lng = typeof deliveryLng === 'number' && isFinite(deliveryLng) ? deliveryLng : null;

    const { data: result, error: rpcError } = await supabase.rpc('place_order', {
      p_user_id: userId,
      p_delivery_address: deliveryAddress.trim(),
      p_delivery_lat: lat,
      p_delivery_lng: lng,
      p_tip: tipAmount,
      p_delivery_fee_override: typeof clientDeliveryFee === 'number' && clientDeliveryFee >= 0 ? Math.round(clientDeliveryFee * 100) / 100 : null,
      p_discount_saved: Math.max(0, parseFloat(discountSaved) || 0),
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
      if (errorMessage === 'Restaurant not accepting orders') {
        return Response.json({ error: 'This restaurant is not accepting orders right now' }, { status: 503 });
      }
      return Response.json({ error: errorMessage }, { status: 500 });
    }

    const orderId = result.orderId ?? result.orderid ?? result.order_id;

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

    // Save delivery preferences for this address
    const savedInstructions = (typeof deliveryInstructions === 'string' && deliveryInstructions.trim()) ? deliveryInstructions.trim() : null;
    await supabase.from('user_addresses').update({
      delivery_instructions: savedInstructions,
      handoff_option: handoffOption ?? 'hand_off'
    }).eq('user_id', userId).eq('address', deliveryAddress.trim());

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
