'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressModal from '@/components/layout/AddressModal';
import PhoneInput from '@/components/ui/PhoneInput';

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
  const { user, refreshUser, loading: authLoading, logout } = useAuth();
  const { setDeliveryLocation, deliveryAddress } = useLocation();
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressModalOpen, setAddressModalOpen] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

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
          setAvatarUrl(d.user.avatar_url || null);
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
    if (!phoneValid) {
      setProfileError('Please enter a valid phone number.');
      return;
    }
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    const form = new FormData();
    form.append('avatar', file);
    try {
      const res = await fetch('/api/settings/avatar', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) { setAvatarUrl(data.avatarUrl); await refreshUser(); }
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAddress = async (id: number) => {
    const deletedAddr = addresses.find(a => a.id === id);
    await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
    if (deletedAddr && deletedAddr.address === deliveryAddress) {
      const remaining = addresses.filter(a => a.id !== id);
      if (remaining.length > 0) {
        setDeliveryLocation(remaining[0].address, remaining[0].lat, remaining[0].lng);
      }
    }
    loadAddresses();
  };

  const handleUseAddress = (a: SavedAddress) => {
    setDeliveryLocation(a.address, a.lat, a.lng);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSaved(false);
    setPwSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || 'Failed to update password');
        return;
      }
      setPwSaved(true);
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setPwSaving(false);
    }
  };

  const handleAddressModalClose = () => {
    setAddressModalOpen(false);
    loadAddresses(); // Refresh after potentially adding a new address
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/settings', { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        setDeleteError(data.error || 'Failed to delete account');
        setDeleting(false);
        return;
      }
      await logout();
      router.push('/');
    } catch {
      setDeleteError('Network error. Please try again.');
      setDeleting(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

      {/* Profile section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Profile</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="relative w-16 h-16 rounded-full overflow-hidden bg-[#FF3008] flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity group"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Profile" fill className="object-cover" unoptimized />
            ) : (
              <span className="text-white font-bold text-2xl">{name.charAt(0).toUpperCase() || '?'}</span>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            {avatarUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
            )}
          </button>
          <div>
            <p className="text-sm font-medium text-gray-700">Profile photo</p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, or WebP · Max 5MB</p>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
        </div>

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
            <PhoneInput
              value={phone}
              onChange={setPhone}
              onValidChange={setPhoneValid}
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

      {/* Change Password section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{pwError}</div>
          )}
          {pwSaved && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Password updated!</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={pwSaving}
            className="bg-[#FF3008] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {pwSaving ? 'Updating...' : 'Update password'}
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

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 mt-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          {profile?.role === 'restaurant'
            ? 'Permanently delete your account and your restaurant, including all menu items, orders, and associated data.'
            : 'Permanently delete your account and all associated data. This cannot be undone.'}
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            {deleteError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{deleteError}</div>
            )}
            <p className="text-sm text-gray-700">
              Type <span className="font-mono font-bold">DELETE</span> to confirm.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }}
                className="text-sm font-medium text-gray-500 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {addressModalOpen && <AddressModal onClose={handleAddressModalClose} />}
    </div>
  );
}
