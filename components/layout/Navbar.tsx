'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { useSearch } from '@/components/providers/SearchProvider';
import AddressAutocomplete, { AddressAutocompleteHandle } from '@/components/ui/AddressAutocomplete';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

function CartPopup() {
  const { lastAddedItem, cartTotal, cartCount, clearLastAdded, openSidebar, updateQuantity, removeItem } = useCart();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [localQty, setLocalQty] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const startDismissTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setAnimateIn(false);
      setTimeout(() => { setVisible(false); clearLastAdded(); }, 250);
    }, 3500);
  };

  useEffect(() => {
    if (!lastAddedItem) {
      setAnimateIn(false);
      const t = setTimeout(() => setVisible(false), 250);
      return () => clearTimeout(t);
    }
    setLocalQty(lastAddedItem.quantity);
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setAnimateIn(true)));
    startDismissTimer();
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAddedItem]);

  useEffect(() => {
    if (!visible) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setAnimateIn(false);
        setTimeout(() => { setVisible(false); clearLastAdded(); }, 250);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [visible, clearLastAdded]);

  const handleQtyChange = async (delta: number) => {
    if (!lastAddedItem) return;
    const newQty = localQty + delta;
    if (newQty < 1) {
      setAnimateIn(false);
      setTimeout(() => { setVisible(false); clearLastAdded(); }, 250);
      await removeItem(lastAddedItem.id);
      return;
    }
    setLocalQty(newQty);
    await updateQuantity(lastAddedItem.id, newQty);
    startDismissTimer();
  };

  if (!visible) return null;

  const lineTotal = (lastAddedItem?.price || 0) * localQty;

  return (
    <div
      ref={popupRef}
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
          <p className="text-gray-500 text-xs">${lineTotal.toFixed(2)}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleQtyChange(-1)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer text-base leading-none"
          >
            −
          </button>
          <span className="text-sm font-semibold w-5 text-center tabular-nums">{localQty}</span>
          <button
            onClick={() => handleQtyChange(1)}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer text-base leading-none"
          >
            +
          </button>
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

interface SavedAddress {
  id: number;
  address: string;
  lat: number;
  lng: number;
}

function truncateAddress(addr: string, max = 26): string {
  if (!addr || addr === 'Current Location') return addr;
  return addr.length > max ? addr.slice(0, max) + '…' : addr;
}

function AddressDropdown({ onClose }: { onClose: () => void }) {
  const { deliveryAddress, setDeliveryLocation, requestGPS, gpsStatus } = useLocation();
  const [inputAddress, setInputAddress] = useState('');
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const autocompleteRef = useRef<AddressAutocompleteHandle>(null);

  useEffect(() => {
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.addresses) setSavedAddresses(d.addresses); })
      .catch(() => {});
  }, []);

  // Current address first, rest in original order
  const sortedAddresses = [...savedAddresses].sort((a, b) => {
    if (a.address === deliveryAddress) return -1;
    if (b.address === deliveryAddress) return 1;
    return 0;
  });

  const handleChange = (addr: string, coords?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (coords) {
      // User selected from Google autocomplete — save immediately and close
      setPendingCoords(null);
      setDeliveryLocation(addr, coords.lat, coords.lng);
      onClose();
    } else {
      // User is typing — clear any pending GPS coords
      setPendingCoords(null);
    }
  };

  const handleGPS = async () => {
    try {
      const { address, lat, lng } = await requestGPS();
      if (address) {
        setInputAddress(address);
        setPendingCoords({ lat, lng });
        autocompleteRef.current?.fill(address);
        // Don't save yet — user confirms by pressing Enter
      }
    } catch {
      // denied — gpsStatus already set to 'denied'
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputAddress && pendingCoords) {
      e.preventDefault();
      setDeliveryLocation(inputAddress, pendingCoords.lat, pendingCoords.lng);
      onClose();
    }
  };

  const handleUseSaved = (a: SavedAddress) => {
    setDeliveryLocation(a.address, a.lat, a.lng);
    onClose();
  };

  // Each address row is ~52px. Show 2 full rows + ~40% of a third (≈ 125px).
  const ITEM_H = 52;
  const listMaxH = sortedAddresses.length > 2 ? ITEM_H * 2.45 : undefined;
  const showFade = sortedAddresses.length > 2;

  return (
    <div className="absolute left-0 top-[calc(100%+8px)] w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
      {/* Search input + GPS */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <AddressAutocomplete
            ref={autocompleteRef}
            value={inputAddress}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search for an address"
            wrapperClassName="flex-1 min-w-0"
            className="w-full py-2.5 pr-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm transition-colors"
          />
          <button
            onClick={handleGPS}
            disabled={gpsStatus === 'requesting'}
            title="Use current location"
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 hover:border-[#FF3008] hover:bg-red-50 text-gray-500 hover:text-[#FF3008] transition-colors disabled:opacity-50 cursor-pointer"
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
          </button>
        </div>
      </div>

      {/* Saved addresses */}
      {sortedAddresses.length > 0 && (
        <div className="relative">
          <div
            className="overflow-y-auto py-1.5"
            style={listMaxH ? { maxHeight: listMaxH } : undefined}
          >
            {sortedAddresses.map(a => {
              const isCurrent = a.address === deliveryAddress;
              return (
                <button
                  key={a.id}
                  onClick={() => handleUseSaved(a)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-red-50 text-[#FF3008]'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 flex-shrink-0 ${isCurrent ? 'text-[#FF3008]' : 'text-gray-400'}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm font-medium truncate">{a.address}</span>
                </button>
              );
            })}
          </div>
          {/* Soft fade to hint at more addresses below */}
          {showFade && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent pointer-events-none" />
          )}
        </div>
      )}
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
      const target = e.target as Node;
      // Don't close dropdowns when clicking Google Maps autocomplete suggestions
      const pacContainers = document.querySelectorAll('.pac-container');
      const clickedPac = Array.from(pacContainers).some(c => c.contains(target));
      if (clickedPac) return;

      if (profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
      if (addressRef.current && !addressRef.current.contains(target)) {
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

  // Drivers and restaurant owners have their own dedicated layouts
  if (user?.role === 'driver' || user?.role === 'restaurant') return null;

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

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileOpen(p => !p)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-full bg-[#FF3008] flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt={user.name} width={24} height={24} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <span className="text-white text-xs font-bold">{user.name.charAt(0).toUpperCase()}</span>
                      )}
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
                      {user.role === 'customer' && (
                        <Link
                          href="/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          My Orders
                        </Link>
                      )}
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
              </>
            ) : (
              <>
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
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 text-sm font-medium border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
