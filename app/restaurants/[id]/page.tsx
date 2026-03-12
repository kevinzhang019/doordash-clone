import { notFound } from 'next/navigation';
import Image from 'next/image';
import getDb from '@/db/database';
import { Restaurant, MenuItem } from '@/lib/types';
import MenuItemCard from '@/components/restaurant/MenuItemCard';

export const dynamic = 'force-dynamic';

interface RestaurantPageProps {
  params: Promise<{ id: string }>;
}

async function getRestaurantWithMenu(id: number): Promise<{ restaurant: Restaurant; menu: Record<string, MenuItem[]> } | null> {
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

  return { restaurant, menu };
}

export default async function RestaurantPage({ params }: RestaurantPageProps) {
  const { id } = await params;
  const restaurantId = parseInt(id);
  if (isNaN(restaurantId)) notFound();

  const data = await getRestaurantWithMenu(restaurantId);
  if (!data) notFound();

  const { restaurant, menu } = data;
  const categories = Object.keys(menu);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Restaurant Header */}
      <div className="relative w-full h-56 sm:h-72 rounded-2xl overflow-hidden mb-6">
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
          <p className="text-gray-200 mt-1">{restaurant.cuisine} • {restaurant.address}</p>
        </div>
      </div>

      {/* Info Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-8 flex flex-wrap gap-6">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">★</span>
          <div>
            <p className="font-bold text-gray-900">{restaurant.rating.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Rating</p>
          </div>
        </div>
        <div className="w-px bg-gray-200" />
        <div>
          <p className="font-bold text-gray-900">{restaurant.delivery_min}–{restaurant.delivery_max} min</p>
          <p className="text-xs text-gray-500">Delivery time</p>
        </div>
        <div className="w-px bg-gray-200" />
        <div>
          <p className="font-bold text-gray-900">
            {restaurant.delivery_fee === 0 ? 'Free' : `$${restaurant.delivery_fee.toFixed(2)}`}
          </p>
          <p className="text-xs text-gray-500">Delivery fee</p>
        </div>
        <div className="w-px bg-gray-200 hidden sm:block" />
        <div className="hidden sm:block">
          <p className="font-bold text-gray-900 max-w-xs text-sm leading-snug">{restaurant.description}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="space-y-10">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              {category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {menu[category].map((item) => (
                <MenuItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
