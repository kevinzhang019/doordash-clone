'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import { getAddressDeal, seededRng, dealLabel, AddressDeal } from '@/lib/dealUtils';

interface MenuItemStub {
  menu_item_id: number;
  menu_item_name: string;
  menu_item_price: number;
}

interface RestaurantStub {
  id: number;
  name: string;
  image_url: string;
  menu_items: MenuItemStub[];
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
  const trackRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((newPage: number) => {
    setPage(newPage);
    if (trackRef.current) {
      trackRef.current.scrollTo({ left: newPage * trackRef.current.clientWidth, behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    setPage(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [deliveryAddress]);

  if (!deliveryAddress) return null;

  // Generate a deal for every default restaurant, filter out nulls, shuffle the list
  const rng = seededRng(deliveryAddress);

  const deals: DisplayDeal[] = allRestaurants
    .filter(r => r.isSeeded)
    .flatMap(r => {
      const deal = getAddressDeal(deliveryAddress, r.id);
      if (!deal || r.menu_items.length === 0) return [];
      // Use same seeded selection as RestaurantMenuWithDeals
      const featuredRng = seededRng(`${deliveryAddress}|${r.id}|featured`);
      const featured = r.menu_items[Math.floor(featuredRng() * r.menu_items.length)];
      return [{
        restaurant_id: r.id,
        restaurant_name: r.name,
        restaurant_image_url: r.image_url,
        menu_item_name: featured.menu_item_name,
        deal,
      }];
    })
    .sort(() => rng() - 0.5);

  if (deals.length === 0) return null;

  // Chunk deals into pages of 3
  const pages: DisplayDeal[][] = [];
  for (let i = 0; i < deals.length; i += 3) pages.push(deals.slice(i, i + 3));
  const totalPages = pages.length;

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Featured Deals</h2>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => goTo(Math.max(0, page - 1))}
              disabled={page === 0}
              className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goTo(Math.min(totalPages - 1, page + 1))}
              disabled={page === totalPages - 1}
              className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={trackRef}
        className="flex overflow-x-scroll"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {pages.map((pageDeals, pageIdx) => (
          <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-3 gap-3">
            {pageDeals.map((d) => (
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
                <div className="bg-white px-3 py-1.5 border-t-2 border-[#FF3008]">
                  <p className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#FF3008] transition-colors truncate">
                    {d.restaurant_name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
