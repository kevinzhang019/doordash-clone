'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Restaurant } from '@/lib/types';
import RestaurantCard from './RestaurantCard';
import { useLocation } from '@/components/providers/LocationProvider';
import { useSearch } from '@/components/providers/SearchProvider';
import { useCuisine, SortOption } from '@/components/providers/CuisineProvider';

interface RestaurantGridProps {
  restaurants: (Restaurant & { review_count: number })[];
}

const CUISINES = ['All', 'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese', 'French', 'Mediterranean', 'Korean', 'Thai', 'American'];

function relevanceScore(rating: number, reviewCount: number, distance: number | null): number {
  const normDist = distance !== null ? 1 - Math.min(Math.max(distance - 1, 0) / 9, 1) : 0.5;
  const normRating = (rating - 1) / 4;
  const normReviews = Math.log(1 + reviewCount) / Math.log(101);
  return 0.4 * normDist + 0.4 * normRating + 0.2 * normReviews;
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 space-y-2.5">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}

export default function RestaurantGrid({ restaurants }: RestaurantGridProps) {
  const { selectedCuisine, setSelectedCuisine, sortBy, setSortBy } = useCuisine();
  const [isLoading, setIsLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const { getRestaurantDeliveryInfo, deliveryCoords } = useLocation();
  const { search, setSearch } = useSearch();
  const prevCoordsRef = useRef<{ lat: number; lng: number } | null>(null);

  // Trigger loading animation whenever delivery coords change
  useEffect(() => {
    const prev = prevCoordsRef.current;
    prevCoordsRef.current = deliveryCoords;
    // Skip on first mount (no previous coords)
    if (!prev || !deliveryCoords) {
      setVisible(true);
      return;
    }
    if (prev.lat === deliveryCoords.lat && prev.lng === deliveryCoords.lng) return;
    setIsLoading(true);
    setVisible(false);
    const showTimer = setTimeout(() => {
      setIsLoading(false);
      // Slight delay before fading cards in
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }, 550);
    return () => clearTimeout(showTimer);
  }, [deliveryCoords]);

  const sorted = useMemo(() => {
    const filtered = restaurants.filter((r) => {
      const matchesCuisine = selectedCuisine === 'All' || r.cuisine === selectedCuisine;
      const matchesSearch =
        search === '' ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase());
      return matchesCuisine && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'rating') return Number(b.rating) - Number(a.rating);
      if (sortBy === 'distance') {
        const da = getRestaurantDeliveryInfo(a.id, a.lat, a.lng)?.distance ?? Infinity;
        const db = getRestaurantDeliveryInfo(b.id, b.lat, b.lng)?.distance ?? Infinity;
        return da - db;
      }
      const da = getRestaurantDeliveryInfo(a.id, a.lat, a.lng)?.distance ?? null;
      const db = getRestaurantDeliveryInfo(b.id, b.lat, b.lng)?.distance ?? null;
      return relevanceScore(Number(b.rating), b.review_count, db) -
             relevanceScore(Number(a.rating), a.review_count, da);
    });
  }, [restaurants, selectedCuisine, search, sortBy, getRestaurantDeliveryInfo]);

  return (
    <div>
      {/* Sort + Cuisine Filter Row */}
      <div className="flex gap-2 flex-wrap items-center mb-6">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="py-1.5 pl-3 pr-8 border border-gray-200 rounded-full bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm text-gray-700 cursor-pointer appearance-none font-medium"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundSize: '16px' }}
        >
          <option value="relevance">Relevance</option>
          <option value="rating">Top Rated</option>
          <option value="distance">Nearest</option>
        </select>
        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
        {CUISINES.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => setSelectedCuisine(cuisine)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selectedCuisine === cuisine
                ? 'bg-[#FF3008] text-white border-[#FF3008]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-[#FF3008] hover:text-[#FF3008]'
            }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <p className="text-gray-500 text-sm mb-4">
        {sorted.length} restaurant{sorted.length !== 1 ? 's' : ''} near you
      </p>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No restaurants found</p>
          <button onClick={() => { setSelectedCuisine('All'); setSearch(''); }} className="mt-2 text-[#FF3008] text-sm underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-400"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {sorted.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
