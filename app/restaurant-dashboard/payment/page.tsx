'use client';

import { useState, useEffect } from 'react';

export default function RestaurantPaymentPage() {
  const [stripeAccountId, setStripeAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stripe/connect/status', {
      headers: { 'x-session-role': 'restaurant' },
    })
      .then(r => r.json())
      .then(data => {
        setStripeAccountId(data.stripeAccountId ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUpdateBank = async () => {
    setError('');
    setUpdating(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'x-session-role': 'restaurant' },
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to start bank account update');
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payment & Payouts</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your bank account for receiving order payments.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3 mb-5">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="font-semibold text-gray-900">Bank account connected</p>
                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Active
                </span>
              </div>
              <p className="text-sm text-gray-500">Payments from orders are deposited directly to your bank.</p>
              {stripeAccountId && (
                <p className="text-xs text-gray-400 mt-1 font-mono">Account: {stripeAccountId}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Update bank account</h2>
        <p className="text-sm text-gray-500 mb-4">
          To change your bank account, you must link a new one. Your current account stays active until the new one is verified.
        </p>
        <button
          onClick={handleUpdateBank}
          disabled={updating}
          className="bg-gray-900 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {updating ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Redirecting...
            </>
          ) : (
            'Update bank account'
          )}
        </button>
        <p className="text-xs text-gray-400 mt-3">
          Powered by Stripe. You cannot remove a bank account without linking a new one.
        </p>
      </div>
    </div>
  );
}
