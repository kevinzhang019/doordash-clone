'use client';

import { useEffect, useState } from 'react';
import RestaurantInfoForm from '@/components/restaurant-dashboard/RestaurantInfoForm';
import type { Restaurant } from '@/lib/types';

export default function SettingsPage() {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [noRestaurant, setNoRestaurant] = useState(false);

  useEffect(() => {
    fetch('/api/restaurant-dashboard')
      .then(r => {
        if (r.status === 404) { setNoRestaurant(true); setLoading(false); return null; }
        return r.json();
      })
      .then(d => {
        if (d) { setRestaurant(d.restaurant); setLoading(false); }
      });
  }, []);

  if (loading) {
    return <div className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100" />;
  }

  if (noRestaurant || !restaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No restaurant found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Restaurant Settings</h1>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <RestaurantInfoForm restaurant={restaurant} onSaved={setRestaurant} />
      </div>
    </div>
  );
}
