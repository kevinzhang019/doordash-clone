'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Restaurant, RestaurantHours } from '@/lib/types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function isCurrentlyOpen(hours: RestaurantHours[]): boolean {
  const now = new Date();
  const dow = now.getDay();
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM
  const today = hours.find(h => h.day_of_week === dow);
  if (!today || today.is_closed) return false;
  return timeStr >= today.open_time && timeStr <= today.close_time;
}

export default function RestaurantDashboardPage() {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [hours, setHours] = useState<RestaurantHours[]>([]);
  const [itemCount, setItemCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [noRestaurant, setNoRestaurant] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [rRes, hRes, mRes] = await Promise.all([
          fetch('/api/restaurant-dashboard'),
          fetch('/api/restaurant-dashboard/hours'),
          fetch('/api/restaurant-dashboard/menu'),
        ]);

        if (rRes.status === 404) {
          setNoRestaurant(true);
          setLoading(false);
          return;
        }

        const rData = await rRes.json();
        const hData = await hRes.json();
        const mData = await mRes.json();

        setRestaurant(rData.restaurant);
        setHours(hData.hours || []);
        const items = mData.items || [];
        setItemCount(items.length);
        const cats = new Set(items.map((i: { category: string }) => i.category));
        setCategoryCount(cats.size);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-gray-100" />
        ))}
      </div>
    );
  }

  if (noRestaurant) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg mb-4">You haven&apos;t set up a restaurant yet.</p>
        <Link
          href="/restaurant-setup"
          className="inline-block bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors"
        >
          Set up your restaurant
        </Link>
      </div>
    );
  }

  if (!restaurant) return null;

  const open = isCurrentlyOpen(hours);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Overview</h1>

      {/* Restaurant card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="relative h-48">
          <Image
            src={restaurant.image_url}
            alt={restaurant.name}
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <h2 className="text-white text-2xl font-bold">{restaurant.name}</h2>
            <p className="text-white/80 text-sm">{restaurant.cuisine}</p>
          </div>
          <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-semibold ${
            open ? 'bg-green-500 text-white' : 'bg-gray-800/80 text-white'
          }`}>
            {open ? 'Open Now' : 'Closed'}
          </div>
        </div>
        <div className="p-5">
          <p className="text-gray-600 text-sm">{restaurant.description}</p>
          <div className="flex gap-4 mt-4 text-sm text-gray-500">
            <span>⭐ {restaurant.rating.toFixed(1)}</span>
            <span>🚗 ${restaurant.delivery_fee.toFixed(2)} delivery</span>
            <span>⏱️ {restaurant.delivery_min}–{restaurant.delivery_max} min</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Menu Items', value: itemCount, icon: '🍽️', href: '/restaurant-dashboard/menu' },
          { label: 'Categories', value: categoryCount, icon: '📂', href: '/restaurant-dashboard/menu' },
          { label: 'Rating', value: `${restaurant.rating.toFixed(1)} ★`, icon: '⭐', href: null },
          { label: 'Status', value: open ? 'Open' : 'Closed', icon: open ? '🟢' : '🔴', href: '/restaurant-dashboard/hours' },
        ].map(({ label, value, icon, href }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-2xl mb-2">{icon}</div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            {href && (
              <Link href={href} className="text-xs text-[#FF3008] font-medium mt-2 block hover:underline">
                Manage →
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/restaurant-dashboard/menu', label: 'Manage Menu', desc: 'Add, edit, or remove items', icon: '🍽️' },
          { href: '/restaurant-dashboard/hours', label: 'Set Hours', desc: 'Update your open/close times', icon: '🕐' },
          { href: '/restaurant-dashboard/settings', label: 'Restaurant Info', desc: 'Edit name, cuisine, and more', icon: '⚙️' },
        ].map(({ href, label, desc, icon }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-[#FF3008]/30 transition-all group"
          >
            <div className="text-2xl mb-3">{icon}</div>
            <p className="font-semibold text-gray-900 group-hover:text-[#FF3008] transition-colors">{label}</p>
            <p className="text-sm text-gray-500 mt-1">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
