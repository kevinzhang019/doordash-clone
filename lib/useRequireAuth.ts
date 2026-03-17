'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import type { UserRole } from '@/lib/types';

const ROLE_HOME: Record<UserRole, string> = {
  customer: '/',
  driver: '/driver-dashboard',
  restaurant: '/restaurant-dashboard',
};

/**
 * Client-side auth guard for protected pages.
 * - Redirects to /login if the user is not authenticated.
 * - Redirects to the user's home page if their role doesn't match the required role.
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
      return;
    }
    // If a specific role is required and the user has a different role, redirect to their home
    if (role && user.role !== role) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, role, router]);

  const wrongRole = !loading && user && role && user.role !== role;

  return { user, loading: loading || !user || !!wrongRole };
}
