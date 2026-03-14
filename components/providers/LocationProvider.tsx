'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
  requestGPS: () => Promise<{ address: string; lat: number; lng: number }>;
  setDeliveryLocation: (address: string, lat: number, lng: number) => void;
  getRestaurantDeliveryInfo: (restaurantId: number, restaurantLat?: number | null, restaurantLng?: number | null) => RestaurantDeliveryInfo | null;
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

  // Refs so _triggerAddressLoad can read the latest state without re-registering
  const deliveryAddressRef = useRef(deliveryAddress);
  const deliveryCoordsRef = useRef(deliveryCoords);
  useEffect(() => { deliveryAddressRef.current = deliveryAddress; }, [deliveryAddress]);
  useEffect(() => { deliveryCoordsRef.current = deliveryCoords; }, [deliveryCoords]);

  // Load persisted delivery location on mount: localStorage first, then fall back to DB (for guests too)
  useEffect(() => {
    const complete = localStorage.getItem('onboardingComplete') === '1';
    if (complete) {
      setOnboardingComplete(true);
      const addr = localStorage.getItem('deliveryAddress') || '';
      const lat = parseFloat(localStorage.getItem('deliveryLat') || '');
      const lng = parseFloat(localStorage.getItem('deliveryLng') || '');
      // Skip legacy 'Current Location' placeholder — require a real address
      if (addr && addr !== 'Current Location' && !isNaN(lat) && !isNaN(lng)) {
        setDeliveryAddress(addr);
        setDeliveryCoords({ lat, lng });
        return;
      }
    }
    // No localStorage address — try loading from DB (works for both guests and logged-in users)
    fetch('/api/addresses').then(async (res) => {
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
    }).catch(() => {});
  }, []);

  // Register the triggerAddressLoad function so AuthProvider can call it
  useEffect(() => {
    _triggerAddressLoad = async () => {
      try {
        const guestAddr = deliveryAddressRef.current;
        const guestCoords = deliveryCoordsRef.current;

        // If there's a guest address in memory, save it to the user's account (migration also
        // happens server-side via x-guest-id header, but this ensures in-memory addr is saved too)
        if (guestAddr && guestCoords) {
          await fetch('/api/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: guestAddr, lat: guestCoords.lat, lng: guestCoords.lng }),
          });
          return;
        }

        // No in-memory address — load from DB (migration of guest DB addresses also happens here)
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
        // Silently ignore
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
    // Persist to DB (works for both guests and logged-in users)
    fetch('/api/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, lat, lng }),
    }).catch(() => {});
  }, []);

  const requestGPS = useCallback((): Promise<{ address: string; lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        setGpsStatus('denied');
        reject(new Error('Geolocation not supported'));
        return;
      }
      setGpsStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          try {
            const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
            const res = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
            );
            const data = await res.json();
            const address: string = data.results?.[0]?.formatted_address ?? '';
            setGpsStatus('granted');
            resolve({ address, lat, lng });
          } catch {
            setGpsStatus('granted');
            resolve({ address: '', lat, lng });
          }
        },
        () => {
          setGpsStatus('denied');
          reject(new Error('Location denied'));
        },
        { timeout: 10000 }
      );
    });
  }, []);

  const getRestaurantDeliveryInfo = useCallback(
    (restaurantId: number, restaurantLat?: number | null, restaurantLng?: number | null): RestaurantDeliveryInfo | null => {
      if (!deliveryCoords) return null;
      // Use the restaurant's real coordinates if stored; fall back to virtual placement for seeded restaurants
      const vCoords = (restaurantLat != null && restaurantLng != null)
        ? { lat: restaurantLat, lng: restaurantLng }
        : getVirtualRestaurantCoords(restaurantId, deliveryCoords.lat, deliveryCoords.lng);
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
