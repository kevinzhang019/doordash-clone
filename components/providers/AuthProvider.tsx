'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { triggerAddressLoad } from '@/components/providers/LocationProvider';
import { setupFetchInterceptor } from '@/lib/fetchInterceptor';
import type { UserRole } from '@/lib/types';

// On first load of a new tab, seed sessionStorage from localStorage
// so the user is automatically signed in to their last-used accounts.
// After this one-time copy, the tab operates independently.
if (typeof window !== 'undefined') {
  const ROLES = ['customer', 'driver', 'restaurant'] as const;
  const hasAnySession = ROLES.some(r => sessionStorage.getItem(`session_token_${r}`));
  if (!hasAnySession) {
    // Only auto-login customer accounts — driver/restaurant sessions require explicit login
    const savedCustomerToken = localStorage.getItem('last_token_customer');
    if (savedCustomerToken) {
      sessionStorage.setItem('session_token_customer', savedCustomerToken);
      sessionStorage.setItem('active_role', 'customer');
    }
  }

  // Install the fetch interceptor as early as possible (module load time).
  setupFetchInterceptor();
}

interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string | null;
}

interface LoginResult {
  error?: string;
  requiresRoleSelection?: boolean;
  availableRoles?: UserRole[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, role?: UserRole) => Promise<{ error?: string; needsRestaurantSetup?: boolean }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function roleFromPath(path: string): UserRole | null {
  if (path.startsWith('/driver-dashboard')) return 'driver';
  if (path.startsWith('/restaurant-dashboard') || path.startsWith('/restaurant-setup')) return 'restaurant';
  if (path === '/cart' || path === '/checkout' || path.startsWith('/orders') || path.startsWith('/restaurants/')) return 'customer';
  return null; // shared page (/settings, /) — defer to active_role in sessionStorage
}

function setActiveRole(role: UserRole) {
  sessionStorage.setItem('active_role', role);
  localStorage.setItem('last_active_role', role);
}

function getActiveRole(): UserRole | null {
  const val = sessionStorage.getItem('active_role');
  return (val === 'customer' || val === 'driver' || val === 'restaurant') ? val : null;
}

function detectRole(): UserRole {
  if (typeof window === 'undefined') return 'customer';
  const pathRole = roleFromPath(window.location.pathname);
  if (pathRole) {
    setActiveRole(pathRole);
    return pathRole;
  }
  return getActiveRole() || 'customer';
}

/** Store a session token for a given role in per-tab sessionStorage
 *  and persist to localStorage so new tabs auto-sign-in to the last-used account */
function storeToken(role: UserRole, token: string) {
  sessionStorage.setItem(`session_token_${role}`, token);
  localStorage.setItem(`last_token_${role}`, token);
}

/** Remove a session token for a given role */
function clearToken(role: UserRole) {
  sessionStorage.removeItem(`session_token_${role}`);
}

/** Check if a token exists for a given role */
function hasToken(role: UserRole): boolean {
  return !!sessionStorage.getItem(`session_token_${role}`);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const role = detectRole();
      // The fetch interceptor automatically adds the Authorization header
      // with the token for this role from sessionStorage.
      const res = await fetch(`/api/auth/me?role=${role}`);
      const data = await res.json();
      setUser(data.user || null);
      if (data.user) {
        triggerAddressLoad();
      }
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (email: string, password: string, role?: UserRole): Promise<LoginResult> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Login failed' };
      if (data.requiresRoleSelection) {
        return { requiresRoleSelection: true, availableRoles: data.availableRoles };
      }
      // Store the JWT in per-tab sessionStorage
      if (data.token && data.user?.role) {
        storeToken(data.user.role, data.token);
        setActiveRole(data.user.role);
      }
      setUser(data.user);
      triggerAddressLoad();
      return {};
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole = 'customer'): Promise<{ error?: string; needsRestaurantSetup?: boolean }> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || 'Registration failed' };
      // Store the JWT in per-tab sessionStorage
      if (data.token && data.user?.role) {
        storeToken(data.user.role, data.token);
        setActiveRole(data.user.role);
      }
      setUser(data.user);
      triggerAddressLoad();
      return { needsRestaurantSetup: data.needsRestaurantSetup };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    const role = detectRole();
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    // Clear the per-tab session token and active role
    clearToken(role);
    sessionStorage.removeItem('active_role');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
