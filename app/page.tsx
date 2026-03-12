import getDb from '@/db/database';
import { Restaurant } from '@/lib/types';
import RestaurantGrid from '@/components/home/RestaurantGrid';

export const dynamic = 'force-dynamic';

async function getRestaurants(): Promise<Restaurant[]> {
  const db = getDb();
  return db.prepare('SELECT * FROM restaurants ORDER BY rating DESC').all() as Restaurant[];
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
        <p className="text-red-100 text-lg mb-6">
          Order from your favorite local restaurants
        </p>
        <div className="bg-white rounded-xl p-1 flex max-w-lg">
          <div className="flex items-center gap-2 px-3 flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-gray-500 text-sm">Enter delivery address</span>
          </div>
          <button className="bg-[#FF3008] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors">
            Find Food
          </button>
        </div>
      </div>

      {/* Restaurant Grid with filtering */}
      <RestaurantGrid restaurants={restaurants} />
    </div>
  );
}
