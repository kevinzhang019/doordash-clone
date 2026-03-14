import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { Order } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const db = getDb();
    const orders = db.prepare(`
      SELECT o.*, r.name as restaurant_name
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
    const { deliveryAddress, tip = 0, deliveryFee: clientDeliveryFee } = await request.json();

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
          ).all(...cartItemIds) as { id: number; cart_item_id: number; option_id: number | null; name: string; price_modifier: number }[]
        : [];

      // Use client-supplied delivery fee (calculated from distance) or fall back to restaurant default
      const restaurant = db.prepare('SELECT delivery_fee FROM restaurants WHERE id = ?').get(restaurantId) as { delivery_fee: number };

      const subtotal = cartItems.reduce((sum, item) => {
        const itemSelections = allSelections.filter(s => s.cart_item_id === item.id);
        const selTotal = itemSelections.reduce((s, sel) => s + sel.price_modifier, 0);
        return sum + (item.price + selTotal) * item.quantity;
      }, 0);
      const deliveryFee =
        typeof clientDeliveryFee === 'number' && clientDeliveryFee >= 0
          ? Math.round(clientDeliveryFee * 100) / 100
          : restaurant.delivery_fee;
      const total = subtotal + deliveryFee + tipAmount;

      // Insert order
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, restaurant_id, status, delivery_address, subtotal, delivery_fee, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, restaurantId, initialStatus, deliveryAddress.trim(), Math.round(subtotal * 100) / 100, deliveryFee, Math.round(total * 100) / 100);

      const orderId = orderResult.lastInsertRowid as number;

      // Insert order items (with price snapshots including selections)
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);
      const insertOrderItemSelection = db.prepare(`
        INSERT INTO order_item_selections (order_item_id, option_id, name, price_modifier) VALUES (?, ?, ?, ?)
      `);

      for (const item of cartItems) {
        const itemSelections = allSelections.filter(s => s.cart_item_id === item.id);
        const selTotal = itemSelections.reduce((s, sel) => s + sel.price_modifier, 0);
        const effectivePrice = Math.round((item.price + selTotal) * 100) / 100;

        const orderItemResult = insertOrderItem.run(orderId, item.menu_item_id, item.name, effectivePrice, item.quantity);
        const orderItemId = orderItemResult.lastInsertRowid as number;

        for (const sel of itemSelections) {
          insertOrderItemSelection.run(orderItemId, sel.option_id, sel.name, sel.price_modifier);
        }
      }

      // Clear cart
      db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);

      return orderId;
    });

    const orderId = placeOrder();
    return Response.json({ orderId }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'Cart is empty') {
      return Response.json({ error: 'Cart is empty' }, { status: 400 });
    }
    console.error('Place order error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
