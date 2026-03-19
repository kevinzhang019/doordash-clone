import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

type AddressRow = { id: number; address: string; lat: number; lng: number; created_at: string; delivery_instructions: string | null; handoff_option: string | null };

async function migrateGuestAddresses(supabase: ReturnType<typeof getSupabaseAdmin>, guestId: string, userId: number) {
  const { data: guestAddresses } = await supabase
    .from('guest_addresses')
    .select('*')
    .eq('guest_id', guestId)
    .eq('is_active', true);

  if (!guestAddresses || guestAddresses.length === 0) return;

  for (const ga of guestAddresses) {
    const { data: existing } = await supabase
      .from('user_addresses')
      .select('id, is_active')
      .eq('user_id', userId)
      .eq('address', ga.address)
      .maybeSingle();

    if (existing && !existing.is_active) {
      await supabase
        .from('user_addresses')
        .update({ is_active: true, lat: ga.lat, lng: ga.lng })
        .eq('id', existing.id);
    } else if (!existing) {
      await supabase
        .from('user_addresses')
        .insert({ user_id: userId, address: ga.address, lat: ga.lat, lng: ga.lng, is_active: true });
    }
  }

  await supabase
    .from('guest_addresses')
    .update({ is_active: false })
    .eq('guest_id', guestId);
}

export async function GET(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const guestId = request.headers.get('x-guest-id') ?? '';

  const supabase = getSupabaseAdmin();

  if (userId) {
    // Migrate any guest addresses before fetching
    if (guestId) await migrateGuestAddresses(supabase, guestId, userId);

    try {
      const { data: addresses, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return Response.json({ address: addresses?.[0] ?? null, addresses: addresses || [] });
    } catch (error) {
      console.error('Get addresses error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  if (guestId) {
    try {
      const { data: addresses, error } = await supabase
        .from('guest_addresses')
        .select('*')
        .eq('guest_id', guestId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return Response.json({ address: addresses?.[0] ?? null, addresses: addresses || [] });
    } catch (error) {
      console.error('Get guest addresses error:', error);
      return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const guestId = request.headers.get('x-guest-id') ?? '';

  try {
    const { address, lat, lng } = await request.json();
    if (!address || typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'address, lat, and lng are required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    if (userId) {
      // Migrate guest addresses first
      if (guestId) await migrateGuestAddresses(supabase, guestId, userId);

      const { data: existingRows } = await supabase
        .from('user_addresses')
        .select('id, is_active')
        .eq('user_id', userId)
        .eq('address', address)
        .limit(1);

      const existing = existingRows?.[0] ?? null;

      if (existing && !existing.is_active) {
        await supabase
          .from('user_addresses')
          .update({ is_active: true, lat, lng })
          .eq('id', existing.id);
      } else if (!existing) {
        await supabase
          .from('user_addresses')
          .insert({ user_id: userId, address, lat, lng, is_active: true });
      }
      return Response.json({ success: true });
    }

    if (guestId) {
      const { data: existingRows } = await supabase
        .from('guest_addresses')
        .select('id, is_active')
        .eq('guest_id', guestId)
        .eq('address', address)
        .limit(1);

      const existing = existingRows?.[0] ?? null;

      if (existing && !existing.is_active) {
        await supabase
          .from('guest_addresses')
          .update({ is_active: true, lat, lng })
          .eq('id', existing.id);
      } else if (!existing) {
        await supabase
          .from('guest_addresses')
          .insert({ guest_id: guestId, address, lat, lng, is_active: true });
      }
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    console.error('Save address error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
