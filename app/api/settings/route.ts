import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { signToken } from '@/lib/auth';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import type { UserRole } from '@/lib/types';

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, phone, avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Get settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
  return Response.json({ user });
}

export async function PUT(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, email, phone } = await request.json();

    const supabase = getSupabaseAdmin();
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, email, name')
      .eq('id', userId)
      .maybeSingle();

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
      const { data: conflict } = await supabase
        .from('users')
        .select('id')
        .eq('email', newEmail)
        .eq('role', currentUser.role)
        .neq('id', userId)
        .maybeSingle();
      if (conflict) return Response.json({ error: 'Email already in use' }, { status: 409 });
    }

    await supabase
      .from('users')
      .update({ name: newName, email: newEmail, phone: phone?.trim() || null })
      .eq('id', userId);

    // Re-issue JWT with updated name/email — return token so client can update sessionStorage
    const token = await signToken({ userId, email: newEmail, name: newName, role: currentUser.role as UserRole });

    const { data: updated } = await supabase
      .from('users')
      .select('id, email, name, role, phone')
      .eq('id', userId)
      .single();

    return Response.json({ user: updated, token });
  } catch (error) {
    console.error('Update settings error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    if (user.role === 'restaurant') {
      // Get this owner's restaurant
      const { data: ownership } = await supabase
        .from('restaurant_owners')
        .select('restaurant_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (ownership) {
        const { restaurant_id } = ownership;

        // Null out driver_user_id on orders for this restaurant
        await supabase
          .from('orders')
          .update({ driver_user_id: null })
          .eq('restaurant_id', restaurant_id);

        // Get order IDs for this restaurant to delete related records
        const { data: restaurantOrders } = await supabase
          .from('orders')
          .select('id')
          .eq('restaurant_id', restaurant_id);
        const orderIds = (restaurantOrders || []).map((o: { id: number }) => o.id);

        if (orderIds.length > 0) {
          // Get order_item IDs for these orders
          const { data: orderItemRows } = await supabase
            .from('order_items')
            .select('id')
            .in('order_id', orderIds);
          const orderItemIds = (orderItemRows || []).map((oi: { id: number }) => oi.id);

          // Delete order_item_selections
          if (orderItemIds.length > 0) {
            await supabase
              .from('order_item_selections')
              .delete()
              .in('order_item_id', orderItemIds);
          }

          // Delete order_items
          await supabase
            .from('order_items')
            .delete()
            .in('order_id', orderIds);
        }

        // Delete reviews for this restaurant
        await supabase.from('reviews').delete().eq('restaurant_id', restaurant_id);

        // Delete orders for this restaurant
        await supabase.from('orders').delete().eq('restaurant_id', restaurant_id);

        // Get cart_item IDs for this restaurant
        const { data: cartItemRows } = await supabase
          .from('cart_items')
          .select('id')
          .eq('restaurant_id', restaurant_id);
        const cartItemIds = (cartItemRows || []).map((ci: { id: number }) => ci.id);

        if (cartItemIds.length > 0) {
          await supabase
            .from('cart_item_selections')
            .delete()
            .in('cart_item_id', cartItemIds);
        }

        // Delete cart items for this restaurant
        await supabase.from('cart_items').delete().eq('restaurant_id', restaurant_id);

        // Delete menu items
        await supabase.from('menu_items').delete().eq('restaurant_id', restaurant_id);

        // Delete restaurant hours
        await supabase.from('restaurant_hours').delete().eq('restaurant_id', restaurant_id);

        // Delete restaurant_owners entry
        await supabase.from('restaurant_owners').delete().eq('restaurant_id', restaurant_id);

        // Delete the restaurant
        await supabase.from('restaurants').delete().eq('id', restaurant_id);
      }
    } else {
      // For customers and drivers: null out driver_user_id references on orders
      await supabase
        .from('orders')
        .update({ driver_user_id: null })
        .eq('driver_user_id', userId);

      // Get driver session IDs
      const { data: driverSessions } = await supabase
        .from('driver_sessions')
        .select('id')
        .eq('user_id', userId);
      const sessionIds = (driverSessions || []).map((s: { id: number }) => s.id);

      if (sessionIds.length > 0) {
        await supabase
          .from('driver_deliveries')
          .delete()
          .in('session_id', sessionIds);
      }
      await supabase.from('driver_sessions').delete().eq('user_id', userId);

      // Get order IDs for this user
      const { data: userOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', userId);
      const orderIds = (userOrders || []).map((o: { id: number }) => o.id);

      if (orderIds.length > 0) {
        const { data: orderItemRows } = await supabase
          .from('order_items')
          .select('id')
          .in('order_id', orderIds);
        const orderItemIds = (orderItemRows || []).map((oi: { id: number }) => oi.id);

        if (orderItemIds.length > 0) {
          await supabase
            .from('order_item_selections')
            .delete()
            .in('order_item_id', orderItemIds);
        }

        await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
      }

      // Delete reviews by this user
      await supabase.from('reviews').delete().eq('user_id', userId);

      // Delete orders by this user
      await supabase.from('orders').delete().eq('user_id', userId);

      // Get cart_item IDs for this user
      const { data: cartItemRows } = await supabase
        .from('cart_items')
        .select('id')
        .eq('user_id', userId);
      const cartItemIds = (cartItemRows || []).map((ci: { id: number }) => ci.id);

      if (cartItemIds.length > 0) {
        await supabase
          .from('cart_item_selections')
          .delete()
          .in('cart_item_id', cartItemIds);
      }

      // Delete cart items
      await supabase.from('cart_items').delete().eq('user_id', userId);
    }

    // Delete user addresses
    await supabase.from('user_addresses').delete().eq('user_id', userId);

    // Delete the user account
    await supabase.from('users').delete().eq('id', userId);

    // Session token is in per-tab sessionStorage — client clears it on logout/delete
    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
