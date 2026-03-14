'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import { getAddressDeal, seededRng, dealLabel, AddressDeal } from '@/lib/dealUtils';

interface RestaurantStub {
  id: number;
  name: string;
  image_url: string;
  menu_item_name: string;
  menu_item_price: number;
  menu_item_id: number;
  isSeeded: boolean;
}

interface DisplayDeal {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_image_url: string;
  menu_item_name: string;
  deal: AddressDeal;
}

export default function DealsCarousel({ allRestaurants }: { allRestaurants: RestaurantStub[] }) {
  const { deliveryAddress } = useLocation();
  const [page, setPage] = useState(0);

  useEffect(() => { setPage(0); }, [deliveryAddress]);

  if (!deliveryAddress) return null;

  // Generate a deal for every default restaurant, filter out nulls, shuffle the list
  const rng = seededRng(deliveryAddress);

  const deals: DisplayDeal[] = allRestaurants
    .filter(r => r.isSeeded)
    .flatMap(r => {
      const deal = getAddressDeal(deliveryAddress, r.id);
      if (!deal) return [];
      return [{
        restaurant_id: r.id,
        restaurant_name: r.name,
        restaurant_image_url: r.image_url,
        menu_item_name: r.menu_item_name,
        deal,
      }];
    })
    .sort(() => rng() - 0.5);

  if (deals.length === 0) return null;

  const totalPages = Math.ceil(deals.length / 3);
  const visibleDeals = deals.slice(page * 3, page * 3 + 3);

  return (
    <section className="mb-10">
      <div className="grid grid-cols-3 gap-3">
        {visibleDeals.map((d) => (
          <Link
            key={d.restaurant_id}
            href={`/restaurants/${d.restaurant_id}`}
            className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
          >
            <div className="relative w-full aspect-[3/1] overflow-hidden">
              {d.restaurant_image_url ? (
                <Image
                  src={d.restaurant_image_url}
                  alt={d.restaurant_name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-5xl">🍽️</div>
              )}
              <div className="absolute top-3 left-3">
                <span className="bg-[#8f1a00] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                  <span className="bg-[#FF3008] inline-flex items-center gap-1 text-white font-extrabold text-xs px-2 py-0.5 rounded-full leading-none">
                    <span className="text-sm leading-none">🏷️</span>
                    {dealLabel(d.deal)}
                  </span>
                  <span className="text-white font-semibold text-sm leading-none">
                    {d.menu_item_name}
                  </span>
                </span>
              </div>
            </div>

            <div className="bg-white px-3 py-1.5">
              <p className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#FF3008] transition-colors truncate">
                {d.restaurant_name}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`rounded-full transition-all cursor-pointer ${
                  i === page ? 'w-4 h-2 bg-gray-400' : 'w-2 h-2 bg-gray-200 hover:bg-gray-300'
                }`}
              />
            ))}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="w-9 h-9 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </section>
  );
}
