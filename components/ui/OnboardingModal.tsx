'use client';

import { useState } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressAutocomplete from './AddressAutocomplete';

export default function OnboardingModal() {
  const { onboardingComplete, requestGPS, setDeliveryLocation, gpsStatus } = useLocation();
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState('');

  if (onboardingComplete) return null;

  const handleAddressChange = (addr: string, c?: { lat: number; lng: number }) => {
    setAddress(addr);
    if (c) setCoords(c);
    setError('');
  };

  const handleConfirm = () => {
    if (!address.trim() || !coords) {
      setError('Please select an address from the dropdown suggestions');
      return;
    }
    setDeliveryLocation(address, coords.lat, coords.lng);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="text-center mb-7">
          <div className="w-14 h-14 bg-[#FF3008] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Where should we deliver?</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Set your delivery address to see nearby restaurants and accurate delivery times
          </p>
        </div>

        {/* GPS Button */}
        <button
          onClick={() => requestGPS((addr, lat, lng) => {
            setAddress(addr);
            setCoords({ lat, lng });
            setDeliveryLocation(addr, lat, lng);
          })}
          disabled={gpsStatus === 'requesting'}
          className="w-full flex items-center gap-3 border-2 border-gray-200 hover:border-[#FF3008] rounded-xl px-4 py-3.5 mb-4 transition-colors disabled:opacity-60 cursor-pointer text-left"
        >
          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 0v4m0 12v4M2 12h4m12 0h4" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {gpsStatus === 'requesting' ? 'Getting your location...' : 'Use my current location'}
            </p>
            {gpsStatus === 'denied' && (
              <p className="text-red-500 text-xs mt-0.5">
                Location access denied. Please enter an address below.
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-gray-400 text-sm font-medium">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

        <AddressAutocomplete
          value={address}
          onChange={handleAddressChange}
          placeholder="Enter your delivery address..."
          className="w-full py-3 pr-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent text-sm"
        />

        <button
          onClick={handleConfirm}
          className="w-full mt-3 bg-[#FF3008] text-white font-semibold py-3.5 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
        >
          Confirm Address
        </button>
      </div>
    </div>
  );
}
