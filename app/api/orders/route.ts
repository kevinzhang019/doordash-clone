import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Order } from '@/lib/types';
import { isCurrentlyOpen, HoursRow } from '@/lib/hours';
import Stripe from 'stripe';
import { sendOrderConfirmation } from '@/lib/email';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name,
        (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.user_id = ?
      ORDER BY o.placed_at DESC
    `).all(userId) as Order[];

    return Response.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { deliveryAddress, tip = 0, deliveryFee: clientDeliveryFee, deliveryLat, deliveryLng, discountSaved = 0, promoCodeId, paymentIntentId } = await request.json();

    // Verify Stripe payment if provided
    if (paymentIntentId) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return Response.json({ error: 'Stripe not configured' }, { status: 500 });
      }
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (intent.status !== 'succeeded') {
        return Response.json({ error: 'Payment not completed' }, { status: 402 });
      }
    }

    if (!deliveryAddress || !deliveryAddress.trim()) {
      return Response.json({ error: 'Delivery address is required' }, { status: 400 });
    }
    const tipAmount = Math.max(0, parseFloat(tip) || 0);

    const db = getDb();

    const placeOrder = db.transaction(() => {
      // Fetch cart items with price snapshots
      const cartItems = db.prepare(`
        SELECT ci.id, ci.menu_item_id, ci.quantity, ci.restaurant_id,
               mi.name, mi.price
        FROM cart_items ci
        JOIN menu_items mi ON ci.menu_item_id = mi.id
        WHERE ci.user_id = ?
      `).all(userId) as Array<{
        id: number;
        menu_item_id: number;
        quantity: number;
        restaurant_id: number;
        name: string;
        price: number;
      }>;

      if (cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      const restaurantId = cartItems[0].restaurant_id;

      // Default (seeded) restaurants have no owner — auto-advance to 'ready'
      const isOwned = !!db.prepare('SELECT 1 FROM restaurant_owners WHERE restaurant_id = ?').get(restaurantId);
      const initialStatus = isOwned ? 'placed' : 'ready';

      // Fetch selections for all cart items
      const cartItemIds = cartItems.map(ci => ci.id);
      const allSelections = cartItemIds.length > 0
        ? db.prepare(
            `SELECT * FROM cart_item_selections WHERE cart_item_id IN (${cartItemIds.map(() => '?').join(',')})`
          ).all(...cartItemIds) as { id: number; cart_item_id: number; option_id: number | null; name: string; price_modifier: number; quantity: number }[]
        : [];

      // Use client-supplied delivery fee (calculated from distance) or fall back to restaurant default
      const restaurant = db.prepare('SELECT delivery_fee, is_accepting_orders FROM restaurants WHERE id = ?').get(restaurantId) as { delivery_fee: number; is_accepting_orders: number };
      const restaurantHours = isOwned
        ? db.prepare('SELECT day_of_week, open_time, close_time, is_closed FROM restaurant_hours WHERE restaurant_id = ? ORDER BY day_of_week').all(restaurantId) as HoursRow[]
        : [];

      if (!restaurant.is_accepting_orders || (isOwned && !isCurrentlyOpen(restaurantHours))) {
        throw new Error('Restaurant not accepting orders');
      }

      const subtotal = cartItems.reduce((sum, item) => {
        const itemSelections = allSelections.filter(s => s.cart_item_id === item.id);
        const selTotal = itemSelections.reduce((s, sel) => s + sel.price_modifier * (sel.quantity ?? 1), 0);
        return sum + (item.price + selTotal) * item.quantity;
      }, 0);
      const deliveryFee =
        typeof clientDeliveryFee === 'number' && clientDeliveryFee >= 0
          ? Math.round(clientDeliveryFee * 100) / 100
          : restaurant.delivery_fee;
      const discountAmount = Math.max(0, parseFloat(discountSaved) || 0);

      // Re-validate and apply promo code inside transaction (race-condition safety)
      let promoDiscount = 0;
      let resolvedPromoCodeId: number | null = promoCodeId ?? null;
      if (promoCodeId) {
        const promo = db.prepare(`
          SELECT * FROM promo_codes WHERE id = ? AND is_active = 1
        `).get(promoCodeId) as { id: number; discount_type: string; discount_value: number; max_uses: number | null; uses_count: number; min_order_amount: number; expires_at: string | null } | undefined;

        const alreadyUsed = promo ? db.prepare('SELECT 1 FROM promo_code_uses WHERE promo_code_id = ? AND user_id = ?').get(promo.id, userId) : null;

        if (promo && !alreadyUsed &&
          (promo.max_uses === null || promo.uses_count < promo.max_uses) &&
          subtotal >= promo.min_order_amount &&
          (!promo.expires_at || new Date(promo.expires_at) >= new Date())) {
          promoDiscount = promo.discount_type === 'flat'
            ? Math.min(promo.discount_value, subtotal)
            : Math.round(subtotal * (promo.discount_value / 100) * 100) / 100;
          db.prepare('UPDATE promo_codes SET uses_count = uses_count + 1 WHERE id = ?').run(promo.id);
          resolvedPromoCodeId = promo.id;
        } else {
          resolvedPromoCodeId = null;
        }
      }

      const totalDiscount = discountAmount + promoDiscount;
      const taxAmount = Math.round((subtotal - totalDiscount) * 0.085 * 100) / 100;
      const total = subtotal - totalDiscount + deliveryFee + tipAmount + taxAmount;
      const paymentStatus = paymentIntentId ? 'paid' : 'pending';

      // Insert order
      const lat = typeof deliveryLat === 'number' && isFinite(deliveryLat) ? deliveryLat : null;
      const lng = typeof deliveryLng === 'number' && isFinite(deliveryLng) ? deliveryLng : null;
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, restaurant_id, status, delivery_address, delivery_lat, delivery_lng, subtotal, delivery_fee, tip, tax, total, discount_saved, promo_code_id, promo_discount, payment_intent_id, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(userId, restaurantId, initialStatus, deliveryAddress.trim(), lat, lng, Math.round(subtotal * 100) / 100, deliveryFee, Math.round(tipAmount * 100) / 100, taxAmount, Math.round(total * 100) / 100, Math.round(discountAmount * 100) / 100, resolvedPromoCodeId, Math.round(promoDiscount * 100) / 100, paymentIntentId ?? null, paymentStatus);

      const orderId = orderResult.lastInsertRowid as number;

      // Insert order items (with price snapshots including selections)
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertOrderItemSelection = db.prepare(`
        INSERT INTO order_item_selections (order_item_id, option_id, name, price_modifier, quantity) VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of cartItems) {
        const itemSelections = allSelections.filter(s => s.cart_item_id === item.id);
        const selTotal = itemSelections.reduce((s, sel) => s + sel.price_modifier * (sel.quantity ?? 1), 0);
        const effectivePrice = Math.round((item.price + selTotal) * 100) / 100;

        const orderItemResult = insertOrderItem.run(orderId, item.menu_item_id, item.name, effectivePrice, item.quantity);
        const orderItemId = orderItemResult.lastInsertRowid as number;

        for (const sel of itemSelections) {
          insertOrderItemSelection.run(orderItemId, sel.option_id, sel.name, sel.price_modifier, sel.quantity ?? 1);
        }
      }

      // Record promo code use
      if (resolvedPromoCodeId) {
        db.prepare(`
          INSERT INTO promo_code_uses (promo_code_id, user_id, order_id) VALUES (?, ?, ?)
        `).run(resolvedPromoCodeId, userId, orderId);
      }

      // Clear cart
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

      return orderId;
    });

    const orderId = placeOrder();

    // Fire-and-forget: send order confirmation email
    const db2 = getDb();
    const orderForEmail = db2.prepare(`
      SELECT o.*, r.name as restaurant_name, r.delivery_max
      FROM orders o JOIN restaurants r ON o.restaurant_id = r.id
      WHERE o.id = ?
    `).get(orderId) as (Order & { restaurant_name: string; delivery_max: number }) | undefined;
    const userForEmail = db2.prepare('SELECT email, name FROM users WHERE id = ?').get(userId) as { email: string; name: string } | undefined;
    const itemsForEmail = db2.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId) as import('@/lib/types').OrderItem[];
    if (orderForEmail && userForEmail) {
      sendOrderConfirmation(orderForEmail, itemsForEmail, userForEmail.email, userForEmail.name)
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
