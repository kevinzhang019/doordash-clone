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
 * If the authenticated user's role doesn't match the allowed role,
 * redirect them to their own home page. Does nothing for unauthenticated users.
 */
export default function RoleRedirect({ allowed }: { allowed: UserRole }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !user) return;
    if (user.role !== allowed) {
      router.replace(ROLE_HOME[user.role]);
    }
  }, [user, loading, allowed, router]);

  return null;
}
