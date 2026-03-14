'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { triggerAddressLoad } from '@/components/providers/LocationProvider';
import type { UserRole } from '@/lib/types';

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
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
      setUser(data.user);
      triggerAddressLoad();
      return { needsRestaurantSetup: data.needsRestaurantSetup };
    } catch {
      return { error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
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
