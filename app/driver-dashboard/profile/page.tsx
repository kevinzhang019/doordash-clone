'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import PhoneInput from '@/components/ui/PhoneInput';

const DEFAULT_RANGE = 10;

export default function DriverSettingsPage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [driverRatingInfo, setDriverRatingInfo] = useState<{ averageRating: number | null; totalRatings: number } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const [range, setRange] = useState(DEFAULT_RANGE);
  const [rangeSaved, setRangeSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.user) { setName(d.user.name); setEmail(d.user.email); setPhone(d.user.phone || ''); setAvatarUrl(d.user.avatar_url || null); }
      });
    const stored = parseInt(localStorage.getItem('driverRange') ?? '');
    if (!isNaN(stored)) setRange(stored);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    fetch(`/api/driver-ratings/${user.id}`)
      .then(r => r.json())
      .then(d => setDriverRatingInfo(d))
      .catch(() => {});
  }, [user?.id]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaved(false);
    if (!phoneValid) { setError('Please enter a valid phone number.'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: phone || null }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to save'); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await refreshUser();
    } catch { setError('Network error. Please try again.'); }
    finally { setSaving(false); }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(''); setPwSaved(false); setPwSaving(true);
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error || 'Failed to update'); return; }
      setPwSaved(true);
      setCurrentPassword(''); setNewPassword('');
      setTimeout(() => setPwSaved(false), 3000);
    } catch { setPwError('Network error. Please try again.'); }
    finally { setPwSaving(false); }
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

  const handleRangeSave = () => {
    localStorage.setItem('driverRange', String(range));
    setRangeSaved(true);
    setTimeout(() => setRangeSaved(false), 2500);
  };

  if (!user) return null;

  const input = 'w-full px-4 py-3 bg-[#111] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent';
  const label = 'block text-xs font-medium text-gray-400 mb-1.5';
  const section = 'bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-4';

  return (
    <div className="flex flex-col h-screen bg-black">
      <header className="bg-black border-b border-[#2a2a2a] h-14 flex items-center px-4 flex-shrink-0">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white mr-4 cursor-pointer transition-colors">← Back</button>
        <h1 className="text-white font-semibold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-6">

          {/* Driver rating summary */}
          {driverRatingInfo && driverRatingInfo.totalRatings > 0 && (
            <div className={section + ' flex items-center gap-4'}>
              <div className="text-3xl font-bold text-white leading-none">
                ★ {driverRatingInfo.averageRating?.toFixed(1)}
              </div>
              <div>
                <p className="text-white font-semibold">Driver Rating</p>
                <p className="text-gray-400 text-sm">{driverRatingInfo.totalRatings} {driverRatingInfo.totalRatings === 1 ? 'rating' : 'ratings'}</p>
              </div>
            </div>
          )}

          <div className={section}>
            <h2 className="text-white font-semibold mb-4">Personal Info</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-5">
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
                <p className="text-sm font-medium text-white">Profile photo</p>
                <p className="text-xs text-gray-500 mt-0.5">JPEG, PNG, or WebP · Max 5MB</p>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
            </div>

            <form onSubmit={handleProfileSave} className="space-y-4">
              {error && <p className="text-red-400 text-sm">{error}</p>}
              {saved && <p className="text-green-400 text-sm">Saved!</p>}
              <div><label className={label}>Full name</label><input type="text" required value={name} onChange={e => setName(e.target.value)} className={input} /></div>
              <div><label className={label}>Email address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={input} /></div>
              <div>
                <label className={label}>Phone <span className="text-gray-600 font-normal">(optional)</span></label>
                <PhoneInput value={phone} onChange={setPhone} onValidChange={setPhoneValid} dark />
              </div>
              <button type="submit" disabled={saving} className="bg-[#FF3008] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm cursor-pointer">
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          </div>

          <div className={section}>
            <h2 className="text-white font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSave} className="space-y-4">
              {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
              {pwSaved && <p className="text-green-400 text-sm">Password updated!</p>}
              <div><label className={label}>Current password</label><input type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={input} /></div>
              <div><label className={label}>New password</label><input type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" className={input} /></div>
              <button type="submit" disabled={pwSaving} className="bg-[#FF3008] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm cursor-pointer">
                {pwSaving ? 'Updating…' : 'Update password'}
              </button>
            </form>
          </div>

          <div className={section}>
            <h2 className="text-white font-semibold mb-1">Delivery Range</h2>
            <p className="text-gray-500 text-xs mb-5">
              Max distance from your location to the restaurant, and from the restaurant to the delivery address.
            </p>
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-xs">5 mi</span>
              <span className="text-white font-bold text-lg">{range} mi</span>
              <span className="text-gray-400 text-xs">100 mi</span>
            </div>
            <input
              type="range"
              min={5}
              max={100}
              step={1}
              value={range}
              onChange={e => setRange(parseInt(e.target.value))}
              className="w-full accent-[#FF3008] cursor-pointer mb-4"
            />
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                min={5}
                max={100}
                value={range}
                onChange={e => setRange(Math.min(100, Math.max(5, parseInt(e.target.value) || 5)))}
                className="w-24 px-3 py-2 text-center bg-[#111] border border-[#2a2a2a] rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              />
              <span className="text-gray-400 text-sm">miles</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRangeSave}
                className="bg-[#FF3008] text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setRange(DEFAULT_RANGE)}
                className="text-gray-500 hover:text-gray-300 text-sm transition-colors cursor-pointer"
              >
                Reset to default ({DEFAULT_RANGE} mi)
              </button>
              {rangeSaved && <span className="text-green-400 text-sm">Saved!</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
