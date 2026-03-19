'use client';

import { useLocation } from '@/components/providers/LocationProvider';
import { Restaurant } from '@/lib/types';
import { useDashPass } from '@/lib/useDashPass';
import Image from 'next/image';
import Link from 'next/link';

interface RestaurantCardProps {
  restaurant: Restaurant & { review_count: number };
  isOpen: boolean;
}

export default function RestaurantCard({ restaurant, isOpen }: RestaurantCardProps) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const { hasDashPass } = useDashPass();
  const info = getRestaurantDeliveryInfo(restaurant.id, restaurant.lat, restaurant.lng);

  const distance = info?.distance ?? null;
  const deliveryFee = info?.deliveryFee ?? restaurant.delivery_fee;
  const deliveryMin = info?.min ?? restaurant.delivery_min;
  const deliveryMax = info?.max ?? restaurant.delivery_max;

  return (
    <Link href={`/restaurants/${restaurant.id}`} className="group block cursor-pointer">
      <div className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 contain-card ${!isOpen ? 'opacity-60' : ''}`}>
        <div className="relative w-full h-48 overflow-hidden">
          <Image
            src={restaurant.image_url}
            alt={restaurant.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className={`object-cover transition-transform duration-300 will-change-transform ${isOpen ? 'group-hover:scale-105' : ''}`}
          />
          {!isOpen && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <span className="bg-white/90 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full">
                Closed
              </span>
            </div>
          )}
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
            {hasDashPass ? (
              <>
                <span className="font-semibold text-[#FF3008]">Free with PassDash</span>
                {deliveryFee > 0 && (
                  <span className="ml-1 line-through text-gray-400 text-xs">${deliveryFee.toFixed(2)}</span>
                )}
              </>
            ) : (
              <>
                <span className="font-semibold text-gray-900">
                  {deliveryFee === 0
                    ? <span className="text-green-600">Free</span>
                    : `$${deliveryFee.toFixed(2)}`
                  }
                </span>
                {' '}Delivery Fee
                {deliveryFee > 0 && (
                  <span className="ml-1.5 text-xs text-[#FF3008]">Free with PassDash</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
