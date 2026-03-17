import { NextRequest } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const { data: restaurants, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('rating', { ascending: false });

    if (error) throw error;

    return Response.json({ restaurants });
  } catch (error) {
    console.error('Get restaurants error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = parseInt(request.headers.get('x-user-id') ?? '');
  const userRole = request.headers.get('x-user-role');
  if (!userId || userRole !== 'restaurant') return Response.json({ error: 'Only restaurant accounts can create restaurants' }, { status: 403 });

  try {
    const { name, cuisine, address, image_url, lat, lng } = await request.json();

    if (!name?.trim() || !cuisine?.trim() || !address?.trim()) {
      return Response.json({ error: 'Name, cuisine, and address are required' }, { status: 400 });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return Response.json({ error: 'Please select the address from the dropdown suggestions' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        name: name.trim(),
        cuisine: cuisine.trim(),
        description: '',
        image_url: image_url?.trim() || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
        rating: 5.0,
        delivery_fee: 0,
        delivery_min: 20,
        delivery_max: 40,
        address: address.trim(),
        lat,
        lng,
      })
      .select('id')
      .single();

    if (error) throw error;

    return Response.json({ restaurantId: data.id }, { status: 201 });
  } catch (error) {
    console.error('Create restaurant error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
