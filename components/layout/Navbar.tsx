'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { useSearch } from '@/components/providers/SearchProvider';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

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
      <div className="bg-green-50 px-4 py-2.5 flex items-center gap-2 border-b border-green-100">
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="text-green-800 text-sm font-medium">Added to cart</span>
      </div>
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
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100">
        <span className="text-gray-500 text-xs">{cartCount} item{cartCount !== 1 ? 's' : ''} in cart</span>
        <span className="font-bold text-gray-900 text-sm">${cartTotal.toFixed(2)}</span>
      </div>
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

function truncateAddress(addr: string, max = 26): string {
  if (!addr || addr === 'Current Location') return addr;
  return addr.length > max ? addr.slice(0, max) + '…' : addr;
}

function AddressDropdown({ onClose }: { onClose: () => void }) {
  const { deliveryAddress, setDeliveryLocation, requestGPS, gpsStatus } = useLocation();
  const [inputAddress, setInputAddress] = useState(
    deliveryAddress && deliveryAddress !== 'Current Location' ? deliveryAddress : ''
  );

  const handleChange = (addr: string, coords?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (coords) {
      setDeliveryLocation(addr, coords.lat, coords.lng);
      onClose();
    }
  };

  const handleGPS = () => {
    requestGPS();
    onClose();
  };

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <p className="text-base font-semibold text-gray-900">Deliver to</p>
        {deliveryAddress && (
          <p className="text-sm text-gray-500 mt-0.5 truncate">{deliveryAddress}</p>
        )}
      </div>

      {/* Address input */}
      <div className="p-5">
        <AddressAutocomplete
          value={inputAddress}
          onChange={handleChange}
          placeholder="Enter a new delivery address"
          wrapperClassName="w-full"
          className="w-full py-3 pr-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm transition-colors"
        />

        <div className="flex items-center gap-3 mt-3">
          <div className="flex-1 h-px bg-gray-100" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-100" />
        </div>

        <button
          onClick={handleGPS}
          disabled={gpsStatus === 'requesting'}
          className="mt-3 w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-gray-200 hover:border-[#FF3008] hover:bg-red-50 transition-colors text-sm font-medium text-gray-700 hover:text-[#FF3008] disabled:opacity-50 cursor-pointer"
        >
          {gpsStatus === 'requesting' ? (
            <svg className="animate-spin h-4 w-4 text-[#FF3008]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth={2} />
            </svg>
          )}
          Use current location
        </button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, openSidebar } = useCart();
  const { deliveryAddress } = useLocation();
  const { search, setSearch } = useSearch();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const addressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (addressRef.current && !addressRef.current.contains(e.target as Node)) {
        setAddressOpen(false);
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

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#FF3008] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-[#FF3008] font-bold text-xl hidden sm:block">DoorDash</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 min-w-0 mx-3">
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search restaurants or cuisines..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Address dropdown button */}
          <div className="relative flex-shrink-0" ref={addressRef}>
            <button
              onClick={() => setAddressOpen(o => !o)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-colors text-sm cursor-pointer ${
                addressOpen
                  ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                  : 'border-gray-200 hover:border-[#FF3008] hover:bg-red-50 text-gray-700 hover:text-[#FF3008]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF3008] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className={`max-w-[160px] truncate font-medium hidden sm:block ${deliveryAddress ? 'text-gray-900' : 'text-gray-400'}`}>
                {deliveryAddress ? truncateAddress(deliveryAddress) : 'Add address'}
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 text-gray-400 flex-shrink-0 transition-transform hidden sm:block ${addressOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {addressOpen && <AddressDropdown onClose={() => setAddressOpen(false)} />}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <Link href="/orders" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden lg:block whitespace-nowrap">
                    My Orders
                  </Link>
                )}
                {user.role === 'restaurant' && (
                  <Link href="/restaurant-dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden lg:block whitespace-nowrap">
                    My Restaurant
                  </Link>
                )}
                {user.role === 'driver' && (
                  <Link href="/driver-dashboard" className="text-gray-600 hover:text-gray-900 text-sm font-medium hidden lg:block whitespace-nowrap">
                    Driver Mode
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#FF3008] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="font-medium text-gray-700 hidden sm:block">{user.name.split(' ')[0]}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-gray-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 top-[calc(100%+8px)] w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 py-1">
                      <div className="px-4 py-3 border-b border-gray-50">
                        <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/settings"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </Link>
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

                {/* Cart - customers only */}
                {user.role === 'customer' && (
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
                )}
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
