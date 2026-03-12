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

      // Use client-supplied delivery fee (calculated from distance) or fall back to restaurant default
      const restaurant = db.prepare('SELECT delivery_fee FROM restaurants WHERE id = ?').get(restaurantId) as { delivery_fee: number };

      const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const deliveryFee =
        typeof clientDeliveryFee === 'number' && clientDeliveryFee >= 0
          ? Math.round(clientDeliveryFee * 100) / 100
          : restaurant.delivery_fee;
      const total = subtotal + deliveryFee + tipAmount;

      // Insert order
      const orderResult = db.prepare(`
        INSERT INTO orders (user_id, restaurant_id, status, delivery_address, subtotal, delivery_fee, total)
        VALUES (?, ?, 'placed', ?, ?, ?, ?)
      `).run(userId, restaurantId, deliveryAddress.trim(), subtotal, deliveryFee, total);

      const orderId = orderResult.lastInsertRowid as number;

      // Insert order items (with price snapshots)
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, name, price, quantity)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const item of cartItems) {
        insertOrderItem.run(orderId, item.menu_item_id, item.name, item.price, item.quantity);
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
