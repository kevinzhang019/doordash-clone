import { notFound } from 'next/navigation';
import Image from 'next/image';
import getDb from '@/db/database';
import { Restaurant, MenuItem, Review } from '@/lib/types';
import RestaurantMenuWithDeals from '@/components/restaurant/RestaurantMenuWithDeals';
import RestaurantDistance from '@/components/restaurant/RestaurantDistance';
import RestaurantDeliveryStats from '@/components/restaurant/RestaurantDeliveryStats';
import VirtualRestaurantAddress from '@/components/restaurant/VirtualRestaurantAddress';
import VirtualRestaurantMap from '@/components/restaurant/VirtualRestaurantMap';
import ScrollToTop from '@/components/ui/ScrollToTop';

export const dynamic = 'force-dynamic';

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

async function getRestaurantData(id: number) {
  const db = getDb();
  const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id) as Restaurant | undefined;
  if (!restaurant) return null;

  const menuItems = db.prepare(
    'SELECT * FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category, name'
  ).all(id) as MenuItem[];

  const menu: Record<string, MenuItem[]> = {};
  for (const item of menuItems) {
    if (!menu[item.category]) menu[item.category] = [];
    menu[item.category].push(item);
  }

  const reviews = db.prepare(
    'SELECT * FROM reviews WHERE restaurant_id = ? ORDER BY created_at DESC LIMIT 20'
  ).all(id) as Review[];

  return { restaurant, menu, reviews };
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const restaurantId = parseInt(id);
  if (isNaN(restaurantId)) notFound();

  const data = await getRestaurantData(restaurantId);
  if (!data) notFound();

  const { restaurant, menu, reviews } = data;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : restaurant.rating;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <ScrollToTop />
      {/* Restaurant Header */}
      <div className="relative w-full h-40 sm:h-52 rounded-2xl overflow-hidden mb-6">
        <Image
          src={restaurant.image_url}
          alt={restaurant.name}
          fill
          className="object-cover"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 p-6 text-white">
          <h1 className="text-3xl font-bold">{restaurant.name}</h1>
          <p className="text-gray-200 mt-1">
            {restaurant.cuisine}
            <VirtualRestaurantAddress restaurantId={restaurant.id} storedAddress={restaurant.address} restaurantLat={restaurant.lat} restaurantLng={restaurant.lng} prefix=" • " />
          </p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-wrap gap-6">
        <a href="#reviews" className="flex items-center gap-2 group cursor-pointer">
          <span className="text-yellow-400 text-lg">★</span>
          <div>
            <p className="font-bold text-gray-900 group-hover:text-[#FF3008] transition-colors">
              {avgRating.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500 group-hover:text-[#FF3008] transition-colors flex items-center gap-0.5">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </p>
          </div>
        </a>
        <div className="w-px bg-gray-200" />
        <RestaurantDeliveryStats
          restaurantId={restaurant.id}
          fallbackFee={restaurant.delivery_fee}
          fallbackMin={restaurant.delivery_min}
          fallbackMax={restaurant.delivery_max}
        />
        <div className="w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div>
            <p className="font-bold text-gray-900 text-sm">
              <VirtualRestaurantAddress restaurantId={restaurant.id} storedAddress={restaurant.address} restaurantLat={restaurant.lat} restaurantLng={restaurant.lng} />
            </p>
            <RestaurantDistance restaurantId={restaurant.id} />
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mb-8">
        <VirtualRestaurantMap
          restaurantId={restaurant.id}
          name={restaurant.name}
          fallbackLat={restaurant.lat}
          fallbackLng={restaurant.lng}
        />
      </div>

      {/* Menu — deals injected client-side from delivery address */}
      <RestaurantMenuWithDeals menu={menu} restaurantId={restaurant.id} />

      {/* Reviews */}
      {reviews.length > 0 && (
        <section id="reviews" className="scroll-mt-20">
          <div className="flex items-end gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
              <p className="text-gray-500 mt-1">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-2 border border-gray-200">
              <span className="text-yellow-400 text-2xl">★</span>
              <div>
                <p className="text-2xl font-bold text-gray-900 leading-none">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">out of 5</p>
              </div>
            </div>
          </div>
          <div className="space-y-5">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-[#FF3008] flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-base">{review.reviewer_name[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 flex-shrink-0">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className={`text-xl ${review.rating >= s ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
                {review.owner_reply && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-[#FF3008] uppercase tracking-wide">Owner Reply</span>
                      {review.owner_reply_at && (
                        <span className="text-xs text-gray-400">
                          · {new Date(review.owner_reply_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{review.owner_reply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
