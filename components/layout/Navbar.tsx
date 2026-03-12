'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, openSidebar } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#FF3008] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-[#FF3008] font-bold text-xl hidden sm:block">DoorDash</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/orders" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden sm:block">
                  My Orders
                </Link>
                <span className="text-gray-700 text-sm hidden sm:block">
                  Hi, <span className="font-semibold">{user.name.split(' ')[0]}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={openSidebar}
                  className="relative bg-[#FF3008] text-white rounded-full px-4 py-2 flex items-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm font-semibold">Cart</span>
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-white text-[#FF3008] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-[#FF3008]">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#FF3008] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-red-600 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
