import { NextRequest } from 'next/server';
import getDb from '@/db/database';
import { signToken } from '@/lib/auth';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import type { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const user = db.prepare('SELECT id, email, name, role, phone, avatar_url FROM users WHERE id = ?').get(userId) as
    | { id: number; email: string; name: string; role: UserRole; phone: string | null; avatar_url: string | null }
    | undefined;

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  return Response.json({ user });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    const db = getDb();
    const currentUser = db.prepare('SELECT role, email, name FROM users WHERE id = ?').get(userId) as
      | { role: UserRole; email: string; name: string }
      | undefined;
    if (!currentUser) return Response.json({ error: 'User not found' }, { status: 404 });

    const newEmail = email?.toLowerCase().trim() || currentUser.email;
    const newName = name?.trim() || currentUser.name;

    if (!isValidEmail(newEmail)) {
      return Response.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    if (phone && !isValidPhone(phone.trim())) {
      return Response.json({ error: 'Please enter a valid phone number' }, { status: 400 });
    }

    // Check email uniqueness for same role (excluding current user)
    if (newEmail !== currentUser.email) {
      const conflict = db
        .prepare('SELECT id FROM users WHERE email = ? AND role = ? AND id != ?')
        .get(newEmail, currentUser.role, userId);
      if (conflict) return Response.json({ error: 'Email already in use' }, { status: 409 });
    }

    db.prepare('UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?').run(
      newName,
      newEmail,
      phone?.trim() || null,
      userId
    );

    // Re-issue JWT with updated name/email — return token so client can update sessionStorage
    const token = await signToken({ userId, email: newEmail, name: newName, role: currentUser.role });

    const updated = db.prepare('SELECT id, email, name, role, phone FROM users WHERE id = ?').get(userId);
    return Response.json({ user: updated, token });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: UserRole } | undefined;
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    db.transaction(() => {
      if (user.role === 'restaurant') {
        // Get this owner's restaurant
        const ownership = db.prepare('SELECT restaurant_id FROM restaurant_owners WHERE user_id = ?').get(userId) as
          | { restaurant_id: number }
          | undefined;

        if (ownership) {
          const { restaurant_id } = ownership;

          // Null out driver_user_id on orders for this restaurant (driver FKs)
          db.prepare('UPDATE orders SET driver_user_id = NULL WHERE restaurant_id = ?').run(restaurant_id);

          // Delete order_item_selections for this restaurant's orders
          db.prepare(`
            DELETE FROM order_item_selections WHERE order_item_id IN (
              SELECT oi.id FROM order_items oi
              JOIN orders o ON oi.order_id = o.id
              WHERE o.restaurant_id = ?
            )
          `).run(restaurant_id);

          // Delete order_items for this restaurant's orders
          db.prepare(`
            DELETE FROM order_items WHERE order_id IN (
              SELECT id FROM orders WHERE restaurant_id = ?
            )
          `).run(restaurant_id);

          // Delete reviews for this restaurant
          db.prepare('DELETE FROM reviews WHERE restaurant_id = ?').run(restaurant_id);

          // Delete orders for this restaurant
          db.prepare('DELETE FROM orders WHERE restaurant_id = ?').run(restaurant_id);

          // Delete cart_item_selections for this restaurant's cart items
          db.prepare(`
            DELETE FROM cart_item_selections WHERE cart_item_id IN (
              SELECT id FROM cart_items WHERE restaurant_id = ?
            )
          `).run(restaurant_id);

          // Delete cart items for this restaurant
          db.prepare('DELETE FROM cart_items WHERE restaurant_id = ?').run(restaurant_id);

          // Delete menu items (cascades to addons, option_groups, options)
          db.prepare('DELETE FROM menu_items WHERE restaurant_id = ?').run(restaurant_id);

          // Delete restaurant hours
          db.prepare('DELETE FROM restaurant_hours WHERE restaurant_id = ?').run(restaurant_id);

          // Delete restaurant_owners entry
          db.prepare('DELETE FROM restaurant_owners WHERE restaurant_id = ?').run(restaurant_id);

          // Delete the restaurant
          db.prepare('DELETE FROM restaurants WHERE id = ?').run(restaurant_id);
        }
      } else {
        // For customers and drivers: null out driver_user_id references on orders
        db.prepare('UPDATE orders SET driver_user_id = NULL WHERE driver_user_id = ?').run(userId);

        // Delete driver deliveries and sessions
        db.prepare(`
          DELETE FROM driver_deliveries WHERE session_id IN (
            SELECT id FROM driver_sessions WHERE user_id = ?
          )
        `).run(userId);
        db.prepare('DELETE FROM driver_sessions WHERE user_id = ?').run(userId);

        // Delete order_item_selections for this user's orders
        db.prepare(`
          DELETE FROM order_item_selections WHERE order_item_id IN (
            SELECT oi.id FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.user_id = ?
          )
        `).run(userId);

        // Delete order_items for this user's orders
        db.prepare(`
          DELETE FROM order_items WHERE order_id IN (
            SELECT id FROM orders WHERE user_id = ?
          )
        `).run(userId);

        // Delete reviews by this user
        db.prepare('DELETE FROM reviews WHERE user_id = ?').run(userId);

        // Delete orders by this user
        db.prepare('DELETE FROM orders WHERE user_id = ?').run(userId);

        // Delete cart_item_selections for this user's cart
        db.prepare(`
          DELETE FROM cart_item_selections WHERE cart_item_id IN (
            SELECT id FROM cart_items WHERE user_id = ?
          )
        `).run(userId);

        // Delete cart items
        db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(userId);
      }

      // Delete user addresses
      db.prepare('DELETE FROM user_addresses WHERE user_id = ?').run(userId);

      // Delete the user account
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    })();

    // Session token is in per-tab sessionStorage — client clears it on logout/delete
    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
