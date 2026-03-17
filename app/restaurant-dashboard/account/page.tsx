'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import PhoneInput from '@/components/ui/PhoneInput';

export default function RestaurantAccountPage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();

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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setName(d.user.name);
          setEmail(d.user.email);
          setPhone(d.user.phone || '');
          setAvatarUrl(d.user.avatar_url || null);
        }
      });
  }, [user]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    if (!phoneValid) { setProfileError('Please enter a valid phone number.'); return; }
    setProfileSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { setProfileError(data.error || 'Failed to save'); return; }
      if (data.token && data.user?.role) {
        sessionStorage.setItem(`session_token_${data.user.role}`, data.token);
        localStorage.setItem(`last_token_${data.user.role}`, data.token);
      }
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
      if (!res.ok) { setPwError(data.error || 'Failed to update password'); return; }
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

  const inputCls = 'w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Profile</h2>
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
          {profileError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{profileError}</div>}
          {profileSaved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Profile saved!</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Phone number <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <PhoneInput value={phone} onChange={setPhone} onValidChange={setPhoneValid} />
          </div>
          <button type="submit" disabled={profileSaving} className="bg-[#FF3008] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {profileSaving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Change Password</h2>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {pwError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{pwError}</div>}
          {pwSaved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Password updated!</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
            <input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
            <input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" className={inputCls} />
          </div>
          <button type="submit" disabled={pwSaving} className="bg-[#FF3008] text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
            {pwSaving ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your account and your restaurant, including all menu items, orders, and associated data.
        </p>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)} className="text-sm font-semibold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer">
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            {deleteError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{deleteError}</div>}
            <p className="text-sm text-gray-700">Type <span className="font-mono font-bold">DELETE</span> to confirm.</p>
            <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className={inputCls} />
            <div className="flex gap-3">
              <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || deleting} className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                {deleting ? 'Deleting...' : 'Permanently delete'}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); setDeleteError(''); }} className="text-sm font-medium text-gray-500 px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
