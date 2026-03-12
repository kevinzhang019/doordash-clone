'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Restaurant } from '@/lib/types';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant.id}`} className="group block">
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
              <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
            </span>
            <span>•</span>
            <span>{restaurant.delivery_min}–{restaurant.delivery_max} min</span>
            <span>•</span>
            <span>
              {restaurant.delivery_fee === 0
                ? <span className="text-green-600 font-medium">Free delivery</span>
                : `$${restaurant.delivery_fee.toFixed(2)} delivery`
              }
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
