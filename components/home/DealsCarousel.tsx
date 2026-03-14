'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import type { Deal } from '@/lib/types';

interface DisplayDeal extends Deal {
  isRandom?: boolean;
  extraDealsCount: number;
}

// Seeded RNG so same address always picks same restaurants
function seededRng(seed: string) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = (Math.imul(33, h) ^ seed.charCodeAt(i)) >>> 0;
  return () => {
    h ^= h << 13; h ^= h >> 17; h ^= h << 5;
    return (h >>> 0) / 0xffffffff;
  };
}

// Higher = better deal. BOGO = ~50% off for 2 items.
function effectiveDiscount(deal: Deal): number {
  if (deal.deal_type === 'bogo') return 50;
  return deal.discount_value ?? 0;
}

const RANDOM_DEAL_TYPES: Array<{ deal_type: 'percentage_off' | 'bogo'; discount_value: number | null }> = [
  { deal_type: 'percentage_off', discount_value: 20 },
  { deal_type: 'percentage_off', discount_value: 30 },
  { deal_type: 'percentage_off', discount_value: 50 },
  { deal_type: 'bogo', discount_value: null },
];

interface RestaurantStub {
  id: number;
  name: string;
  image_url: string;
  menu_item_name: string;
  menu_item_price: number;
  menu_item_id: number;
  isSeeded: boolean;
}

export default function DealsCarousel({ allRestaurants }: { allRestaurants: RestaurantStub[] }) {
  const { deliveryAddress } = useLocation();
  const [dbDeals, setDbDeals] = useState<Deal[]>([]);
  const [randomDeals, setRandomDeals] = useState<DisplayDeal[]>([]);
  const [page, setPage] = useState(0);
  const prevAddress = useRef('');

  const seededIds = new Set(allRestaurants.filter(r => r.isSeeded).map(r => r.id));

  useEffect(() => {
    fetch('/api/deals')
      .then(r => r.json())
      .then(d => setDbDeals(d.deals || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!deliveryAddress || deliveryAddress === prevAddress.current) return;
    prevAddress.current = deliveryAddress;
    setPage(0);

    const rng = seededRng(deliveryAddress);

    // Only real deals for default restaurants
    const seededDbDeals = dbDeals.filter(d => seededIds.has(d.restaurant_id));
    const restaurantsWithRealDeals = new Set(seededDbDeals.map(d => d.restaurant_id));

    // Random deals only for default restaurants that have no real deals
    const available = allRestaurants.filter(r => r.isSeeded && !restaurantsWithRealDeals.has(r.id));
    const shuffled = [...available].sort(() => rng() - 0.5);
    const picked = shuffled.slice(0, 3);

    const generated: DisplayDeal[] = picked.map((r, i) => {
      const template = RANDOM_DEAL_TYPES[Math.floor(rng() * RANDOM_DEAL_TYPES.length)];
      return {
        id: -(i + 1),
        restaurant_id: r.id,
        menu_item_id: r.menu_item_id,
        deal_type: template.deal_type,
        discount_value: template.discount_value,
        is_active: 1,
        created_at: new Date().toISOString(),
        isRandom: true,
        extraDealsCount: 0,
        restaurant_name: r.name,
        restaurant_image_url: r.image_url,
        menu_item_name: r.menu_item_name,
        menu_item_price: r.menu_item_price,
      };
    });

    setRandomDeals(generated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryAddress, dbDeals, allRestaurants]);

  // Group real deals by restaurant (default restaurants only), pick best per restaurant
  const seededDbDeals = dbDeals.filter(d => seededIds.has(d.restaurant_id));
  const byRestaurant = new Map<number, Deal[]>();
  for (const deal of seededDbDeals) {
    const arr = byRestaurant.get(deal.restaurant_id) ?? [];
    byRestaurant.set(deal.restaurant_id, [...arr, deal]);
  }

  const bestDbDeals: DisplayDeal[] = Array.from(byRestaurant.values()).map(deals => {
    const sorted = [...deals].sort((a, b) => effectiveDiscount(b) - effectiveDiscount(a));
    return { ...sorted[0], isRandom: false, extraDealsCount: sorted.length - 1 };
  });

  const allDeals: DisplayDeal[] = [...bestDbDeals, ...randomDeals];

  if (allDeals.length === 0) return null;

  const totalPages = Math.ceil(allDeals.length / 3);
  const visibleDeals = allDeals.slice(page * 3, page * 3 + 3);

  return (
    <section className="mb-10">
      <div className="grid grid-cols-3 gap-3">
        {visibleDeals.map((deal) => {
          const dealValue = deal.deal_type === 'bogo' ? 'BOGO' : `${deal.discount_value}%`;

          return (
            <Link
              key={deal.id}
              href={`/restaurants/${deal.restaurant_id}`}
              className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100"
            >
              {/* Image with deal badge */}
              <div className="relative w-full aspect-[3/1] overflow-hidden">
                {deal.restaurant_image_url ? (
                  <Image
                    src={deal.restaurant_image_url}
                    alt={deal.restaurant_name || ''}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-5xl">🍽️</div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-[#8f1a00] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                    <span className="bg-[#FF3008] inline-flex items-center gap-1 text-white font-extrabold text-xs px-2 py-0.5 rounded-full leading-none">
                      <span className="text-sm leading-none">🏷️</span>
                      {dealValue}
                    </span>
                    <span className="text-white font-semibold text-sm leading-none">
                      {deal.menu_item_name}
                    </span>
                  </span>
                  {deal.extraDealsCount > 0 && (
                    <span className="bg-[#FF3008] text-white font-bold text-xs px-2 py-1 rounded-full leading-none shadow-sm">
                      +{deal.extraDealsCount}
                    </span>
                  )}
                </div>
              </div>

              {/* Card footer */}
              <div className="bg-white px-3 py-1.5">
                <p className="font-bold text-gray-900 text-lg leading-tight group-hover:text-[#FF3008] transition-colors truncate">
                  {deal.restaurant_name}
                </p>
              </div>
            </Link>
          );
        })}
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
