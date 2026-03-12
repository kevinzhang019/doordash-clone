'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';

function CartPopup() {
  const { lastAddedItem, cartTotal, cartCount, clearLastAdded, openSidebar } = useCart();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!lastAddedItem) {
      setAnimateIn(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }

    // Clear any existing auto-dismiss timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));

    timerRef.current = setTimeout(() => {
      setAnimateIn(false);
      setTimeout(() => { setVisible(false); clearLastAdded(); }, 250);
    }, 3500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [lastAddedItem, clearLastAdded]);

  if (!visible) return null;

  return (
    <div
      className="absolute top-[calc(100%+10px)] right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 transition-all duration-250 ease-out origin-top-right"
      style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-8px)' }}
    >
      {/* Header */}
      <div className="bg-green-50 px-4 py-2.5 flex items-center gap-2 border-b border-green-100">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-green-800 text-sm font-medium">Added to cart</span>
      </div>

      {/* Item row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {lastAddedItem?.image_url && (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <Image src={lastAddedItem.image_url} alt={lastAddedItem.name || ''} fill className="object-cover" unoptimized />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{lastAddedItem?.name}</p>
          <p className="text-gray-500 text-xs">${((lastAddedItem?.price || 0) * (lastAddedItem?.quantity || 1)).toFixed(2)}</p>
        </div>
      </div>

      {/* Divider + total */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
        <span className="text-gray-500 text-xs">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</span>
        <span className="font-bold text-gray-900 text-sm">${cartTotal.toFixed(2)}</span>
      </div>

      {/* CTA */}
      <div className="px-4 py-3">
        <button
          onClick={() => { clearLastAdded(); openSidebar(); }}
          className="w-full bg-[#FF3008] text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm cursor-pointer"
        >
          View Cart →
        </button>
      </div>
    </div>
  );
}

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
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Logout
                </button>
                {/* Cart button + popup */}
                <div className="relative">
                  <button
                    onClick={openSidebar}
                    className="relative bg-[#FF3008] text-white rounded-full px-4 py-2 flex items-center gap-2 hover:bg-red-600 transition-colors cursor-pointer"
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
                  <CartPopup />
                </div>
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
