'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DriverSetupPage() {
  const { user } = useAuth();
  useRequireAuth('driver');
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/stripe/connect/status', {
      headers: { 'x-session-role': 'driver' },
    })
      .then(async res => {
        if (!res.ok) { setChecking(false); return; }
        const data = await res.json();
        if (data.complete) {
          router.replace('/driver-dashboard');
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleConnect = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'x-session-role': 'driver' },
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
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Set up your payout account</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Link your bank account to receive earnings from deliveries.
          </p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 p-3.5 bg-[#111] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-[#FF3008]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Get paid for deliveries</p>
                <p className="text-xs text-gray-500 mt-0.5">Earnings deposited directly to your bank account.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-[#111] rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white">Secured by Stripe</p>
                <p className="text-xs text-gray-500 mt-0.5">Bank details handled by Stripe — never stored by DoorDash.</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          <p className="text-xs text-gray-600 text-center mt-4">
            You&apos;ll be redirected to Stripe. This usually takes 2–3 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
