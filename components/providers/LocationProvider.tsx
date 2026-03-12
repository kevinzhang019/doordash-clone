'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getVirtualRestaurantCoords,
  haversineDistance,
  deliveryFeeFromDistance,
  deliveryTimeFromDistance,
} from '@/lib/restaurantDistance';

export { haversineDistance } from '@/lib/restaurantDistance';

interface DeliveryCoords {
  lat: number;
  lng: number;
}

export interface RestaurantDeliveryInfo {
  distance: number;
  deliveryFee: number;
  min: number;
  max: number;
  virtualLat: number;
  virtualLng: number;
}

interface LocationContextType {
  deliveryCoords: DeliveryCoords | null;
  deliveryAddress: string;
  onboardingComplete: boolean;
  gpsStatus: 'idle' | 'requesting' | 'granted' | 'denied';
  requestGPS: () => void;
  setDeliveryLocation: (address: string, lat: number, lng: number) => void;
  getRestaurantDeliveryInfo: (restaurantId: number) => RestaurantDeliveryInfo | null;
}

const LocationContext = createContext<LocationContextType | null>(null);

// Module-level ref for cross-provider communication.
// AuthProvider imports and calls triggerAddressLoad() after login.
let _triggerAddressLoad: (() => Promise<void>) | null = null;

export function triggerAddressLoad() {
  if (_triggerAddressLoad) _triggerAddressLoad();
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [deliveryCoords, setDeliveryCoords] = useState<DeliveryCoords | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');

  // Load persisted delivery location from localStorage on mount
  useEffect(() => {
    const complete = localStorage.getItem('onboardingComplete') === '1';
    if (complete) {
      setOnboardingComplete(true);
      const addr = localStorage.getItem('deliveryAddress') || '';
      const lat = parseFloat(localStorage.getItem('deliveryLat') || '');
      const lng = parseFloat(localStorage.getItem('deliveryLng') || '');
      if (addr && !isNaN(lat) && !isNaN(lng)) {
        setDeliveryAddress(addr);
        setDeliveryCoords({ lat, lng });
      }
    }
  }, []);

  // Register the triggerAddressLoad function so AuthProvider can call it
  useEffect(() => {
    _triggerAddressLoad = async () => {
      try {
        const res = await fetch('/api/addresses');
        if (!res.ok) return;
        const data = await res.json();
        if (data.address?.lat != null && data.address?.lng != null) {
          const { address: addr, lat, lng } = data.address;
          setDeliveryAddress(addr);
          setDeliveryCoords({ lat, lng });
          setOnboardingComplete(true);
          localStorage.setItem('onboardingComplete', '1');
          localStorage.setItem('deliveryAddress', addr);
          localStorage.setItem('deliveryLat', String(lat));
          localStorage.setItem('deliveryLng', String(lng));
        }
      } catch {
        // Silently ignore — user may not be logged in
      }
    };
    return () => {
      _triggerAddressLoad = null;
    };
  }, []);

  const setDeliveryLocation = useCallback((address: string, lat: number, lng: number) => {
    setDeliveryAddress(address);
    setDeliveryCoords({ lat, lng });
    setOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', '1');
    localStorage.setItem('deliveryAddress', address);
    localStorage.setItem('deliveryLat', String(lat));
    localStorage.setItem('deliveryLng', String(lng));
    // Persist to DB if logged in (silently ignored for guests — middleware returns 401)
    fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, lat, lng }),
    }).catch(() => {});
  }, []);

  const requestGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsStatus('denied');
      return;
    }
    setGpsStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsStatus('granted');
        setDeliveryLocation('Current Location', pos.coords.latitude, pos.coords.longitude);
      },
      () => setGpsStatus('denied'),
      { timeout: 10000 }
    );
  }, [setDeliveryLocation]);

  const getRestaurantDeliveryInfo = useCallback(
    (restaurantId: number): RestaurantDeliveryInfo | null => {
      if (!deliveryCoords) return null;
      const vCoords = getVirtualRestaurantCoords(restaurantId, deliveryCoords.lat, deliveryCoords.lng);
      const distance = haversineDistance(
        deliveryCoords.lat,
        deliveryCoords.lng,
        vCoords.lat,
        vCoords.lng
      );
      const deliveryFee = deliveryFeeFromDistance(distance);
      const { min, max } = deliveryTimeFromDistance(distance);
      return { distance, deliveryFee, min, max, virtualLat: vCoords.lat, virtualLng: vCoords.lng };
    },
    [deliveryCoords]
  );

  return (
    <LocationContext.Provider
      value={{
        deliveryCoords,
        deliveryAddress,
        onboardingComplete,
        gpsStatus,
        requestGPS,
        setDeliveryLocation,
        getRestaurantDeliveryInfo,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}
