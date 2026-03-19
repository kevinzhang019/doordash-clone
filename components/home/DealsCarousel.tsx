'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocation } from '@/components/providers/LocationProvider';
import { useSearch } from '@/components/providers/SearchProvider';
import { useCuisine } from '@/components/providers/CuisineProvider';
import { getItemDeal, dealLabel, ItemDeal } from '@/lib/dealUtils';

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
  deal: ItemDeal;
  additionalDeals: number;
}

interface OwnerDealStub {
  restaurant_id: number;
  menu_item_id: number;
  deal_type: 'percentage_off' | 'bogo';
  discount_value: number | null;
  restaurant_name: string;
  restaurant_image_url: string;
  menu_item_name: string;
}

export default function DealsCarousel({ allRestaurants, ownerDeals }: { allRestaurants: RestaurantStub[]; ownerDeals: OwnerDealStub[] }) {
  const { deliveryAddress } = useLocation();
  const { search } = useSearch();
  const { selectedCuisine } = useCuisine();
  const [page, setPage] = useState(0);
  const [mounted, setMounted] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const totalPagesRef = useRef(0);

  const goTo = useCallback((delta: number, totalPgs: number) => {
    if (!trackRef.current) return;
    const track = trackRef.current;
    const pageWidth = track.clientWidth;
    const currentPage = Math.round(track.scrollLeft / pageWidth);
    const newPage = Math.max(0, Math.min(totalPgs - 1, currentPage + delta));
    setPage(newPage);
    track.scrollTo({ left: newPage * pageWidth, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    setPage(0);
    if (trackRef.current) trackRef.current.scrollLeft = 0;
  }, [deliveryAddress]);

  useEffect(() => {
    let id1: number, id2: number;
    id1 = requestAnimationFrame(() => { id2 = requestAnimationFrame(() => setMounted(true)); });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const { scrollLeft, clientWidth, scrollWidth } = track;
      if (clientWidth <= 0) return;
      const atEnd = scrollLeft + clientWidth >= scrollWidth - 1;
      setPage(atEnd ? totalPagesRef.current - 1 : Math.round(scrollLeft / clientWidth));
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [deliveryAddress]);

  if (!deliveryAddress) return null;

  // Owner-created deals (user-inputted restaurants) — group by restaurant, pick one randomly
  const ownerByRestaurant = new Map<number, OwnerDealStub[]>();
  for (const d of ownerDeals) {
    const arr = ownerByRestaurant.get(d.restaurant_id) ?? [];
    arr.push(d);
    ownerByRestaurant.set(d.restaurant_id, arr);
  }
  const ownerDisplayDeals: DisplayDeal[] = Array.from(ownerByRestaurant.entries()).map(([, items]) => {
    const pick = items[Math.floor(Math.random() * items.length)];
    return {
      restaurant_id: pick.restaurant_id,
      restaurant_name: pick.restaurant_name,
      restaurant_image_url: pick.restaurant_image_url,
      menu_item_name: pick.menu_item_name,
      deal: { deal_type: pick.deal_type, discount_value: pick.discount_value },
      additionalDeals: items.length - 1,
    };
  });

  // Auto-generated deals for seeded restaurants only — shown after owner deals
  const autoDisplayDeals: DisplayDeal[] = allRestaurants
    .filter(r => r.isSeeded)
    .flatMap(r => {
      const dealItems = r.menu_items.filter(item => getItemDeal(item.menu_item_id, deliveryAddress) !== null);
      if (dealItems.length === 0) return [];
      const pick = dealItems[Math.floor(Math.random() * dealItems.length)];
      const deal = getItemDeal(pick.menu_item_id, deliveryAddress)!;
      return [{
        restaurant_id: r.id,
        restaurant_name: r.name,
        restaurant_image_url: r.image_url,
        menu_item_name: pick.menu_item_name,
        deal,
        additionalDeals: dealItems.length - 1,
      }];
    });

  // Sort: owner deals first, then by number of deals descending
  ownerDisplayDeals.sort((a, b) => b.additionalDeals - a.additionalDeals);
  autoDisplayDeals.sort((a, b) => b.additionalDeals - a.additionalDeals);
  const deals = [...ownerDisplayDeals, ...autoDisplayDeals];

  if (deals.length === 0) return null;

  // Chunk deals into pages of 3
  const pages: DisplayDeal[][] = [];
  for (let i = 0; i < deals.length; i += 3) pages.push(deals.slice(i, i + 3));
  const totalPages = pages.length;
  totalPagesRef.current = totalPages;

  const isVisible = mounted && !search && selectedCuisine === 'All';

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateRows: isVisible ? '1fr' : '0fr',
        opacity: isVisible ? 1 : 0,
        transition: 'grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease',
        willChange: 'grid-template-rows, opacity',
      }}
    >
    <div style={{ overflow: 'hidden' }}>
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">Featured Deals</h2>
        {totalPages > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() => goTo(-1, totalPages)}
              disabled={page === 0}
              className="w-8 h-8 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-default"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => goTo(1, totalPages)}
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
        className="flex overflow-x-scroll carousel-track"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {pages.map((pageDeals, pageIdx) => (
          <div key={pageIdx} className="w-full flex-shrink-0 grid grid-cols-3 gap-3">
            {pageDeals.map((d) => (
              <Link
                key={d.restaurant_id}
                href={`/restaurants/${d.restaurant_id}`}
                className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-200 border border-gray-100"
              >
                <div className="relative w-full aspect-[3/1] overflow-hidden">
                  {d.restaurant_image_url ? (
                    <Image
                      src={d.restaurant_image_url}
                      alt={d.restaurant_name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300 will-change-transform"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-5xl">🍽️</div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1">
                      <span className="bg-[#8f1a00] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full">
                        <span className="bg-[#FF3008] inline-flex items-center gap-1 text-white font-extrabold text-xs px-2 py-0.5 rounded-full leading-none">
                          <span className="text-sm leading-none">🏷️</span>
                          {dealLabel(d.deal)}
                        </span>
                        <span className="text-white font-semibold text-sm leading-none">
                          {d.menu_item_name}
                        </span>
                      </span>
                      {d.additionalDeals > 0 && (
                        <span className="bg-[#FF3008] text-white font-bold text-xs w-7 h-7 rounded-full flex items-center justify-center shadow-sm">
                          +{d.additionalDeals}
                        </span>
                      )}
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
    </div>
    </div>
  );
}
