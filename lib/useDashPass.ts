'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface PassDashSubscription {
  id: number;
  status: string;
  current_period_end: string;
  canceled_at: string | null;
  created_at: string;
}

function hasSessionToken(): boolean {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('session_token_customer');
}

export function useDashPass() {
  const { user } = useAuth();
  const [hasDashPass, setHasPassDash] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<PassDashSubscription | null>(null);
  // Track whether we've done the initial fetch to avoid flashing wrong state
  const hasFetched = useRef(false);

  const refresh = useCallback(async () => {
    // Use sessionStorage token presence — doesn't depend on React user state timing
    if (!hasSessionToken()) {
      setHasPassDash(false);
      setSubscription(null);
      setLoading(false);
      hasFetched.current = true;
      return;
    }
    try {
      // Only show loading spinner on initial fetch, not on refreshes
      // This prevents the PassDash section from flickering to "subscribe" on re-fetches
      if (!hasFetched.current) {
        setLoading(true);
      }
      const res = await fetch('/api/dashpass/status');
      if (res.ok) {
        const data = await res.json();
        setHasPassDash(data.active);
        setSubscription(data.subscription);
      } else {
        setHasPassDash(false);
        setSubscription(null);
      }
    } catch {
      // On network error during refresh, keep current state instead of
      // flashing "not subscribed" — only clear on definitive server response
      if (!hasFetched.current) {
        setHasPassDash(false);
        setSubscription(null);
      }
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, []);

  // Fetch on mount and whenever user changes (login/logout)
  useEffect(() => {
    // On logout, immediately clear PassDash state
    if (!user && hasFetched.current) {
      setHasPassDash(false);
      setSubscription(null);
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh, user]);

  return { hasDashPass, loading, subscription, refresh };
}
