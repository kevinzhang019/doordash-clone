'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function HomeAddressBar() {
  const { deliveryAddress, setDeliveryLocation } = useLocation();
  const [inputAddress, setInputAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Sync input with current delivery address
  useEffect(() => {
    if (deliveryAddress) setInputAddress(deliveryAddress);
  }, [deliveryAddress]);

  const handleChange = (addr: string, c?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (c) {
      setCoords(c);
      // Auto-confirm when a suggestion is selected (coords are present)
      setDeliveryLocation(addr, c.lat, c.lng);
    }
  };

  const handleConfirm = () => {
    if (inputAddress && coords) {
      setDeliveryLocation(inputAddress, coords.lat, coords.lng);
    }
  };

  return (
    <div className="bg-white rounded-xl p-1 flex max-w-lg">
      <AddressAutocomplete
        value={inputAddress}
        onChange={handleChange}
        placeholder="Enter delivery address"
        className="flex-1 py-2 pr-4 border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-900 text-sm"
      />
      <button
        onClick={handleConfirm}
        className="bg-[#FF3008] text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer flex-shrink-0"
      >
        Find Food
      </button>
    </div>
  );
}
