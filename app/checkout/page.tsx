'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/providers/CartProvider';

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const restaurantName = cartItems[0]?.restaurant_name;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Please enter a delivery address');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress: address }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order');
        setLoading(false);
        return;
      }

      clearCart();
      router.push(`/orders/${data.orderId}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Add items to your cart before checking out</p>
        <Link href="/" className="bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors inline-block">
          Browse Restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-700">Order Summary</h2>
            {restaurantName && <p className="text-sm text-gray-500 mt-0.5">From {restaurantName}</p>}
          </div>
          <div className="divide-y divide-gray-100">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center px-6 py-3">
                <div>
                  <span className="text-gray-900 font-medium">{item.name}</span>
                  <span className="text-gray-500 text-sm ml-2">x{item.quantity}</span>
                </div>
                <span className="text-gray-900 font-medium">${((item.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-1.5">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-gray-400">Delivery fee will be calculated from restaurant info</p>
          </div>
        </div>

        {/* Delivery Address Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Delivery Address</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                Street address
              </label>
              <textarea
                id="address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
                placeholder="123 Main Street, Apt 4B, New York, NY 10001"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF3008] text-white font-semibold py-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {loading ? 'Placing Order...' : `Place Order • $${cartTotal.toFixed(2)}+`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
