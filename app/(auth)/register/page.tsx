'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import type { UserRole } from '@/lib/types';

const ROLES: { role: UserRole; label: string; icon: string; subtitle: string }[] = [
  { role: 'customer',   label: 'Customer',          icon: '🛒', subtitle: 'Order food for delivery' },
  { role: 'restaurant', label: 'Restaurant Owner',   icon: '🍽️', subtitle: 'Manage your restaurant' },
  { role: 'driver',     label: 'Driver',             icon: '🚗', subtitle: 'Deliver orders & earn' },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<UserRole>('customer');

  useEffect(() => {
    const roleParam = searchParams.get('role') as UserRole | null;
    const validRoles: UserRole[] = ['customer', 'restaurant', 'driver'];
    if (roleParam && validRoles.includes(roleParam)) {
      setRole(roleParam);
    }
  }, [searchParams]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const current = ROLES.find(r => r.role === role)!;
  const others = ROLES.filter(r => r.role !== role);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await register(name, email, password, role);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (role === 'customer') {
      await refreshCart();
      router.push('/');
    } else if (role === 'driver') {
      router.push('/driver-dashboard');
    } else if (result.needsRestaurantSetup) {
      router.push('/restaurant-setup');
    } else {
      router.push('/restaurant-dashboard');
    }
    router.refresh();
  };

  const switchRole = (r: UserRole) => {
    setRole(r);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#FF3008] rounded-full mb-4">
            <span className="text-white font-bold text-2xl">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-500 mt-1">
            {role === 'customer' ? 'Fill in your details to get started' : <>Signing up as a <span className="font-medium text-gray-700">{current.label}</span></>}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                placeholder="John Doe"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href={`/login?role=${role}`} className="text-[#FF3008] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        {/* Switch mode */}
        <div className="mt-5 space-y-2">
          {others.map(({ role: r, label, icon }) => (
            <button
              key={r}
              onClick={() => switchRole(r)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 transition-colors text-sm text-gray-600 cursor-pointer"
            >
              <span>{icon}</span>
              <span>Sign up as <span className="font-medium text-gray-800">{label}</span></span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
