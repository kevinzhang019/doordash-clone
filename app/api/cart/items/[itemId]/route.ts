import { NextRequest } from 'next/server';
import getDb from '@/db/database';

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

    const { quantity } = await request.json();
    if (!quantity || quantity < 1) {
      return Response.json({ error: 'Quantity must be at least 1' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(
      'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?'
    ).run(quantity, cartItemId, userId);

    if (result.changes === 0) {
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

    const db = getDb();
    const result = db.prepare(
      'DELETE FROM cart_items WHERE id = ? AND user_id = ?'
    ).run(cartItemId, userId);

    if (result.changes === 0) {
      return Response.json({ error: 'Cart item not found' }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete cart item error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
