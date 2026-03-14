import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';
import RestaurantGrid from '@/components/home/RestaurantGrid';
import DealsCarousel from '@/components/home/DealsCarousel';
import ActiveOrderCarousel from '@/components/home/ActiveOrderCarousel';

export const dynamic = 'force-dynamic';

interface RestaurantWithReviews extends Restaurant {
  review_count: number;
}

async function getRestaurants(): Promise<RestaurantWithReviews[]> {
  const db = getDb();
  return db.prepare(`
    SELECT r.id, r.name, r.cuisine, r.description, r.image_url,
      COALESCE(ROUND(AVG(rv.rating), 1), r.rating) as rating,
      r.delivery_fee, r.delivery_min, r.delivery_max, r.address, r.lat, r.lng,
      r.is_accepting_orders, COUNT(rv.id) as review_count
    FROM restaurants r
    LEFT JOIN reviews rv ON rv.restaurant_id = r.id
    GROUP BY r.id
    ORDER BY rating DESC
  `).all() as RestaurantWithReviews[];
}

async function getFirstMenuItemPerRestaurant(): Promise<Record<number, { menu_item_id: number; menu_item_name: string; menu_item_price: number }>> {
  const db = getDb();
  const rows = db.prepare(`
    SELECT restaurant_id, id as menu_item_id, name as menu_item_name, price as menu_item_price
    FROM menu_items
    WHERE is_available = 1
    GROUP BY restaurant_id
    ORDER BY restaurant_id, id
  `).all() as { restaurant_id: number; menu_item_id: number; menu_item_name: string; menu_item_price: number }[];
  return Object.fromEntries(rows.map(r => [r.restaurant_id, r]));
}

export default async function HomePage() {
  const restaurants = await getRestaurants();
  const firstItems = await getFirstMenuItemPerRestaurant();

  const db = getDb();
  const ownedIds = new Set(
    (db.prepare('SELECT restaurant_id FROM restaurant_owners').all() as { restaurant_id: number }[])
      .map(r => r.restaurant_id)
  );

  const carouselRestaurants = restaurants.map(r => ({
    id: r.id,
    name: r.name,
    image_url: r.image_url,
    menu_item_id: firstItems[r.id]?.menu_item_id ?? 0,
    menu_item_name: firstItems[r.id]?.menu_item_name ?? '',
    menu_item_price: firstItems[r.id]?.menu_item_price ?? 0,
    isSeeded: !ownedIds.has(r.id),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ActiveOrderCarousel />
      <DealsCarousel allRestaurants={carouselRestaurants} />
      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
}
