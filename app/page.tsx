import { getSupabaseAdmin } from '@/lib/supabase';
import { Restaurant } from '@/lib/types';
import { isCurrentlyOpen, HoursRow } from '@/lib/hours';
import RestaurantGrid from '@/components/home/RestaurantGrid';
import DealsCarousel from '@/components/home/DealsCarousel';
import ActiveOrderCarousel from '@/components/home/ActiveOrderCarousel';
import RoleRedirect from '@/components/auth/RoleRedirect';

export const dynamic = 'force-dynamic';

interface RestaurantWithReviews extends Restaurant {
  review_count: number;
  is_open: boolean;
}

async function getRestaurants(): Promise<RestaurantWithReviews[]> {
  const supabase = getSupabaseAdmin();

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('*');

  const { data: reviews } = await supabase
    .from('reviews')
    .select('restaurant_id, rating');

  const { data: owners } = await supabase
    .from('restaurant_owners')
    .select('restaurant_id');

  const { data: allHours } = await supabase
    .from('restaurant_hours')
    .select('restaurant_id, day_of_week, open_time, close_time, is_closed');

  const ownedIds = new Set((owners ?? []).map(r => r.restaurant_id));

  const hoursByRestaurant = new Map<number, HoursRow[]>();
  for (const h of (allHours ?? [])) {
    if (!hoursByRestaurant.has(h.restaurant_id)) hoursByRestaurant.set(h.restaurant_id, []);
    hoursByRestaurant.get(h.restaurant_id)!.push(h);
  }

  // Calculate avg rating and review count per restaurant
  const reviewsByRestaurant = new Map<number, { total: number; count: number }>();
  for (const r of (reviews ?? [])) {
    const entry = reviewsByRestaurant.get(r.restaurant_id) ?? { total: 0, count: 0 };
    entry.total += r.rating;
    entry.count += 1;
    reviewsByRestaurant.set(r.restaurant_id, entry);
  }

  const rows = (restaurants ?? []).map(r => {
    const reviewData = reviewsByRestaurant.get(r.id);
    const avgRating = reviewData ? Math.round(reviewData.total / reviewData.count * 10) / 10 : r.rating;
    return {
      ...r,
      rating: avgRating,
      review_count: reviewData?.count ?? 0,
      is_open: Boolean(r.is_accepting_orders) && (!ownedIds.has(r.id) || isCurrentlyOpen(hoursByRestaurant.get(r.id) ?? [])),
    };
  });

  rows.sort((a, b) => b.rating - a.rating);
  return rows;
}

async function getMenuItemsPerRestaurant(): Promise<Record<number, { menu_item_id: number; menu_item_name: string; menu_item_price: number }[]>> {
  const supabase = getSupabaseAdmin();
  const { data: rows } = await supabase
    .from('menu_items')
    .select('restaurant_id, id, name, price')
    .eq('is_available', true)
    .order('restaurant_id')
    .order('category')
    .order('name');

  const result: Record<number, { menu_item_id: number; menu_item_name: string; menu_item_price: number }[]> = {};
  for (const row of (rows ?? [])) {
    if (!result[row.restaurant_id]) result[row.restaurant_id] = [];
    result[row.restaurant_id].push({
      menu_item_id: row.id,
      menu_item_name: row.name,
      menu_item_price: row.price,
    });
  }
  return result;
}

export default async function HomePage() {
  const restaurants = await getRestaurants();
  const menuItems = await getMenuItemsPerRestaurant();

  const supabase = getSupabaseAdmin();
  const { data: owners } = await supabase.from('restaurant_owners').select('restaurant_id');
  const ownedSet = new Set((owners ?? []).map(r => r.restaurant_id));

  const carouselRestaurants = restaurants.map(r => ({
    id: r.id,
    name: r.name,
    image_url: r.image_url,
    menu_items: menuItems[r.id] ?? [],
    isSeeded: !ownedSet.has(r.id),
  }));

  const { data: ownerDeals } = await supabase
    .from('deals')
    .select('restaurant_id, menu_item_id, deal_type, discount_value, restaurants(name, image_url), menu_items(name)')
    .eq('is_active', true);

  const formattedDeals = (ownerDeals ?? []).map((d: Record<string, unknown>) => ({
    restaurant_id: d.restaurant_id as number,
    menu_item_id: d.menu_item_id as number,
    deal_type: d.deal_type as 'percentage_off' | 'bogo',
    discount_value: d.discount_value as number | null,
    restaurant_name: (d.restaurants as Record<string, unknown>)?.name as string,
    restaurant_image_url: (d.restaurants as Record<string, unknown>)?.image_url as string,
    menu_item_name: (d.menu_items as Record<string, unknown>)?.name as string,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <RoleRedirect allowed="customer" />
      <DealsCarousel allRestaurants={carouselRestaurants} ownerDeals={formattedDeals} />
      <ActiveOrderCarousel />
      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
}
