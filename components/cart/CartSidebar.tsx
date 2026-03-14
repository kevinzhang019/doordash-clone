'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';

export default function CartSidebar() {
  const { cartItems, cartTotal, isSidebarOpen, closeSidebar, removeItem, updateQuantity } = useCart();
  const { getRestaurantDeliveryInfo } = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    setRemovingIds((prev) => [...prev, id]);
    setTimeout(() => removeItem(id), 420);
  };

  // Handle mount/unmount with animation
  useEffect(() => {
    if (isSidebarOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isSidebarOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        closeSidebar();
      }
    };
    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSidebarOpen, closeSidebar]);

  // Lock body scroll when open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  if (!visible) return null;

  const restaurantId = cartItems[0]?.restaurant_id;
  const restaurantName = cartItems[0]?.restaurant_name;
  const deliveryInfo = restaurantId ? getRestaurantDeliveryInfo(restaurantId) : null;
  const deliveryMin = deliveryInfo?.min;
  const deliveryMax = deliveryInfo?.max;
  const deliveryFee = deliveryInfo?.deliveryFee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        style={{ opacity: animateIn ? 1 : 0 }}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{ transform: animateIn ? 'translateX(0)' : 'translateX(100%)' }}
      >
        {/* Header */}
        <div className="border-b">
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
            <button
              onClick={closeSidebar}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {restaurantName && (
            <Link
              href={`/restaurants/${restaurantId}`}
              onClick={closeSidebar}
              className="flex items-center justify-between px-4 py-3 mx-3 mb-3 rounded-xl bg-gray-100 hover:bg-red-50 border border-gray-200 hover:border-[#FF3008]/20 transition-colors group"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Ordering from</p>
                <p className="font-bold text-gray-900 group-hover:text-[#FF3008] transition-colors truncate">{restaurantName}</p>
                {(deliveryMin || deliveryFee !== undefined) && (
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                    {deliveryMin && deliveryMax && (
                      <span>{Math.round((deliveryMin + deliveryMax) / 2)} min</span>
                    )}
                    {deliveryMin && deliveryMax && deliveryFee !== undefined && (
                      <span className="text-gray-300">·</span>
                    )}
                    {deliveryFee !== undefined && (
                      <span>{deliveryFee === 0 ? 'Free delivery' : `$${deliveryFee.toFixed(2)} delivery`}</span>
                    )}
                  </div>
                )}
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 group-hover:text-[#FF3008] transition-colors flex-shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-medium">Your cart is empty</p>
              <p className="text-gray-400 text-sm mt-1">Add items from a restaurant to get started</p>
            </div>
          ) : (
            cartItems.map((item) => {
              const isRemoving = removingIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'grid',
                    gridTemplateRows: isRemoving ? '0fr' : '1fr',
                    opacity: isRemoving ? 0 : 1,
                    transition: 'opacity 0.18s ease, grid-template-rows 0.35s ease 0.1s',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div className="flex gap-3 pb-4">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={item.image_url || ''}
                          alt={item.name || ''}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.name}</p>
                        {item.selections && item.selections.length > 0 && (
                          <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
                            {item.selections.map(s => s.name).join(', ')}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">${((item.effective_price ?? item.price ?? 0) * item.quantity).toFixed(2)}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer"
                          >
                            −
                          </button>
                          <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors cursor-pointer"
                          >
                            +
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="ml-auto text-red-500 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span className="font-semibold">${cartTotal.toFixed(2)}</span>
            </div>
            <Link
              href="/checkout"
              onClick={closeSidebar}
              className="block w-full bg-[#FF3008] text-white text-center font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
            >
              Checkout • ${cartTotal.toFixed(2)}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
