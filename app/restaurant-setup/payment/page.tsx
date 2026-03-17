'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RestaurantPaymentSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasRestaurant, setHasRestaurant] = useState(false);

  useEffect(() => {
    // Check if they have a restaurant; if already complete, send to dashboard
    fetch('/api/restaurant-dashboard')
      .then(async res => {
        if (!res.ok) {
          // No restaurant yet — send back to create one
          router.replace('/restaurant-setup');
          return;
        }
        const data = await res.json();
        if (data.restaurant?.stripe_onboarding_complete) {
          router.replace('/restaurant-dashboard');
          return;
        }
        setHasRestaurant(true);
        setChecking(false);
      })
      .catch(() => {
        router.replace('/restaurant-setup');
      });
  }, [router]);

  const handleConnect = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'x-session-role': 'restaurant' },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to start bank account setup');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user || checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    );
  }

  if (!hasRestaurant) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Connect your bank account</h1>
          <p className="text-gray-500 mt-1">
            Set up payouts so you can receive payments from orders.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Progress indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-sm text-gray-500">Restaurant info</span>
            </div>
            <div className="flex-1 h-px bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-[#FF3008] flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
              <span className="text-sm font-medium text-gray-900">Bank account</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Secure bank connection</p>
                <p className="text-xs text-gray-500 mt-0.5">Link your bank account to receive order payouts. Powered by Stripe.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Your data is protected</p>
                <p className="text-xs text-gray-500 mt-0.5">Bank credentials are handled directly by Stripe and never stored by us.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connecting...
              </>
            ) : (
              'Connect bank account'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            You&apos;ll be redirected to Stripe to complete verification. This usually takes 2–3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
