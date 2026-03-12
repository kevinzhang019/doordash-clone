'use client';

import { useState } from 'react';
import { Restaurant } from '@/lib/types';
import RestaurantCard from './RestaurantCard';

interface RestaurantGridProps {
  restaurants: Restaurant[];
}

const CUISINES = ['All', 'Italian', 'Japanese', 'Mexican', 'Indian', 'Chinese', 'French', 'Mediterranean', 'Korean', 'Thai', 'American'];

export default function RestaurantGrid({ restaurants }: RestaurantGridProps) {
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = restaurants.filter((r) => {
    const matchesCuisine = selectedCuisine === 'All' || r.cuisine === selectedCuisine;
    const matchesSearch = search === '' ||
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.cuisine.toLowerCase().includes(search.toLowerCase());
    return matchesCuisine && matchesSearch;
  });

  return (
    <div>
      {/* Search Bar */}
      <div className="mb-6">
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

      {/* Cuisine Filter Pills */}
      <div className="flex gap-2 flex-wrap mb-6">
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
        {filtered.length} restaurant{filtered.length !== 1 ? 's' : ''} near you
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No restaurants found</p>
          <button onClick={() => { setSelectedCuisine('All'); setSearch(''); }} className="mt-2 text-[#FF3008] text-sm underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
