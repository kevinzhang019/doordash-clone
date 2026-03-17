'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function StripeRefreshContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') as 'restaurant' | 'driver' | null;

  useEffect(() => {
    if (!role) {
      router.replace('/');
      return;
    }

    // Get a fresh onboarding link and redirect to it
    fetch('/api/stripe/connect/onboard', {
      method: 'POST',
      headers: { 'x-session-role': role },
    })
      .then(async res => {
        if (!res.ok) {
          router.replace(role === 'restaurant' ? '/restaurant-setup/payment' : '/driver-setup');
          return;
        }
        const { url } = await res.json();
        window.location.href = url;
      })
      .catch(() => {
        router.replace(role === 'restaurant' ? '/restaurant-setup/payment' : '/driver-setup');
      });
  }, [role, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#FF3008] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Refreshing your connection...</p>
      </div>
    </div>
  );
}

export default function StripeRefreshPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    }>
      <StripeRefreshContent />
    </Suspense>
  );
}
