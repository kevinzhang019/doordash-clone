'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/components/providers/CartProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { getItemDeal, dealSavings } from '@/lib/dealUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

const TIP_PRESET_RATES = [0.15, 0.18, 0.20, 0.25];
const TAX_RATE = 0.085;

const roundToHalf = (n: number) => Math.round(n / 0.5) * 0.5;

interface AppliedPromo {
  id: number;
  code: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  savings: number;
}

function CheckoutForm() {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { deliveryAddress, deliveryCoords, getRestaurantDeliveryInfo } = useLocation();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tipPercent, setTipPercent] = useState<number | null>(0.18);
  const [customTip, setCustomTip] = useState('');
  const [isCustomTip, setIsCustomTip] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [handoffOption, setHandoffOption] = useState<'hand_off' | 'leave_at_door'>('hand_off');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<AppliedPromo | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const restaurantId = cartItems[0]?.restaurant_id;
  const restaurantName = cartItems[0]?.restaurant_name;

  const info = restaurantId ? getRestaurantDeliveryInfo(restaurantId) : null;
  const deliveryFee = info?.deliveryFee ?? 2.99;

  const [restaurantIsSeeded, setRestaurantIsSeeded] = useState(false);
  const fetchedRestaurantIdRef = useRef<number | null>(null);
  useEffect(() => {
    if (!restaurantId || fetchedRestaurantIdRef.current === restaurantId) return;
    fetchedRestaurantIdRef.current = restaurantId;
    fetch(`/api/restaurants/${restaurantId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRestaurantIsSeeded(data.isSeeded ?? false); })
      .catch(() => {});
  }, [restaurantId]);

  const totalDealSavings = restaurantIsSeeded && deliveryAddress
    ? cartItems.reduce((sum, item) => {
        const deal = getItemDeal(item.menu_item_id, deliveryAddress);
        return sum + (deal ? dealSavings(deal, item.effective_price ?? item.price ?? 0, item.quantity) : 0);
      }, 0)
    : 0;

  const presetAmounts = TIP_PRESET_RATES.map((r) => roundToHalf(cartTotal * r));

  const tipAmount = isCustomTip
    ? Math.max(0, parseFloat(customTip) || 0)
    : tipPercent !== null ? roundToHalf(cartTotal * tipPercent) : 0;

  const discountedSubtotal = cartTotal - totalDealSavings - (appliedPromo?.savings ?? 0);
  const taxAmount = discountedSubtotal * TAX_RATE;
  const estimatedTotal = discountedSubtotal + deliveryFee + tipAmount + taxAmount;

  const stripeEnabled = !!stripePromise && !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('placeholder');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?redirect=/checkout');
    }
  }, [authLoading, user, router]);

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

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoError('');
    setPromoLoading(true);
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim(), cartTotal }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromo(data.promo);
        setPromoInput('');
      } else {
        setPromoError(data.error || 'Invalid promo code');
      }
    } catch {
      setPromoError('Failed to validate promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let paymentIntentId: string | undefined;

      // Stripe payment flow (only when real keys configured)
      if (stripeEnabled && stripe && elements) {
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          setError('Payment form not ready. Please try again.');
          setLoading(false);
          return;
        }

        // Create payment intent
        const piRes = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Math.round(estimatedTotal * 100) }),
        });
        const piData = await piRes.json();
        if (!piRes.ok) {
          setError(piData.error || 'Failed to initialize payment');
          setLoading(false);
          return;
        }

        const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
          piData.clientSecret,
          { payment_method: { card: cardElement } }
        );

        if (stripeError) {
          setError(stripeError.message || 'Payment failed');
          setLoading(false);
          return;
        }

        if (paymentIntent?.status !== 'succeeded') {
          setError('Payment was not completed. Please try again.');
          setLoading(false);
          return;
        }

        paymentIntentId = paymentIntent.id;
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryAddress,
          deliveryLat: deliveryCoords?.lat ?? null,
          deliveryLng: deliveryCoords?.lng ?? null,
          tip: tipAmount,
          deliveryFee,
          discountSaved: totalDealSavings,
          promoCodeId: appliedPromo?.id ?? null,
          paymentIntentId: paymentIntentId ?? null,
          deliveryInstructions: deliveryInstructions.trim() || null,
          handoffOption,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to place order');
        setLoading(false);
        return;
      }

      await clearCart();
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

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-5 cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
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
              <div key={item.id} className="px-6 py-3">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-gray-900 font-medium">{item.name}</span>
                      <span className="text-gray-500 text-sm">x{item.quantity}</span>
                    </div>
                    {item.selections && item.selections.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {item.selections.map((s, i) => {
                          const qty = (s as { quantity?: number }).quantity ?? 1;
                          const totalMod = s.price_modifier * qty;
                          return (
                            <div key={i} className="flex items-center justify-between text-xs text-gray-500">
                              <span>{qty > 1 ? `${qty}x ` : ''}{s.name}</span>
                              {totalMod !== 0 && (
                                <span className="ml-2 tabular-nums text-gray-400 flex-shrink-0 font-semibold">
                                  {totalMod > 0 ? `+$${totalMod.toFixed(2)}` : `-$${Math.abs(totalMod).toFixed(2)}`}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {item.special_requests && (
                      <p className="text-xs text-gray-400 italic mt-0.5">"{item.special_requests}"</p>
                    )}
                  </div>
                  <span className="text-gray-900 font-medium tabular-nums flex-shrink-0">
                    ${((item.effective_price ?? item.price ?? 0) * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 space-y-1.5">
            {totalDealSavings > 0 && (
              <div className="flex items-center justify-between bg-[#FF3008] text-white rounded-lg px-3 py-2 mb-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  Deals applied!
                </div>
                <span className="text-sm font-bold">-${totalDealSavings.toFixed(2)}</span>
              </div>
            )}
            {appliedPromo && (
              <div className="flex items-center justify-between bg-green-600 text-white rounded-lg px-3 py-2 mb-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
                  </svg>
                  Promo: {appliedPromo.code}
                </div>
                <span className="text-sm font-bold">-${appliedPromo.savings.toFixed(2)}</span>
              </div>
            )}
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
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Est. tax (8.5%)</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
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
            {TIP_PRESET_RATES.map((rate, i) => {
              const isSelected = !isCustomTip && tipPercent === rate;
              return (
                <button
                  key={rate}
                  type="button"
                  onClick={() => handleTipPreset(rate)}
                  className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#FF3008] text-white border-[#FF3008]'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  ${presetAmounts[i].toFixed(2)}
                </button>
              );
            })}
            <button
              type="button"
              onClick={handleCustomTip}
              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
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
              className={`flex-1 min-w-[60px] py-2.5 rounded-xl text-sm font-semibold border transition-colors cursor-pointer ${
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

        {/* Promo Code */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Promo Code</h2>
          {appliedPromo ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div>
                <p className="font-semibold text-green-800 text-sm">{appliedPromo.code}</p>
                <p className="text-green-600 text-xs mt-0.5">
                  {appliedPromo.discount_type === 'percentage'
                    ? `${appliedPromo.discount_value}% off`
                    : `$${appliedPromo.discount_value.toFixed(2)} off`}
                  {' '}— saving ${appliedPromo.savings.toFixed(2)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemovePromo}
                className="text-green-700 hover:text-green-900 text-sm font-medium transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={e => setPromoInput(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleApplyPromo())}
                placeholder="Enter promo code"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm uppercase placeholder-normal"
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput.trim()}
                className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {promoLoading ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {promoError && <p className="text-red-600 text-sm mt-2">{promoError}</p>}
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Delivery Address</h2>
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-900 text-sm leading-relaxed">
              {deliveryAddress || <span className="text-gray-400 italic">No address set</span>}
            </p>
          </div>
        </div>

        {/* Delivery Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <h2 className="font-semibold text-gray-900">Delivery Details</h2>

          {/* Handoff option */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setHandoffOption('hand_off')}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                handoffOption === 'hand_off'
                  ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
              </svg>
              Hand it to me
            </button>
            <button
              type="button"
              onClick={() => setHandoffOption('leave_at_door')}
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                handoffOption === 'leave_at_door'
                  ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Leave at door
            </button>
          </div>

          {/* Delivery instructions */}
          <div>
            <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-1.5">
              Delivery instructions <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="instructions"
              value={deliveryInstructions}
              onChange={(e) => setDeliveryInstructions(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
              placeholder="Apt number, gate code, ring doorbell…"
            />
          </div>
        </div>

        {/* Payment — Stripe card element (only when real keys configured) */}
        {stripeEnabled && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Payment</h2>
            <div className="border border-gray-200 rounded-xl px-4 py-3">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '14px',
                      color: '#111827',
                      '::placeholder': { color: '#9ca3af' },
                    },
                  },
                }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Test card: 4242 4242 4242 4242 · Any future expiry · Any CVC</p>
          </div>
        )}

        {/* Place Order */}
        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
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

export default function CheckoutPage() {
  if (stripePromise) {
    return (
      <Elements stripe={stripePromise}>
        <CheckoutForm />
      </Elements>
    );
  }
  return <CheckoutForm />;
}
