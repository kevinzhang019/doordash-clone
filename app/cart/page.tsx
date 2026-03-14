'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';

const listVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.045, delayChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 36, scale: 0.97 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 420, damping: 30 },
  },
  exit: {
    opacity: 0,
    x: -80,
    scale: 0.95,
    transition: { duration: 0.18, ease: [0.32, 0, 0.67, 0] as const },
  },
};

function QuantityBadge({ value }: { value: number }) {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
      className="w-7 text-center font-bold text-gray-900 text-base tabular-nums"
    >
      {value}
    </motion.span>
  );
}

function CartCard({
  item,
  onRemove,
  onUpdateQty,
}: {
  item: { id: number; name?: string; price?: number; effective_price?: number; quantity: number; image_url?: string; special_requests?: string | null };
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
      variants={itemVariants}
      layout
      className="relative overflow-hidden"
    >
      {/* Delete hint behind the card */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-y-0 right-0 left-0 flex items-center justify-end pr-6 bg-red-50 pointer-events-none select-none"
      >
        <div className="flex flex-col items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Remove</span>
        </div>
      </motion.div>

      {/* The draggable card surface */}
      <motion.div
        style={{ x, background: bg }}
        drag="x"
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.15, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80 || info.velocity.x < -600) {
            setSwiped(true);
            onRemove(item.id);
          }
        }}
        whileTap={{ cursor: 'grabbing' }}
        className={`relative flex items-center gap-4 px-5 py-4 border-b border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] cursor-grab ${swiped ? 'pointer-events-none' : ''}`}
      >
        {/* Food image */}
        <div className="relative w-[72px] h-[72px] rounded-xl overflow-hidden flex-shrink-0 shadow-sm ring-1 ring-black/5">
          <Image
            src={item.image_url || ''}
            alt={item.name || ''}
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-[15px] leading-tight line-clamp-1">{item.name}</p>
          {item.special_requests && (
            <p className="text-xs text-gray-400 mt-0.5 italic line-clamp-1">"{item.special_requests}"</p>
          )}
          <p className="text-sm text-gray-500 mt-1">${effectivePrice.toFixed(2)} each</p>

          {/* Qty stepper + delete */}
          <div className="flex items-center gap-2 mt-2">
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={() => onUpdateQty(item.id, item.quantity - 1)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
            >
              −
            </motion.button>
            <QuantityBadge value={item.quantity} />
            <motion.button
              whileTap={{ scale: 0.82 }}
              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
              className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-lg transition-colors"
            >
              +
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => onRemove(item.id)}
              className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Price */}
        <div className="flex-shrink-0">
          <motion.span
            key={lineTotal}
            initial={{ y: -8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="font-bold text-gray-900 text-base tabular-nums"
          >
            ${lineTotal.toFixed(2)}
          </motion.span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function CartPage() {
  const { cartItems, cartTotal, removeItem, updateQuantity, loading } = useCart();
  const { getRestaurantDeliveryInfo } = useLocation();
  const [removingIds, setRemovingIds] = useState<number[]>([]);

  const handleRemove = (id: number) => {
    if (removingIds.includes(id)) return;
    setRemovingIds((prev) => [...prev, id]);
    setTimeout(() => removeItem(id), 300);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#FF3008] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl mx-auto px-4 py-16 text-center"
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-200 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </motion.div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items from a restaurant to get started</p>
        <Link href="/" className="bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors inline-block">
          Browse Restaurants
        </Link>
      </motion.div>
    );
  }

  const restaurantId = cartItems[0]?.restaurant_id;
  const restaurantName = cartItems[0]?.restaurant_name;
  const deliveryInfo = restaurantId ? getRestaurantDeliveryInfo(restaurantId) : null;
  const deliveryFee = deliveryInfo?.deliveryFee ?? 2.99;
  const deliveryMin = deliveryInfo?.min;
  const deliveryMax = deliveryInfo?.max;
  const visibleItems = cartItems.filter((item) => !removingIds.includes(item.id));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="max-w-2xl mx-auto px-4 py-8"
    >
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Restaurant Header */}
        <Link
          href={`/restaurants/${restaurantId}`}
          className="flex items-center justify-between px-6 py-5 border-b border-gray-100 hover:bg-gray-50 transition-colors group"
        >
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">Ordering from</p>
            <p className="text-lg font-bold text-gray-900 group-hover:text-[#FF3008] transition-colors">{restaurantName}</p>
            <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
              <span>{deliveryFee === 0 ? 'Free delivery' : `$${deliveryFee.toFixed(2)} delivery`}</span>
              {deliveryMin && deliveryMax && (
                <>
                  <span className="text-gray-300">·</span>
                  <span>{deliveryMin}–{deliveryMax} min</span>
                </>
              )}
            </div>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 group-hover:text-[#FF3008] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        {/* Hint label */}
        <p className="text-[11px] text-gray-400 text-right px-5 pt-3 pb-0 select-none">
          ← swipe to remove
        </p>

        {/* Cart Items */}
        <motion.div
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence initial={false}>
            {visibleItems.map((item) => (
              <CartCard
                key={item.id}
                item={item}
                onRemove={handleRemove}
                onUpdateQty={updateQuantity}
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Summary */}
        <motion.div layout className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Subtotal</span>
            <motion.span
              key={cartTotal}
              initial={{ opacity: 0.4 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              ${cartTotal.toFixed(2)}
            </motion.span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Delivery fee</span>
            <span>{deliveryInfo ? (deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`) : `~$${deliveryFee.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Estimated Total</span>
            <motion.span
              key={cartTotal + deliveryFee}
              initial={{ opacity: 0.4, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              ${(cartTotal + deliveryFee).toFixed(2)}
            </motion.span>
          </div>
        </motion.div>
      </div>

      <motion.div whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}>
        <Link
          href="/checkout"
          className="block w-full bg-[#FF3008] text-white text-center font-semibold py-4 rounded-xl hover:bg-red-600 transition-colors text-lg shadow-lg shadow-red-200"
        >
          Proceed to Checkout
        </Link>
      </motion.div>

      <Link href="/" className="block text-center text-[#FF3008] text-sm mt-4 hover:underline">
        Continue Shopping
      </Link>
    </motion.div>
  );
}
