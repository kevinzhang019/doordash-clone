'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { UserRole } from '@/lib/types';

/**
 * Client-side auth guard for protected pages.
 * Redirects to /login if the user is not authenticated.
 * Returns { user, loading } so pages can show a loading state while checking.
 */
export function useRequireAuth(role?: UserRole) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const r = role || 'customer';
      router.replace(`/login?role=${r}`);
    }
  }, [user, loading, role, router]);

  return { user, loading: loading || !user };
}
