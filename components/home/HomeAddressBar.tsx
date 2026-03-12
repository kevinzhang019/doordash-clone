'use client';

import { useState, useEffect } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';

export default function HomeAddressBar() {
  const { deliveryAddress, setDeliveryLocation } = useLocation();
  const [inputAddress, setInputAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    // Only sync typed addresses — leave blank when GPS ("Current Location") is used
    if (deliveryAddress && deliveryAddress !== 'Current Location') {
      setInputAddress(deliveryAddress);
    } else if (deliveryAddress === 'Current Location') {
      setInputAddress('');
    }
  }, [deliveryAddress]);

  const handleChange = (addr: string, c?: { lat: number; lng: number }) => {
    setInputAddress(addr);
    if (c) {
      setCoords(c);
      setDeliveryLocation(addr, c.lat, c.lng);
    }
  };

  const handleConfirm = () => {
    if (inputAddress && coords) {
      setDeliveryLocation(inputAddress, coords.lat, coords.lng);
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
        onClick={handleConfirm}
        className="bg-[#FF3008] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-red-600 transition-colors cursor-pointer flex-shrink-0"
      >
        Find Food
      </button>
    </div>
  );
}
