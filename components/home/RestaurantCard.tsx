'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '@/lib/types';
import { useLocation } from '@/components/providers/LocationProvider';

interface RestaurantCardProps {
  restaurant: Restaurant & { review_count: number };
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const info = getRestaurantDeliveryInfo(restaurant.id, restaurant.lat, restaurant.lng);

  const distance = info?.distance ?? null;
  const deliveryFee = info?.deliveryFee ?? restaurant.delivery_fee;
  const deliveryMin = info?.min ?? restaurant.delivery_min;
  const deliveryMax = info?.max ?? restaurant.delivery_max;

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="group block cursor-pointer">
      <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={restaurant.image_url}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-lg leading-tight">{restaurant.name}</h3>
          <p className="text-gray-500 text-sm mt-0.5">{restaurant.cuisine}</p>
          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">{Number(restaurant.rating).toFixed(1)}</span>
              {restaurant.review_count > 0 && (
                <span className="text-gray-400">({restaurant.review_count})</span>
              )}
            </span>
            <span>•</span>
            {distance !== null && (
              <>
                <span>{distance < 0.1 ? '0.1 mi' : `${distance.toFixed(1)} mi`}</span>
                <span>•</span>
              </>
            )}
            <span>{deliveryMin}–{deliveryMax} min</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-900">
              {deliveryFee === 0
                ? <span className="text-green-600">Free</span>
                : `$${deliveryFee.toFixed(2)}`
              }
            </span>
            {' '}Delivery fee
          </p>
        </div>
      </div>
    </Link>
  );
}
