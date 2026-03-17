import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: idStr } = await params;
  const orderId = parseInt(idStr);
  if (isNaN(orderId)) return Response.json({ error: 'Invalid order ID' }, { status: 400 });

  const supabase = getSupabaseAdmin();

  // Verify order belongs to user
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, restaurant_id')
    .eq('id', orderId)
    .eq('user_id', userId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return Response.json({ error: 'Order not found' }, { status: 404 });

  // Fetch order items with special requests
  const { data: orderItems, error: itemsError } = await supabase
    .from('order_items')
    .select('id, menu_item_id, name, quantity, special_requests')
    .eq('order_id', orderId);

  if (itemsError) throw itemsError;
  if (!orderItems || orderItems.length === 0) return Response.json({ error: 'No items in order' }, { status: 400 });

  // Fetch selections for all order items
  const orderItemIds = orderItems.map(i => i.id);
  let allSelections: { order_item_id: number; option_id: number | null; name: string; price_modifier: number; quantity: number }[] = [];

  if (orderItemIds.length > 0) {
    const { data: selections, error: selError } = await supabase
      .from('order_item_selections')
      .select('order_item_id, option_id, name, price_modifier, quantity')
      .in('order_item_id', orderItemIds);

    if (!selError && selections) {
      allSelections = selections;
    }
  }

  // Group selections by order_item_id
  const selectionsByItemId = new Map<number, typeof allSelections>();
  for (const sel of allSelections) {
    if (!selectionsByItemId.has(sel.order_item_id)) selectionsByItemId.set(sel.order_item_id, []);
    selectionsByItemId.get(sel.order_item_id)!.push(sel);
  }

  // Check availability for each item
  type AvailableItem = { menu_item_id: number; quantity: number; special_requests: string | null; selections: typeof allSelections };
  const available: AvailableItem[] = [];
  const skipped: string[] = [];

  for (const item of orderItems) {
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('id')
      .eq('id', item.menu_item_id)
      .eq('is_available', true)
      .maybeSingle();

    if (menuItem) {
      available.push({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_requests: item.special_requests,
        selections: selectionsByItemId.get(item.id) ?? [],
      });
    } else {
      skipped.push(item.name);
    }
  }

  // Clear cart
  await supabase.from('cart_items').delete().eq('user_id', userId);

  // Re-add available items
  for (const item of available) {
    const { data: cartItem, error: insertError } = await supabase
      .from('cart_items')
      .insert({
        user_id: userId,
        restaurant_id: order.restaurant_id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        special_requests: item.special_requests ?? null,
      })
      .select('id')
      .single();

    if (insertError) throw insertError;

    if (cartItem && item.selections.length > 0) {
      const selectionRows = item.selections.map(sel => ({
        cart_item_id: cartItem.id,
        option_id: sel.option_id,
        name: sel.name,
        price_modifier: sel.price_modifier,
        quantity: sel.quantity,
      }));
      await supabase.from('cart_item_selections').insert(selectionRows);
    }
  }

  return Response.json({ added: available.length, skipped });
}
