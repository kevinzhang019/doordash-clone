import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { isCurrentlyOpen, HoursRow } from '@/lib/hours';

interface SelectionDraft {
  option_id?: number | null;
  name: string;
  price_modifier?: number;
  quantity?: number;
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { menuItemId, quantity = 1, selections = [], specialRequests = '' } = await request.json();

    if (!menuItemId) {
      return Response.json({ error: 'menuItemId is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Get menu item with restaurant info
    const { data: menuItem } = await supabase
      .from('menu_items')
      .select('id, restaurant_id, restaurants(name, is_accepting_orders)')
      .eq('id', menuItemId)
      .eq('is_available', true)
      .single();

    if (!menuItem) {
      return Response.json({ error: 'Menu item not found' }, { status: 404 });
    }

    const restaurant = menuItem.restaurants as unknown as { name: string; is_accepting_orders: boolean };

    const { data: ownerRow } = await supabase
      .from('restaurant_owners')
      .select('restaurant_id')
      .eq('restaurant_id', menuItem.restaurant_id)
      .maybeSingle();

    const isOwned = !!ownerRow;

    let restaurantHours: HoursRow[] = [];
    if (isOwned) {
      const { data: hoursData } = await supabase
        .from('restaurant_hours')
        .select('day_of_week, open_time, close_time, is_closed')
        .eq('restaurant_id', menuItem.restaurant_id)
        .order('day_of_week');
      restaurantHours = (hoursData ?? []) as HoursRow[];
    }

    if (!restaurant.is_accepting_orders || (isOwned && !isCurrentlyOpen(restaurantHours))) {
      return Response.json({ error: 'This restaurant is not accepting orders right now' }, { status: 503 });
    }

    // Check for cart conflicts (different restaurant)
    const { data: existingCartItem } = await supabase
      .from('cart_items')
      .select('restaurant_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (existingCartItem && existingCartItem.restaurant_id !== menuItem.restaurant_id) {
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('name')
        .eq('id', existingCartItem.restaurant_id)
        .single();

      return Response.json({
        error: 'Your cart contains items from another restaurant',
        conflictingRestaurant: existingRestaurant?.name,
      }, { status: 409 });
    }

    const selectionList: SelectionDraft[] = Array.isArray(selections) ? selections : [];
    const specialRequestsStr = typeof specialRequests === 'string' ? specialRequests.trim() : '';

    // Normalize selections for comparison
    const normalizeSelections = (sels: SelectionDraft[]) =>
      sels.map(s => ({ option_id: s.option_id ?? null, name: s.name?.trim() ?? '', price_modifier: s.price_modifier ?? 0, quantity: s.quantity ?? 1 }))
          .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));

    const newSels = normalizeSelections(selectionList);

    // Read-then-write: find existing cart row with same item + identical selections + identical special requests
    const { data: existingRows } = await supabase
      .from('cart_items')
      .select('id, special_requests')
      .eq('user_id', userId)
      .eq('menu_item_id', menuItemId);

    let matchedCartItemId: number | null = null;

    for (const row of (existingRows ?? [])) {
      const rowSpecialRequests = row.special_requests ?? '';
      if (rowSpecialRequests !== specialRequestsStr) continue;

      const { data: rowSels } = await supabase
        .from('cart_item_selections')
        .select('option_id, name, price_modifier, quantity')
        .eq('cart_item_id', row.id);

      const normalizedRowSels = (rowSels ?? [])
        .map(s => ({ option_id: s.option_id, name: s.name, price_modifier: s.price_modifier, quantity: s.quantity ?? 1 }))
        .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));

      if (JSON.stringify(normalizedRowSels) === JSON.stringify(newSels)) {
        matchedCartItemId = row.id;
        break;
      }
    }

    if (matchedCartItemId !== null) {
      // Increment quantity on existing row
      // Need to read current quantity first since Supabase doesn't support increment directly
      const { data: currentItem } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('id', matchedCartItemId)
        .single();

      await supabase
        .from('cart_items')
        .update({ quantity: (currentItem?.quantity ?? 0) + quantity })
        .eq('id', matchedCartItemId);
    } else {
      // Insert new row
      const { data: insertedItem } = await supabase
        .from('cart_items')
        .insert({
          user_id: userId,
          restaurant_id: menuItem.restaurant_id,
          menu_item_id: menuItemId,
          quantity,
          special_requests: specialRequestsStr || null,
        })
        .select()
        .single();

      if (insertedItem && newSels.length > 0) {
        const selectionRows = newSels.map(sel => ({
          cart_item_id: insertedItem.id,
          option_id: sel.option_id,
          name: sel.name,
          price_modifier: sel.price_modifier,
          quantity: sel.quantity,
        }));

        await supabase.from('cart_item_selections').insert(selectionRows);
      }
    }

    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Add to cart error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
