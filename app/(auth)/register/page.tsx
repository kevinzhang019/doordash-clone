'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useCart } from '@/components/providers/CartProvider';
import type { UserRole } from '@/lib/types';

const ROLE_OPTIONS: { role: UserRole; title: string; subtitle: string; icon: string }[] = [
  {
    role: 'customer',
    title: 'Customer',
    subtitle: 'Order food from your favorite restaurants',
    icon: '🛒',
  },
  {
    role: 'restaurant',
    title: 'Restaurant Owner',
    subtitle: 'Manage your restaurant and menu',
    icon: '🍽️',
  },
  {
    role: 'driver',
    title: 'Driver',
    subtitle: 'Earn money delivering orders',
    icon: '🚗',
  },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { refreshCart } = useCart();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await register(name, email, password, selectedRole);
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (selectedRole === 'customer') {
      await refreshCart();
      router.push('/');
    } else if (selectedRole === 'driver') {
      router.push('/driver-dashboard');
    } else if (result.needsRestaurantSetup) {
      router.push('/restaurant-setup');
    } else {
      router.push('/restaurant-dashboard');
    }
    router.refresh();
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
            {step === 1 ? 'Choose how you want to use DoorDash' : 'Fill in your details to get started'}
          </p>
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            {ROLE_OPTIONS.map(({ role, title, subtitle, icon }) => (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={`w-full bg-white rounded-2xl shadow-sm border-2 p-5 flex items-center gap-4 text-left transition-all hover:shadow-md cursor-pointer ${
                  selectedRole === role ? 'border-[#FF3008]' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <span className="text-3xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
            <p className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{' '}
              <Link href="/login" className="text-[#FF3008] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <button
              onClick={() => { setStep(1); setError(''); }}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-5 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="mb-5 p-3 bg-gray-50 rounded-xl flex items-center gap-3">
              <span className="text-xl">{ROLE_OPTIONS.find(r => r.role === selectedRole)?.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{ROLE_OPTIONS.find(r => r.role === selectedRole)?.title}</p>
                <p className="text-xs text-gray-500">{ROLE_OPTIONS.find(r => r.role === selectedRole)?.subtitle}</p>
              </div>
            </div>

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
              <Link href="/login" className="text-[#FF3008] font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
