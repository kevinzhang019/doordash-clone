'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRequireAuth } from '@/lib/useRequireAuth';
import NewOrderNotification from '@/components/restaurant-dashboard/NewOrderNotification';

const NAV_ITEMS = [
  { href: '/restaurant-dashboard', label: 'Overview', icon: '📊' },
  { href: '/restaurant-dashboard/orders', label: 'Orders', icon: '🛒' },
  { href: '/restaurant-dashboard/menu', label: 'Menu', icon: '🍽️' },
  { href: '/restaurant-dashboard/deals', label: 'Deals', icon: '🏷️' },
  { href: '/restaurant-dashboard/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/restaurant-dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/restaurant-dashboard/hours', label: 'Hours', icon: '🕐' },
  { href: '/restaurant-dashboard/payment', label: 'Payment', icon: '💳' },
  { href: '/restaurant-dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function RestaurantDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { loading: authLoading } = useRequireAuth('restaurant');
  const pathname = usePathname();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [hasRestaurant, setHasRestaurant] = useState<boolean | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (authLoading) return;
    fetch('/api/restaurant-dashboard')
      .then(async res => {
        if (res.status === 404) {
          router.replace('/restaurant-setup');
          return;
        }
        const data = await res.json();
        if (!data.restaurant?.stripe_onboarding_complete) {
          router.replace('/restaurant-setup/payment');
          return;
        }
        setHasRestaurant(true);
      })
      .catch(() => setHasRestaurant(true));
  }, [router, authLoading]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setProfileOpen(false);
    await logout();
    router.push('/');
    router.refresh();
  };

  if (!hasRestaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/restaurant-dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#FF3008] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-semibold text-gray-900">Restaurant Dashboard</span>
            </Link>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-red-50 text-[#FF3008] border border-red-100">
              Restaurant
            </span>
          </div>

          {/* Profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-[#FF3008] flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user?.name ?? ''} width={24} height={24} className="object-cover w-full h-full" unoptimized />
                ) : (
                  <span className="text-white text-xs font-bold">{user?.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name.split(' ')[0]}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
                  <p className="text-gray-400 text-xs mt-0.5 truncate">{user?.email}</p>
                </div>
                <Link
                  href="/restaurant-dashboard/account"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Account Settings
                </Link>
                <div className="border-t border-gray-100 my-1" />
                <p className="px-4 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">Switch account</p>
                <button
                  onClick={() => { setProfileOpen(false); window.open('/login?role=customer', '_blank'); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Customer
                </button>
                <button
                  onClick={() => { setProfileOpen(false); window.open('/login?role=driver', '_blank'); }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                  </svg>
                  Driver
                </button>
                <div className="border-t border-gray-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 border-r border-gray-200 bg-white py-6 px-3 hidden md:block">
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = href === '/restaurant-dashboard' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-[#FF3008] text-white' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
          <div className="flex">
            {NAV_ITEMS.map(({ href, label, icon }) => {
              const active = href === '/restaurant-dashboard' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center py-2 text-xs font-medium ${
                    active ? 'text-[#FF3008]' : 'text-gray-500'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 px-4 sm:px-8 py-8 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      <NewOrderNotification />
    </div>
  );
}
