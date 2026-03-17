import getDb from '@/db/database';
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
  const db = getDb();
  const rows = db.prepare(`
    SELECT r.id, r.name, r.cuisine, r.description, r.image_url,
      COALESCE(ROUND(AVG(rv.rating), 1), r.rating) as rating,
      r.delivery_fee, r.delivery_min, r.delivery_max, r.address, r.lat, r.lng,
      r.is_accepting_orders, COUNT(rv.id) as review_count
    FROM restaurants r
    LEFT JOIN reviews rv ON rv.restaurant_id = r.id
    GROUP BY r.id
    ORDER BY rating DESC
  `).all() as (Restaurant & { review_count: number })[];

  const ownedIds = new Set(
    (db.prepare('SELECT restaurant_id FROM restaurant_owners').all() as { restaurant_id: number }[])
      .map(r => r.restaurant_id)
  );

  const allHours = db.prepare('SELECT restaurant_id, day_of_week, open_time, close_time, is_closed FROM restaurant_hours').all() as (HoursRow & { restaurant_id: number })[];
  const hoursByRestaurant = new Map<number, HoursRow[]>();
  for (const h of allHours) {
    if (!hoursByRestaurant.has(h.restaurant_id)) hoursByRestaurant.set(h.restaurant_id, []);
    hoursByRestaurant.get(h.restaurant_id)!.push(h);
  }

  return rows.map(r => ({
    ...r,
    is_open: Boolean(r.is_accepting_orders) && (!ownedIds.has(r.id) || isCurrentlyOpen(hoursByRestaurant.get(r.id) ?? [])),
  }));
}

async function getMenuItemsPerRestaurant(): Promise<Record<number, { menu_item_id: number; menu_item_name: string; menu_item_price: number }[]>> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT restaurant_id, id as menu_item_id, name as menu_item_name, price as menu_item_price
    FROM menu_items
    WHERE is_available = 1
    ORDER BY restaurant_id, category, name
  `).all() as { restaurant_id: number; menu_item_id: number; menu_item_name: string; menu_item_price: number }[];
  const result: Record<number, { menu_item_id: number; menu_item_name: string; menu_item_price: number }[]> = {};
  for (const row of rows) {
    if (!result[row.restaurant_id]) result[row.restaurant_id] = [];
    result[row.restaurant_id].push(row);
  }
  return result;
}

export default async function HomePage() {
  const restaurants = await getRestaurants();
  const menuItems = await getMenuItemsPerRestaurant();

  const db = getDb();
  const ownedSet = new Set(
    (db.prepare('SELECT restaurant_id FROM restaurant_owners').all() as { restaurant_id: number }[])
      .map(r => r.restaurant_id)
  );

  const carouselRestaurants = restaurants.map(r => ({
    id: r.id,
    name: r.name,
    image_url: r.image_url,
    menu_items: menuItems[r.id] ?? [],
    isSeeded: !ownedSet.has(r.id),
  }));

  // Owner-created deals for user-inputted restaurants (show first in carousel)
  const ownerDeals = db.prepare(`
    SELECT d.restaurant_id, d.menu_item_id, d.deal_type, d.discount_value,
           r.name as restaurant_name, r.image_url as restaurant_image_url,
           mi.name as menu_item_name
    FROM deals d
    JOIN restaurants r ON d.restaurant_id = r.id
    JOIN menu_items mi ON d.menu_item_id = mi.id
    WHERE d.is_active = 1
  `).all() as {
    restaurant_id: number;
    menu_item_id: number;
    deal_type: 'percentage_off' | 'bogo';
    discount_value: number | null;
    restaurant_name: string;
    restaurant_image_url: string;
    menu_item_name: string;
  }[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <RoleRedirect allowed="customer" />
      <DealsCarousel allRestaurants={carouselRestaurants} ownerDeals={ownerDeals} />
      <ActiveOrderCarousel />
      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
}
