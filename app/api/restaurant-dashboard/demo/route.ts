import { NextRequest } from 'next/server';
import getDb from '@/db/database';

function getRestaurantId(userId: number) {
  const db = getDb();
  const owner = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as { restaurant_id: number } | undefined;
  return owner?.restaurant_id ?? null;
}

const FAKE_ADDRESSES = [
  '123 Main St, San Francisco, CA',
  '456 Oak Ave, Oakland, CA',
  '789 Pine St, Berkeley, CA',
  '321 Elm St, San Jose, CA',
  '654 Maple Dr, Palo Alto, CA',
  '987 Cedar Ln, Sunnyvale, CA',
  '111 Birch Blvd, Mountain View, CA',
  '222 Willow Way, Fremont, CA',
  '333 Spruce St, Hayward, CA',
  '444 Ash Ave, Richmond, CA',
];

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1));
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function seedDemoOrders(restaurantId: number) {
  const db = getDb();

  // Check if already seeded
  const existing = db.prepare('SELECT COUNT(*) as count FROM orders WHERE restaurant_id = ? AND is_demo = 1').get(restaurantId) as { count: number };
  if (existing.count > 0) {
    return { message: 'Demo data already exists', count: existing.count };
  }

  const menuItems = db.prepare('SELECT id, name, price FROM menu_items WHERE restaurant_id = ? AND is_available = 1').all(restaurantId) as { id: number; name: string; price: number }[];
  if (menuItems.length === 0) {
    return { message: 'No menu items found' };
  }

  const restaurant = db.prepare('SELECT delivery_fee FROM restaurants WHERE id = ?').get(restaurantId) as { delivery_fee: number };

  const insertOrder = db.prepare(`
    INSERT INTO orders (user_id, restaurant_id, status, delivery_address, subtotal, delivery_fee, total, placed_at, is_demo)
    VALUES (1, ?, 'delivered', ?, ?, ?, ?, ?, 1)
  `);
  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)
  `);

  const txn = db.transaction(() => {
    for (let i = 0; i < 300; i++) {
      // Random date in the past 365 days
      const daysAgo = randomBetween(0, 365);
      const placedAt = new Date(Date.now() - daysAgo * 86400000);
      // Add some time variation within the day
      placedAt.setHours(randomInt(10, 22), randomInt(0, 59), 0, 0);
      const placedAtStr = placedAt.toISOString().replace('T', ' ').slice(0, 19);

      const address = randomChoice(FAKE_ADDRESSES);
      const numItems = randomInt(1, 4);
      const selectedItems: { item: typeof menuItems[0]; qty: number }[] = [];
      for (let j = 0; j < numItems; j++) {
        selectedItems.push({ item: randomChoice(menuItems), qty: randomInt(1, 3) });
      }

      const subtotal = selectedItems.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
      const deliveryFee = restaurant.delivery_fee;
      const total = Math.round((subtotal + deliveryFee) * 100) / 100;

      const orderResult = insertOrder.run(restaurantId, address, Math.round(subtotal * 100) / 100, deliveryFee, total, placedAtStr);
      const orderId = orderResult.lastInsertRowid;

      for (const { item, qty } of selectedItems) {
        insertOrderItem.run(orderId, item.id, item.name, item.price, qty);
      }
    }
  });

  txn();

  return { message: 'Demo data seeded', count: 300 };
}

function seedLiveOrder(restaurantId: number) {
  const db = getDb();

  const menuItems = db.prepare('SELECT id, name, price FROM menu_items WHERE restaurant_id = ? AND is_available = 1').all(restaurantId) as { id: number; name: string; price: number }[];
  if (menuItems.length === 0) return;

  const restaurant = db.prepare('SELECT delivery_fee FROM restaurants WHERE id = ?').get(restaurantId) as { delivery_fee: number };
  const address = randomChoice(FAKE_ADDRESSES);
  const numItems = randomInt(1, 3);
  const selectedItems: { item: typeof menuItems[0]; qty: number }[] = [];
  for (let j = 0; j < numItems; j++) {
    selectedItems.push({ item: randomChoice(menuItems), qty: randomInt(1, 2) });
  }

  const subtotal = selectedItems.reduce((sum, { item, qty }) => sum + item.price * qty, 0);
  const deliveryFee = restaurant.delivery_fee;
  const total = Math.round((subtotal + deliveryFee) * 100) / 100;

  const txn = db.transaction(() => {
    const orderResult = db.prepare(`
      INSERT INTO orders (user_id, restaurant_id, status, delivery_address, subtotal, delivery_fee, total, placed_at, is_demo)
      VALUES (1, ?, 'delivered', ?, ?, ?, ?, datetime('now'), 1)
    `).run(restaurantId, address, Math.round(subtotal * 100) / 100, deliveryFee, total);
    const orderId = orderResult.lastInsertRowid;
    for (const { item, qty } of selectedItems) {
      db.prepare('INSERT INTO order_items (order_id, menu_item_id, name, price, quantity) VALUES (?, ?, ?, ?, ?)').run(orderId, item.id, item.name, item.price, qty);
    }
  });
  txn();
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const { action } = await request.json();

    if (action === 'seed') {
      const result = seedDemoOrders(restaurantId);
      return Response.json(result);
    } else if (action === 'live') {
      seedLiveOrder(restaurantId);
      return Response.json({ success: true });
    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Demo error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const role = request.headers.get('x-user-role');
  if (!userId || role !== 'restaurant') return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const restaurantId = getRestaurantId(userId);
  if (!restaurantId) return Response.json({ error: 'No restaurant found' }, { status: 404 });

  try {
    const db = getDb();
    db.prepare('DELETE FROM orders WHERE restaurant_id = ? AND is_demo = 1').run(restaurantId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete demo error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
