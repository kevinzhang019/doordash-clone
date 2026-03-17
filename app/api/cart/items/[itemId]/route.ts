import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface SelectionDraft {
  option_id?: number | null;
  name: string;
  price_modifier?: number;
  quantity?: number;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { itemId } = await params;
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      return Response.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const body = await request.json();
    const supabase = getSupabaseAdmin();

    // Selections update mode
    if (body.selections !== undefined) {
      const selectionList: SelectionDraft[] = Array.isArray(body.selections) ? body.selections : [];
      const specialRequestsStr = typeof body.specialRequests === 'string' ? body.specialRequests.trim() : '';

      const normalizeSelections = (sels: SelectionDraft[]) =>
        sels.map(s => ({ option_id: s.option_id ?? null, name: s.name?.trim() ?? '', price_modifier: s.price_modifier ?? 0, quantity: s.quantity ?? 1 }))
            .sort((a, b) => (a.option_id ?? 0) - (b.option_id ?? 0) || a.name.localeCompare(b.name));

      const newSels = normalizeSelections(selectionList);

      // Update special_requests
      const { data: updatedItem, error: updateError } = await supabase
        .from('cart_items')
        .update({ special_requests: specialRequestsStr || null })
        .eq('id', cartItemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError || !updatedItem) {
        return Response.json({ error: 'Cart item not found' }, { status: 404 });
      }

      // Delete old selections
      await supabase.from('cart_item_selections').delete().eq('cart_item_id', cartItemId);

      // Insert new selections
      if (newSels.length > 0) {
        const selectionRows = newSels.map(sel => ({
          cart_item_id: cartItemId,
          option_id: sel.option_id,
          name: sel.name,
          price_modifier: sel.price_modifier,
          quantity: sel.quantity,
        }));

        await supabase.from('cart_item_selections').insert(selectionRows);
      }

      return Response.json({ success: true });
    }

    // Quantity update mode
    const { quantity } = body;
    if (!quantity || quantity < 1) {
      return Response.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError || !updatedItem) {
      return Response.json({ error: 'Cart item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Update cart item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { itemId } = await params;
    const cartItemId = parseInt(itemId);
    if (isNaN(cartItemId)) {
      return Response.json({ error: 'Invalid item ID' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Check if the item exists and belongs to user before deleting
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id')
      .eq('id', cartItemId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingItem) {
      return Response.json({ error: 'Cart item not found' }, { status: 404 });
    }

    await supabase.from('cart_items').delete().eq('id', cartItemId).eq('user_id', userId);

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
