'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/providers/CartProvider';

export default function CartPage() {
  const { cartItems, cartTotal, removeItem, updateQuantity } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items from a restaurant to get started</p>
        <Link href="/" className="bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors inline-block">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  const restaurantName = cartItems[0]?.restaurant_name;
  const deliveryFee = 2.99; // Approximate — actual fee calculated at checkout from DB

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Restaurant Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-700">{restaurantName}</p>
        </div>

        {/* Cart Items */}
        <div className="divide-y divide-gray-100">
          {cartItems.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-6 py-4">
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
                <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                <p className="text-gray-500 text-sm">${(item.price || 0).toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors"
                >
                  −
                </button>
                <span className="w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 font-bold transition-colors"
                >
                  +
                </button>
              </div>
              <p className="font-semibold text-gray-900 w-16 text-right">
                ${((item.price || 0) * item.quantity).toFixed(2)}
              </p>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-400 hover:text-red-600 transition-colors ml-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-2">
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Subtotal</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600 text-sm">
            <span>Delivery fee</span>
            <span>~${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Estimated Total</span>
            <span>${(cartTotal + deliveryFee).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Link
        href="/checkout"
        className="block w-full bg-[#FF3008] text-white text-center font-semibold py-4 rounded-xl hover:bg-red-600 transition-colors text-lg"
      >
        Proceed to Checkout
      </Link>

      <Link href="/" className="block text-center text-[#FF3008] text-sm mt-4 hover:underline">
        Continue Shopping
      </Link>
    </div>
  );
}
