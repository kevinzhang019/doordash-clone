'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import type { UserRole } from '@/lib/types';

const ROLE_LABELS: Record<UserRole, { label: string; icon: string }> = {
  customer: { label: 'Customer', icon: '🛒' },
  restaurant: { label: 'Restaurant Owner', icon: '🍽️' },
  driver: { label: 'Driver', icon: '🚗' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<UserRole[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.requiresRoleSelection && result.availableRoles) {
      setAvailableRoles(result.availableRoles);
      return;
    }

    await handlePostLogin('customer');
  };

  const handleRoleSelect = async (role: UserRole) => {
    setError('');
    setLoading(true);
    const result = await login(email, password, role);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await handlePostLogin(role);
  };

  const handlePostLogin = async (role: UserRole) => {
    if (role === 'customer') {
      await refreshCart();
      router.push('/');
    } else if (role === 'driver') {
      router.push('/driver-dashboard');
    } else if (role === 'restaurant') {
      router.push('/restaurant-dashboard');
    }
    router.refresh();
  };

  if (availableRoles) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Choose an account</h1>
            <p className="text-gray-500 mt-1">You have multiple accounts — pick one to sign in</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {availableRoles.map((role) => {
              const info = ROLE_LABELS[role];
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSelect(role)}
                  disabled={loading}
                  className="w-full bg-white rounded-2xl shadow-sm border-2 border-gray-100 p-5 flex items-center gap-4 text-left hover:border-[#FF3008] hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <span className="text-3xl">{info.icon}</span>
                  <span className="font-semibold text-gray-900">{info.label}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { setAvailableRoles(null); setError(''); }}
            className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            ← Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-1">Sign in to your DoorDash account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-[#FF3008] font-medium hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
