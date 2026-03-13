import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';
import RestaurantGrid from '@/components/home/RestaurantGrid';

export const dynamic = 'force-dynamic';

async function getRestaurants(): Promise<(Restaurant & { review_count: number })[]> {
  const db = getDb();
  return db.prepare(`
    SELECT r.id, r.name, r.cuisine, r.description, r.image_url,
      COALESCE(ROUND(AVG(rv.rating), 1), r.rating) as rating,
      r.delivery_fee, r.delivery_min, r.delivery_max, r.address, r.lat, r.lng,
      COUNT(rv.id) as review_count
    FROM restaurants r
    LEFT JOIN reviews rv ON rv.restaurant_id = r.id
    GROUP BY r.id
    ORDER BY rating DESC
  `).all() as (Restaurant & { review_count: number })[];
}

export default async function HomePage() {
  const restaurants = await getRestaurants();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="bg-[#FF3008] rounded-2xl p-8 mb-10 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          Delivery, pick-up or DashPass
        </h1>
        <p className="text-red-100 text-lg">
          Order from your favorite local restaurants
        </p>
      </div>

      {/* Restaurant Grid with filtering */}
      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
}
