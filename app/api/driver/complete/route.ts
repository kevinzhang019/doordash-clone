import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendDeliveryReceipt } from '@/lib/email';
import { Order, OrderItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { deliveryId, sessionId, orderId, isSimulated } = await request.json();

    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Mark delivery complete — only if not already delivered
    const { data: updatedDelivery } = await supabase
      .from('driver_deliveries')
      .update({ status: 'delivered', delivered_at: now })
      .eq('id', deliveryId)
      .neq('status', 'delivered')
      .select('id, pay_amount, tip')
      .maybeSingle();

    // If real order, mark as delivered and clear chat
    if (!isSimulated && orderId) {
      await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: now })
        .eq('id', orderId)
        .neq('status', 'delivered');
      await supabase.from('messages').delete().eq('order_id', orderId);
    }

    let earned = 0;

    // Only update session earnings if delivery wasn't already counted
    if (updatedDelivery) {
      earned = (updatedDelivery.pay_amount || 0) + (updatedDelivery.tip || 0);

      // Get current session to update earnings
      const { data: currentSession } = await supabase
        .from('driver_sessions')
        .select('total_earnings, deliveries_completed')
        .eq('id', sessionId)
        .single();

      if (currentSession) {
        await supabase
          .from('driver_sessions')
          .update({
            total_earnings: (currentSession.total_earnings || 0) + earned,
            deliveries_completed: (currentSession.deliveries_completed || 0) + 1,
          })
          .eq('id', sessionId);
      }
    }

    const { data: session } = await supabase
      .from('driver_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    // Issue Stripe payouts to restaurant and driver for real paid orders
    if (!isSimulated && orderId && process.env.STRIPE_SECRET_KEY) {
      const { data: order } = await supabase
        .from('orders')
        .select('subtotal, discount_saved, payment_intent_id, restaurant_transfer_id, driver_transfer_id, restaurant_id, driver_user_id')
        .eq('id', orderId)
        .single();

      if (order?.payment_intent_id) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Retrieve the underlying charge ID so transfers can be funded from this
        // specific payment rather than the platform's general Stripe balance.
        let chargeId: string | undefined;
        try {
          const intent = await stripe.paymentIntents.retrieve(order.payment_intent_id, {
            expand: ['latest_charge'],
          });
          const latestCharge = intent.latest_charge;
          chargeId = typeof latestCharge === 'string' ? latestCharge : latestCharge?.id;
        } catch (e) {
          console.error('Failed to retrieve payment intent for transfer:', e);
        }

        // Payout restaurant: subtotal minus their own deal discounts
        if (!order.restaurant_transfer_id) {
          const { data: rest } = await supabase
            .from('restaurants')
            .select('stripe_account_id')
            .eq('id', order.restaurant_id)
            .single();

          if (rest?.stripe_account_id) {
            const restaurantCents = Math.max(0, Math.round((order.subtotal - (order.discount_saved ?? 0)) * 100));
            try {
              const transfer = await stripe.transfers.create({
                amount: restaurantCents,
                currency: 'usd',
                destination: rest.stripe_account_id,
                transfer_group: `order_${orderId}`,
                ...(chargeId ? { source_transaction: chargeId } : {}),
                metadata: { orderId: String(orderId), type: 'restaurant_payout' },
              });
              await supabase
                .from('orders')
                .update({ restaurant_transfer_id: transfer.id })
                .eq('id', orderId);
            } catch (e) {
              console.error('Restaurant transfer failed:', e);
            }
          }
        }

        // Payout driver (their delivery pay + tip)
        if (!order.driver_transfer_id && order.driver_user_id) {
          const { data: driverUser } = await supabase
            .from('users')
            .select('stripe_account_id')
            .eq('id', order.driver_user_id)
            .single();

          const { data: delivery } = await supabase
            .from('driver_deliveries')
            .select('pay_amount, tip')
            .eq('id', deliveryId)
            .single();

          if (driverUser?.stripe_account_id && delivery) {
            const driverCents = Math.round((delivery.pay_amount + delivery.tip) * 100);
            if (driverCents > 0) {
              try {
                const transfer = await stripe.transfers.create({
                  amount: driverCents,
                  currency: 'usd',
                  destination: driverUser.stripe_account_id,
                  transfer_group: `order_${orderId}`,
                  ...(chargeId ? { source_transaction: chargeId } : {}),
                  metadata: { orderId: String(orderId), type: 'driver_payout' },
                });
                await supabase
                  .from('orders')
                  .update({ driver_transfer_id: transfer.id })
                  .eq('id', orderId);
              } catch (e) {
                console.error('Driver transfer failed:', e);
              }
            }
          }
        }
      }
    }

    // Fire-and-forget delivery receipt email
    if (!isSimulated && orderId) {
      const { data: orderWithUser } = await supabase
        .from('orders')
        .select('*, restaurants(name), users!orders_user_id_fkey(email, name)')
        .eq('id', orderId)
        .single();

      if (orderWithUser) {
        const restaurant = orderWithUser.restaurants as unknown as { name: string };
        const user = orderWithUser.users as unknown as { email: string; name: string };
        const orderForEmail = { ...orderWithUser, restaurant_name: restaurant.name } as Order & { restaurant_name: string };

        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderId);

        sendDeliveryReceipt(orderForEmail, (items ?? []) as OrderItem[], user.email, user.name)
          .catch(err => console.error('Delivery receipt email failed:', err));
      }
    }

    return Response.json({ success: true, earned, session });
  } catch (error) {
    console.error('Complete delivery error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
