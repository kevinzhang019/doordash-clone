'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/lib/useRequireAuth';

export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { loading: authLoading } = useRequireAuth('driver');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    fetch('/api/stripe/connect/status', {
      headers: { 'x-session-role': 'driver' },
    })
      .then(async res => {
        if (!res.ok) { router.replace('/driver-setup'); return; }
        const data = await res.json();
        if (!data.complete) {
          router.replace('/driver-setup');
        } else {
          setReady(true);
        }
      })
      .catch(() => router.replace('/driver-setup'));
  }, [router, authLoading]);

  if (!ready) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#2a2a2a] border-t-[#FF3008] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
