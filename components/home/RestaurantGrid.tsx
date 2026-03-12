'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Restaurant } from '@/lib/types';
import RestaurantCard from './RestaurantCard';
import { useLocation } from '@/components/providers/LocationProvider';

interface RestaurantGridProps {
  restaurants: (Restaurant & { review_count: number })[];
}

type SortOption = 'relevance' | 'rating' | 'distance';

const CUISINES = ['All', 'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese', 'French', 'Mediterranean', 'Korean', 'Thai', 'American'];

function relevanceScore(
  rating: number,
  reviewCount: number,
  distance: number | null
): number {
  const normDist = distance !== null ? 1 - Math.min(Math.max(distance - 1, 0) / 23, 1) : 0.5;
  const normRating = (rating - 1) / 4;
  const normReviews = Math.log(1 + reviewCount) / Math.log(101);
  return 0.4 * normDist + 0.4 * normRating + 0.2 * normReviews;
}

export default function RestaurantGrid({ restaurants }: RestaurantGridProps) {
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const { getRestaurantDeliveryInfo } = useLocation();

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
      if (sortBy === 'rating') {
        return Number(b.rating) - Number(a.rating);
      }
      if (sortBy === 'distance') {
        const da = getRestaurantDeliveryInfo(a.id)?.distance ?? Infinity;
        const db = getRestaurantDeliveryInfo(b.id)?.distance ?? Infinity;
        return da - db;
      }
      // relevance
      const da = getRestaurantDeliveryInfo(a.id)?.distance ?? null;
      const db = getRestaurantDeliveryInfo(b.id)?.distance ?? null;
      const scoreA = relevanceScore(Number(a.rating), a.review_count, da);
      const scoreB = relevanceScore(Number(b.rating), b.review_count, db);
      return scoreB - scoreA;
    });
  }, [restaurants, selectedCuisine, search, sortBy, getRestaurantDeliveryInfo]);

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search restaurants or cuisines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
          />
        </div>
      </div>

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
      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No restaurants found</p>
          <button onClick={() => { setSelectedCuisine('All'); setSearch(''); }} className="mt-2 text-[#FF3008] text-sm underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sorted.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
          <Link href="/restaurants/new" className="group block cursor-pointer">
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 hover:border-[#FF3008] transition-colors h-full min-h-[220px] flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 group-hover:text-[#FF3008] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 group-hover:text-[#FF3008] transition-colors">Add a Restaurant</p>
                <p className="text-gray-400 text-sm mt-0.5">List your restaurant here</p>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}
