'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { useLocation } from '@/components/providers/LocationProvider';
import { useAuth } from '@/components/providers/AuthProvider';

interface SavedAddress {
  id: number;
  address: string;
  lat: number;
  lng: number;
  delivery_instructions: string | null;
  handoff_option: string | null;
}

interface AddressModalProps {
  onClose: () => void;
  required?: boolean;
}

export default function AddressModal({ onClose, required }: AddressModalProps) {
  const { setDeliveryLocation, requestGPS, gpsStatus } = useLocation();
  const { user } = useAuth();
  const [inputAddress, setInputAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editInstructions, setEditInstructions] = useState('');
  const [editHandoff, setEditHandoff] = useState<'hand_off' | 'leave_at_door'>('hand_off');
  const [saving, setSaving] = useState(false);

  const loadAddresses = () => {
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.addresses) setSavedAddresses(d.addresses); })
      .catch(() => {});
  };

  useEffect(() => { loadAddresses(); }, []);

  const handleEditClick = (e: React.MouseEvent, a: SavedAddress) => {
    e.stopPropagation();
    if (editingId === a.id) {
      setEditingId(null);
    } else {
      setEditingId(a.id);
      setEditInstructions(a.delivery_instructions || '');
      setEditHandoff((a.handoff_option as 'hand_off' | 'leave_at_door') || 'hand_off');
    }
  };

  const handleSaveInstructions = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId === null) return;
    setSaving(true);
    try {
      await fetch(`/api/addresses/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_instructions: editInstructions, handoff_option: editHandoff }),
      });
      setEditingId(null);
      loadAddresses();
    } finally {
      setSaving(false);
    }
  };

  const handleSelect = (addr: string, coords?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (coords) {
      setDeliveryLocation(addr, coords.lat, coords.lng);
      onClose();
    }
  };

  const handleUseSaved = (a: SavedAddress) => {
    setDeliveryLocation(a.address, a.lat, a.lng);
    onClose();
  };

  const handleGPS = async () => {
    try {
      const { address, lat, lng } = await requestGPS();
      if (address) {
        setDeliveryLocation(address, lat, lng);
        onClose();
      }
    } catch {
      // denied — do nothing
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
      onClick={required ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Deliver to</h2>
          {!required && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Autocomplete */}
          <AddressAutocomplete
            value={inputAddress}
            onChange={handleSelect}
            placeholder="Enter your delivery address"
            wrapperClassName="w-full"
            className="w-full py-3.5 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-base bg-gray-50"
          />

          {/* Current Location button */}
          <button
            onClick={handleGPS}
            disabled={gpsStatus === 'requesting'}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-gray-200 hover:border-[#FF3008] hover:bg-red-50 transition-colors text-left cursor-pointer disabled:opacity-60 group"
          >
            <div className="w-8 h-8 rounded-full bg-[#FF3008]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF3008]/20 transition-colors">
              {gpsStatus === 'requesting' ? (
                <svg className="animate-spin h-4 w-4 text-[#FF3008]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </div>
            <span className="font-medium text-gray-700 group-hover:text-[#FF3008] transition-colors">
              {gpsStatus === 'requesting' ? 'Getting location...' : 'Current Location'}
            </span>
          </button>

          {/* Saved addresses */}
          {savedAddresses.length > 0 && (
            <div>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Saved addresses</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-1">
                {savedAddresses.map(a => (
                  <div key={a.id} className="rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3 w-full px-4 py-3 text-left">
                      <button
                        onClick={() => handleUseSaved(a)}
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <div className="min-w-0">
                          <span className="text-sm text-gray-700 truncate block group-hover:text-gray-900">{a.address}</span>
                          {a.delivery_instructions && editingId !== a.id && (
                            <span className="text-xs text-gray-400 truncate block">{a.delivery_instructions}</span>
                          )}
                        </div>
                      </button>
                      {user && (
                        <button
                          onClick={e => handleEditClick(e, a)}
                          className={`p-1 flex-shrink-0 transition-colors cursor-pointer ${editingId === a.id ? 'text-[#FF3008]' : 'text-gray-300 hover:text-gray-500'}`}
                          title="Edit delivery instructions"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {/* Inline delivery instructions editor */}
                    {editingId === a.id && (
                      <div className="px-4 pb-3 space-y-2.5" onClick={e => e.stopPropagation()}>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditHandoff('hand_off')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              editHandoff === 'hand_off'
                                ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                            </svg>
                            Hand it to me
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditHandoff('leave_at_door')}
                            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                              editHandoff === 'leave_at_door'
                                ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-400'
                            }`}
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Leave at door
                          </button>
                        </div>
                        <textarea
                          value={editInstructions}
                          onChange={e => setEditInstructions(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm resize-none"
                          placeholder="Apt number, gate code, ring doorbell…"
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={e => { e.stopPropagation(); setEditingId(null); }}
                            className="text-xs font-medium text-gray-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveInstructions}
                            disabled={saving}
                            className="text-xs font-medium text-white bg-[#FF3008] px-4 py-1.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sign in / sign up prompt for guests */}
        {!user && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-1 text-sm text-gray-500">
            <span>Have an account?</span>
            <Link href="/login" onClick={onClose} className="font-semibold text-[#FF3008] hover:underline">Sign in</Link>
            <span>or</span>
            <Link href="/register" onClick={onClose} className="font-semibold text-[#FF3008] hover:underline">Sign up</Link>
          </div>
        )}
      </div>
    </div>
  );
}
