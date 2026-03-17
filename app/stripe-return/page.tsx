'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function StripeReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'restaurant' | 'driver' | null;
  const [status, setStatus] = useState<'checking' | 'success' | 'incomplete'>('checking');

  useEffect(() => {
    if (!role) {
      router.replace('/');
      return;
    }

    fetch('/api/stripe/connect/status', {
      headers: { 'x-session-role': role },
    })
      .then(async res => {
        if (!res.ok) {
          setStatus('incomplete');
          return;
        }
        const data = await res.json();
        if (data.complete) {
          setStatus('success');
          setTimeout(() => {
            router.replace(role === 'restaurant' ? '/restaurant-dashboard' : '/driver-dashboard');
          }, 1500);
        } else {
          setStatus('incomplete');
        }
      })
      .catch(() => setStatus('incomplete'));
  }, [role, router]);

  const handleRetry = () => {
    router.replace(role === 'restaurant' ? '/restaurant-setup/payment' : '/driver-setup');
  };

  const isDark = role === 'driver';

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${isDark ? 'bg-black' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-sm text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        {status === 'checking' && (
          <>
            <div className="w-12 h-12 border-2 border-gray-300 border-t-[#FF3008] rounded-full animate-spin mx-auto mb-4" />
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Verifying your account...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-1">Bank account connected!</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Taking you to your dashboard...</p>
          </>
        )}

        {status === 'incomplete' && (
          <>
            <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-1">Setup incomplete</h2>
            <p className={`text-sm mb-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              It looks like the bank account setup wasn&apos;t completed. Please try again.
            </p>
            <button
              onClick={handleRetry}
              className="bg-[#FF3008] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-colors text-sm"
            >
              Try again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function StripeReturnPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    }>
      <StripeReturnContent />
    </Suspense>
  );
}
