'use client';

import { useEffect, useState } from 'react';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
import { useLocation } from '@/components/providers/LocationProvider';

interface SavedAddress {
  id: number;
  address: string;
  lat: number;
  lng: number;
}

interface AddressModalProps {
  onClose: () => void;
}

export default function AddressModal({ onClose }: AddressModalProps) {
  const { setDeliveryLocation, requestGPS, gpsStatus } = useLocation();
  const [inputAddress, setInputAddress] = useState('');
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    fetch('/api/addresses')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.addresses) setSavedAddresses(d.addresses); })
      .catch(() => {});
  }, []);

  // Close when GPS granted
  useEffect(() => {
    if (gpsStatus === 'granted') onClose();
  }, [gpsStatus, onClose]);

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

  const handleGPS = () => {
    requestGPS();
    // onClose will fire via the gpsStatus effect when granted
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Deliver to</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
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
                  <button
                    key={a.id}
                    onClick={() => handleUseSaved(a)}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-700 truncate group-hover:text-gray-900">{a.address}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
