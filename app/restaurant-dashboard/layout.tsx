'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

const NAV_ITEMS = [
  { href: '/restaurant-dashboard', label: 'Overview', icon: '📊' },
  { href: '/restaurant-dashboard/menu', label: 'Menu', icon: '🍽️' },
  { href: '/restaurant-dashboard/analytics', label: 'Analytics', icon: '📈' },
  { href: '/restaurant-dashboard/hours', label: 'Hours', icon: '🕐' },
  { href: '/restaurant-dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export default function RestaurantDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF3008] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="font-semibold text-gray-900">Restaurant Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600 hidden sm:block">
                Hi, <span className="font-semibold">{user.name.split(' ')[0]}</span>
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Logout
            </button>
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
    </div>
  );
}
