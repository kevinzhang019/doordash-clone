'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';

interface DashPassSubscription {
  id: number;
  status: string;
  current_period_end: string;
  canceled_at: string | null;
  created_at: string;
}

export function useDashPass() {
  const { user } = useAuth();
  const [hasDashPass, setHasDashPass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<DashPassSubscription | null>(null);

  const refresh = useCallback(async () => {
    if (!user) {
      setHasDashPass(false);
      setSubscription(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('/api/dashpass/status');
      if (res.ok) {
        const data = await res.json();
        setHasDashPass(data.active);
        setSubscription(data.subscription);
      } else {
        setHasDashPass(false);
        setSubscription(null);
      }
    } catch {
      setHasDashPass(false);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { hasDashPass, loading, subscription, refresh };
}
