import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { CartItem } from '@/lib/types';

export async function DELETE(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    await supabase.from('cart_items').delete().eq('user_id', userId);
    return Response.json({ success: true });
  } catch (error) {
    console.error('Clear cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const supabase = getSupabaseAdmin();
    const { data: cartItems } = await supabase
      .from('cart_items')
      .select('id, user_id, restaurant_id, menu_item_id, quantity, special_requests, menu_items(name, description, price, image_url), restaurants(name)')
      .eq('user_id', userId)
      .order('id');

    if (!cartItems || cartItems.length === 0) {
      const { data: autoRemovals } = await supabase
        .from('cart_auto_removals')
        .select('item_name, restaurant_id')
        .eq('user_id', userId);
      if (autoRemovals && autoRemovals.length > 0) {
        await supabase.from('cart_auto_removals').delete().eq('user_id', userId);
      }
      return Response.json({ cartItems: [], autoRemovedItems: autoRemovals ?? [] });
    }

    // Flatten the joined data to match the original shape
    const flattenedItems: CartItem[] = cartItems.map((ci: Record<string, unknown>) => {
      const menuItem = ci.menu_items as Record<string, unknown> | null;
      const restaurant = ci.restaurants as Record<string, unknown> | null;
      return {
        id: ci.id,
        user_id: ci.user_id,
        restaurant_id: ci.restaurant_id,
        menu_item_id: ci.menu_item_id,
        quantity: ci.quantity,
        special_requests: ci.special_requests,
        name: menuItem?.name,
        description: menuItem?.description,
        price: menuItem?.price,
        image_url: menuItem?.image_url,
        restaurant_name: restaurant?.name,
      } as CartItem;
    });

    const ids = flattenedItems.map(ci => ci.id);
    const { data: allSelections } = await supabase
      .from('cart_item_selections')
      .select('id, cart_item_id, option_id, name, price_modifier, quantity, menu_item_options(menu_item_option_groups(name))')
      .in('cart_item_id', ids)
      .order('id');

    if (allSelections) {
      const selectionsWithGroupName = allSelections.map((s: Record<string, unknown>) => {
        const option = s.menu_item_options as Record<string, unknown> | null;
        const group = option?.menu_item_option_groups as Record<string, unknown> | null;
        return {
          id: s.id,
          cart_item_id: s.cart_item_id,
          option_id: s.option_id,
          name: s.name,
          price_modifier: s.price_modifier,
          quantity: s.quantity,
          group_name: group?.name ?? null,
        };
      });

      for (const item of flattenedItems) {
        (item as unknown as Record<string, unknown>).selections = selectionsWithGroupName.filter(s => s.cart_item_id === item.id);
        const sels = (item as unknown as Record<string, unknown>).selections as { price_modifier: number; quantity?: number }[];
        const selectionTotal = sels.reduce((sum: number, s) => sum + s.price_modifier * (s.quantity ?? 1), 0);
        item.effective_price = (item.price || 0) + selectionTotal;
      }
    }

    // Check for server-side removals (e.g. owner edited option groups)
    const { data: autoRemovals } = await supabase
      .from('cart_auto_removals')
      .select('item_name, restaurant_id')
      .eq('user_id', userId);

    if (autoRemovals && autoRemovals.length > 0) {
      await supabase.from('cart_auto_removals').delete().eq('user_id', userId);
    }

    return Response.json({
      cartItems: flattenedItems,
      autoRemovedItems: autoRemovals ?? [],
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
