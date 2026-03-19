'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import AddressModal from '@/components/layout/AddressModal';

export default function OnboardingModal() {
  const { deliveryAddress } = useLocation();
  const { user } = useAuth();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [status, setStatusState] = useState<'loading' | 'valid' | 'invalid'>('loading');
  const statusRef = useRef<'loading' | 'valid' | 'invalid'>('loading');

  const setStatus = (s: typeof status) => {
    statusRef.current = s;
    setStatusState(s);
  };

  useEffect(() => { setMounted(true); }, []);

  const verify = (address: string) => {
    setStatus('loading');
    let cancelled = false;
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (cancelled) return;
        // Not logged in or fetch error — trust localStorage.
        if (!d?.addresses) { setStatus('valid'); return; }
        const isSaved = d.addresses.some(
          (a: { address: string }) => a.address === address
        );
        setStatus(isSaved ? 'valid' : 'invalid');
      })
      .catch(() => { if (!cancelled) setStatus('valid'); });
    return () => { cancelled = true; };
  };

  // On mount and whenever deliveryAddress changes.
  useEffect(() => {
    if (!mounted) return;

    if (!deliveryAddress) {
      setStatus('invalid');
      return;
    }

    // If the modal was open and deliveryAddress just changed, the user set a
    // new address through the modal — trust it without re-fetching (avoids a
    // race with the background POST that saves it to the DB).
    if (statusRef.current === 'invalid') {
      setStatus('valid');
      return;
    }

    // If there was already a valid address and the user actively changed it
    // (e.g. via the navbar dropdown), trust the new address immediately.
    // The per-page-visit effect below handles re-verification on home visits.
    if (statusRef.current === 'valid') {
      return;
    }

    // Only reaches here on initial mount (status === 'loading') — verify the
    // address loaded from localStorage/DB is still saved in the account.
    return verify(deliveryAddress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, deliveryAddress]);

  // Re-verify on every home page visit so a deleted address is caught immediately.
  useEffect(() => {
    if (!mounted || pathname !== '/') return;
    if (!deliveryAddress) { setStatus('invalid'); return; }
    if (statusRef.current === 'invalid') return;
    return verify(deliveryAddress);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Never show for restaurant or driver accounts
  if (user?.role === 'restaurant' || user?.role === 'driver') return null;

  if (!mounted || status === 'loading' || status === 'valid') return null;

  return <AddressModal required onClose={() => setStatus('valid')} />;
}
