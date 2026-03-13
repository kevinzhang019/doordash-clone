'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressModal from '@/components/layout/AddressModal';

interface SavedAddress {
  id: number;
  address: string;
  lat: number;
  lng: number;
  created_at: string;
}

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string | null;
}

export default function SettingsPage() {
  const { user, refreshUser, loading: authLoading } = useAuth();
  const { setDeliveryLocation, deliveryAddress } = useLocation();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  // Load profile
  useEffect(() => {
    if (!user) return;
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setProfile(d.user);
          setName(d.user.name);
          setEmail(d.user.email);
          setPhone(d.user.phone || '');
        }
      });
  }, [user]);

  const loadAddresses = () => {
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.addresses) setAddresses(d.addresses); })
      .catch(() => {});
  };

  useEffect(() => {
    if (user) loadAddresses();
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    setProfileSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || 'Failed to save');
        return;
      }
      setProfile(data.user);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      await refreshUser();
    } catch {
      setProfileError('Network error. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteAddress = async (id: number) => {
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    loadAddresses();
  };

  const handleUseAddress = (a: SavedAddress) => {
    setDeliveryLocation(a.address, a.lat, a.lng);
  };

  const handleAddressModalClose = () => {
    setAddressModalOpen(false);
    loadAddresses(); // Refresh after potentially adding a new address
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Profile section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-4">
          {profileError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{profileError}</div>
          )}
          {profileSaved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Profile saved!</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="(555) 000-0000"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={profileSaving}
            className="bg-[#FF3008] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {profileSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Addresses section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Saved Addresses</h2>
          <button
            onClick={() => setAddressModalOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-[#FF3008] hover:text-red-700 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No saved addresses yet</p>
            <button
              onClick={() => setAddressModalOpen(true)}
              className="mt-2 text-[#FF3008] text-sm font-medium hover:underline cursor-pointer"
            >
              Add your first address
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {addresses.map(a => {
              const isCurrent = deliveryAddress === a.address;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
                    isCurrent ? 'border-[#FF3008] bg-red-50' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 flex-shrink-0 ${isCurrent ? 'text-[#FF3008]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="flex-1 text-sm text-gray-800 min-w-0 truncate">{a.address}</span>
                  {isCurrent && (
                    <span className="text-xs font-medium text-[#FF3008] bg-red-100 px-2 py-0.5 rounded-full flex-shrink-0">In use</span>
                  )}
                  {!isCurrent && (
                    <button
                      onClick={() => handleUseAddress(a)}
                      className="text-xs font-medium text-gray-500 hover:text-[#FF3008] transition-colors cursor-pointer flex-shrink-0"
                    >
                      Use
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAddress(a.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer p-1 flex-shrink-0"
                    title="Delete address"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {addressModalOpen && <AddressModal onClose={handleAddressModalClose} />}
    </div>
  );
}
