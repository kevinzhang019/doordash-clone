'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { getAddressDeal, dealSavings } from '@/lib/dealUtils';

const TAX_RATE = 0.085;

function SidebarCartItem({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: {
    id: number;
    name?: string;
    price?: number;
    effective_price?: number;
    quantity: number;
    image_url?: string;
    special_requests?: string | null;
    selections?: { name: string }[];
  };
  onRemove: (id: number) => void;
  onUpdateQty: (id: number, qty: number) => void;
}) {
  const x = useMotionValue(0);
  const bg = useTransform(x, [-90, 0], ['#fee2e2', '#f7f8f9']);
  const deleteOpacity = useTransform(x, [-90, -30], [1, 0]);
  const [swiped, setSwiped] = useState(false);

  const effectivePrice = item.effective_price ?? item.price ?? 0;
  const lineTotal = effectivePrice * item.quantity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 36, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -60, scale: 0.95, transition: { duration: 0.16, ease: [0.32, 0, 0.67, 0] } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="relative overflow-hidden rounded-xl mb-3"
    >
      {/* Delete hint behind card */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 flex items-center justify-end pr-4 bg-red-50 pointer-events-none select-none rounded-xl"
      >
        <div className="flex flex-col items-center gap-0.5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">Remove</span>
        </div>
      </motion.div>

      {/* Draggable card */}
      <motion.div
        style={{ x, background: bg }}
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={{ left: 0.12, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -75 || info.velocity.x < -600) {
            setSwiped(true);
            onRemove(item.id);
          }
        }}
        whileTap={{ cursor: 'grabbing' }}
        className={`relative flex gap-3 p-3 border border-gray-100 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-grab ${swiped ? 'pointer-events-none' : ''}`}
      >
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
          <Image
            src={item.image_url || ''}
            alt={item.name || ''}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm line-clamp-1 leading-tight">{item.name}</p>
          {item.selections && item.selections.length > 0 && (
            <p className="text-gray-400 text-xs mt-0.5 line-clamp-1">
              {item.selections.map((s) => s.name).join(', ')}
            </p>
          )}
          {item.special_requests && (
            <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">"{item.special_requests}"</p>
          )}

          <div className="flex items-center justify-between mt-2">
            {/* Qty stepper + delete */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onUpdateQty(item.id, item.quantity - 1)}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-base transition-colors cursor-pointer"
              >
                −
              </motion.button>
              <motion.span
                key={item.quantity}
                initial={{ scale: 1.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="text-sm font-bold w-5 text-center tabular-nums"
              >
                {item.quantity}
              </motion.span>
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-base transition-colors cursor-pointer"
              >
                +
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => onRemove(item.id)}
                className="ml-1 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </motion.button>
            </div>

            {/* Price */}
            <motion.span
              key={lineTotal}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              className="text-sm font-bold text-gray-900 tabular-nums"
            >
              ${lineTotal.toFixed(2)}
            </motion.span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CartSidebar() {
  const { cartItems, cartTotal, isSidebarOpen, closeSidebar, removeItem, updateQuantity } = useCart();
  const { getRestaurantDeliveryInfo, deliveryAddress } = useLocation();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    if (removingIds.includes(id)) return;
    setRemovingIds((prev) => [...prev, id]);
    setTimeout(() => removeItem(id), 280);
  };

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        closeSidebar();
      }
    };
    if (isSidebarOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isSidebarOpen, closeSidebar]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isSidebarOpen]);

  const restaurantId = cartItems[0]?.restaurant_id;
  const restaurantName = cartItems[0]?.restaurant_name;
  const deliveryInfo = restaurantId ? getRestaurantDeliveryInfo(restaurantId) : null;
  const deliveryMin = deliveryInfo?.min;
  const deliveryMax = deliveryInfo?.max;
  const deliveryFee = deliveryInfo?.deliveryFee ?? 2.99;
  const visibleItems = cartItems.filter((item) => !removingIds.includes(item.id));

  const addressDeal = restaurantId && deliveryAddress ? getAddressDeal(deliveryAddress, restaurantId) : null;

  const totalDealSavings = addressDeal
    ? cartItems.reduce((sum, item) => {
        return sum + dealSavings(addressDeal, item.effective_price ?? item.price ?? 0, item.quantity);
      }, 0)
    : 0;

  const discountedSubtotal = cartTotal - totalDealSavings;
  const taxAmount = discountedSubtotal * TAX_RATE;
  const estimatedTotal = discountedSubtotal + deliveryFee + taxAmount;

  return (
    <AnimatePresence>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/40"
          />

          {/* Panel */}
          <motion.div
            ref={sidebarRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            className="relative bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="border-b">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h2 className="text-lg font-bold text-gray-900">Your Cart</h2>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={closeSidebar}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
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
                        {deliveryMin && deliveryMax && <span>{Math.round((deliveryMin + deliveryMax) / 2)} min</span>}
                        {deliveryMin && deliveryMax && deliveryFee !== undefined && <span className="text-gray-300">·</span>}
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

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {visibleItems.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center py-12"
                >
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </motion.div>
                  <p className="text-gray-500 font-medium">Your cart is empty</p>
                  <p className="text-gray-400 text-sm mt-1">Add items from a restaurant to get started</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-[11px] text-gray-400 text-right mb-2 select-none">← swipe to remove</p>
                  <AnimatePresence initial={false}>
                    {visibleItems.map((item) => (
                      <SidebarCartItem
                        key={item.id}
                        item={item}
                        onRemove={handleRemove}
                        onUpdateQty={updateQuantity}
                      />
                    ))}
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {visibleItems.length > 0 && (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="border-t p-4 space-y-2"
                >
                  {/* Deals savings banner */}
                  {totalDealSavings > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#FF3008] text-white rounded-xl px-4 py-2.5 flex items-center justify-between text-sm font-semibold mb-1"
                    >
                      <div className="flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        <span>Deals applied!</span>
                      </div>
                      <span>-${totalDealSavings.toFixed(2)}</span>
                    </motion.div>
                  )}

                  {/* Price breakdown */}
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Subtotal</span>
                    <motion.span key={cartTotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
                      ${cartTotal.toFixed(2)}
                    </motion.span>
                  </div>
                  {totalDealSavings > 0 && (
                    <div className="flex justify-between text-[#FF3008] text-sm font-medium">
                      <span>Deal savings</span>
                      <span>-${totalDealSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Delivery fee</span>
                    <span>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Est. tax (8.5%)</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-semibold pt-1.5 border-t border-gray-100">
                    <span>Est. total</span>
                    <motion.span key={estimatedTotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }}>
                      ${estimatedTotal.toFixed(2)}
                    </motion.span>
                  </div>

                  <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }} className="pt-1">
                    <Link
                      href="/checkout"
                      onClick={closeSidebar}
                      className="block w-full bg-[#FF3008] text-white text-center font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer shadow-lg shadow-red-200"
                    >
                      Checkout · ${estimatedTotal.toFixed(2)}
                    </Link>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
