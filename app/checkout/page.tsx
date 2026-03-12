'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';

const TIP_PRESETS = [
  { label: '15%', value: 0.15 },
  { label: '18%', value: 0.18 },
  { label: '20%', value: 0.20 },
  { label: '25%', value: 0.25 },
];

export default function CheckoutPage() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { deliveryAddress, getRestaurantDeliveryInfo } = useLocation();
  const router = useRouter();
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(0.18);
  const [customTip, setCustomTip] = useState('');
  const [isCustomTip, setIsCustomTip] = useState(false);

  // Pre-fill address from delivery context
  useEffect(() => {
    if (deliveryAddress) setAddress(deliveryAddress);
  }, [deliveryAddress]);

  const restaurantId = cartItems[0]?.restaurant_id;
  const restaurantName = cartItems[0]?.restaurant_name;

  const info = restaurantId ? getRestaurantDeliveryInfo(restaurantId) : null;
  const deliveryFee = info?.deliveryFee ?? 2.99;

  const tipAmount = isCustomTip
    ? Math.max(0, parseFloat(customTip) || 0)
    : tipPercent !== null ? cartTotal * tipPercent : 0;

  const estimatedTotal = cartTotal + deliveryFee + tipAmount;

  const handleTipPreset = (pct: number) => {
    setIsCustomTip(false);
    setCustomTip('');
    setTipPercent(pct);
  };

  const handleNoTip = () => {
    setIsCustomTip(false);
    setCustomTip('');
    setTipPercent(0);
  };

  const handleCustomTip = () => {
    setIsCustomTip(true);
    setTipPercent(null);
  };

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
        body: JSON.stringify({
          deliveryAddress: address,
          tip: tipAmount,
          deliveryFee,
        }),
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
        <Link href="/" className="bg-[#FF3008] text-white font-semibold px-6 py-3 rounded-xl hover:bg-red-600 transition-colors inline-block cursor-pointer">
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
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Delivery fee</span>
              <span>{deliveryFee === 0 ? 'Free' : `$${deliveryFee.toFixed(2)}`}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-gray-600 text-sm">
                <span>Tip</span>
                <span>${tipAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-900 font-semibold pt-1 border-t border-gray-200 mt-1">
              <span>Estimated Total</span>
              <span>${estimatedTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Tip Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">Add a tip</h2>
          <p className="text-sm text-gray-500 mb-4">100% goes to your dasher</p>

          <div className="flex gap-2 flex-wrap">
            {TIP_PRESETS.map((preset) => {
              const isSelected = !isCustomTip && tipPercent === preset.value;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleTipPreset(preset.value)}
                  className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF3008] text-white border-[#FF3008]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <div>{preset.label}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-red-100' : 'text-gray-400'}`}>
                    ${(cartTotal * preset.value).toFixed(2)}
                  </div>
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleCustomTip}
              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                isCustomTip
                  ? 'bg-[#FF3008] text-white border-[#FF3008]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              Custom
            </button>
            <button
              type="button"
              onClick={handleNoTip}
              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                !isCustomTip && tipPercent === 0
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
              }`}
            >
              No tip
            </button>
          </div>

          {isCustomTip && (
            <div className="mt-3 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                autoFocus
              />
            </div>
          )}
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
              className="w-full bg-[#FF3008] text-white font-semibold py-4 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-lg"
            >
              {loading ? 'Placing Order...' : `Place Order • $${estimatedTotal.toFixed(2)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
