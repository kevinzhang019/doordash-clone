import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import getDb from '@/db/database';
import { sendDeliveryReceipt } from '@/lib/email';
import { Order, OrderItem } from '@/lib/types';

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'driver') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { deliveryId, sessionId, orderId, isSimulated } = await request.json();

    const db = getDb();

    const txn = db.transaction(() => {
      // Mark delivery complete
      db.prepare("UPDATE driver_deliveries SET status = 'delivered', delivered_at = datetime('now') WHERE id = ?").run(deliveryId);

      // If real order, mark as delivered and clear chat
      if (!isSimulated && orderId) {
        db.prepare("UPDATE orders SET status = 'delivered', delivered_at = datetime('now') WHERE id = ?").run(orderId);
        db.prepare('DELETE FROM messages WHERE order_id = ?').run(orderId);
      }

      // Get delivery pay info
      const delivery = db.prepare('SELECT pay_amount, tip FROM driver_deliveries WHERE id = ?').get(deliveryId) as { pay_amount: number; tip: number } | undefined;
      const earned = (delivery?.pay_amount || 0) + (delivery?.tip || 0);

      // Update session earnings
      db.prepare('UPDATE driver_sessions SET total_earnings = total_earnings + ?, deliveries_completed = deliveries_completed + 1 WHERE id = ?').run(earned, sessionId);

      return earned;
    });

    const earned = txn();

    const session = db.prepare('SELECT * FROM driver_sessions WHERE id = ?').get(sessionId);

    // Issue Stripe payouts to restaurant and driver for real paid orders
    if (!isSimulated && orderId && process.env.STRIPE_SECRET_KEY) {
      const order = db.prepare(`
        SELECT o.subtotal, o.discount_saved, o.payment_intent_id, o.restaurant_transfer_id, o.driver_transfer_id,
               o.restaurant_id, o.driver_user_id
        FROM orders o WHERE o.id = ?
      `).get(orderId) as {
        subtotal: number;
        discount_saved: number;
        payment_intent_id: string | null;
        restaurant_transfer_id: string | null;
        driver_transfer_id: string | null;
        restaurant_id: number;
        driver_user_id: number | null;
      } | undefined;

      if (order?.payment_intent_id) {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

        // Payout restaurant: subtotal minus their own deal discounts
        // Platform absorbs promo code discounts (not the restaurant's responsibility)
        if (!order.restaurant_transfer_id) {
          const rest = db.prepare('SELECT stripe_account_id FROM restaurants WHERE id = ?').get(order.restaurant_id) as { stripe_account_id: string | null } | undefined;
          if (rest?.stripe_account_id) {
            const restaurantCents = Math.max(0, Math.round((order.subtotal - (order.discount_saved ?? 0)) * 100));
            try {
              const transfer = await stripe.transfers.create({
                amount: restaurantCents,
                currency: 'usd',
                destination: rest.stripe_account_id,
                transfer_group: `order_${orderId}`,
                metadata: { orderId: String(orderId), type: 'restaurant_payout' },
              });
              db.prepare('UPDATE orders SET restaurant_transfer_id = ? WHERE id = ?').run(transfer.id, orderId);
            } catch (e) {
              console.error('Restaurant transfer failed:', e);
            }
          }
        }

        // Payout driver (their delivery pay + tip)
        if (!order.driver_transfer_id && order.driver_user_id) {
          const driverUser = db.prepare('SELECT stripe_account_id FROM users WHERE id = ?').get(order.driver_user_id) as { stripe_account_id: string | null } | undefined;
          const delivery = db.prepare('SELECT pay_amount, tip FROM driver_deliveries WHERE id = ?').get(deliveryId) as { pay_amount: number; tip: number } | undefined;
          if (driverUser?.stripe_account_id && delivery) {
            const driverCents = Math.round((delivery.pay_amount + delivery.tip) * 100);
            if (driverCents > 0) {
              try {
                const transfer = await stripe.transfers.create({
                  amount: driverCents,
                  currency: 'usd',
                  destination: driverUser.stripe_account_id,
                  transfer_group: `order_${orderId}`,
                  metadata: { orderId: String(orderId), type: 'driver_payout' },
                });
                db.prepare('UPDATE orders SET driver_transfer_id = ? WHERE id = ?').run(transfer.id, orderId);
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
      const orderWithUser = db.prepare(`
        SELECT o.*, r.name as restaurant_name, u.email, u.name as user_name
        FROM orders o
        JOIN restaurants r ON o.restaurant_id = r.id
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `).get(orderId) as (Order & { restaurant_name: string; email: string; user_name: string }) | undefined;
      if (orderWithUser) {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as OrderItem[];
        sendDeliveryReceipt(orderWithUser, items, orderWithUser.email, orderWithUser.user_name)
          .catch(err => console.error('Delivery receipt email failed:', err));
      }
    }

    return Response.json({ success: true, earned, session });
  } catch (error) {
    console.error('Complete delivery error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
