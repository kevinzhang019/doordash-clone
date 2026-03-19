'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function HomeAddressBar() {
  const { deliveryAddress, setDeliveryLocation, requestGPS, gpsStatus } = useLocation();
  const [inputAddress, setInputAddress] = useState('');

  useEffect(() => {
    setInputAddress(deliveryAddress || '');
  }, [deliveryAddress]);

  const handleChange = (addr: string, c?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (c) {
      setDeliveryLocation(addr, c.lat, c.lng);
    }
  };

  const handleGPS = async () => {
    try {
      const { address, lat, lng } = await requestGPS();
      if (address) {
        setInputAddress(address);
        setDeliveryLocation(address, lat, lng);
      }
    } catch {
      // denied — do nothing
    }
  };

  return (
    <div className="bg-white rounded-xl p-1.5 flex items-center max-w-xl gap-1">
      <AddressAutocomplete
        value={inputAddress}
        onChange={handleChange}
        placeholder="Enter delivery address"
        wrapperClassName="flex-1 min-w-0"
        className="w-full py-2.5 pr-3 border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-900 text-sm"
      />
      <button
        onClick={handleGPS}
        disabled={gpsStatus === 'requesting'}
        title="Use current location"
        className="bg-[#FF3008] text-white p-2.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer flex-shrink-0 disabled:opacity-60 flex items-center justify-center"
      >
        {gpsStatus === 'requesting' ? (
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}
