'use client';

import { useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useLocation } from '@/components/providers/LocationProvider';

let geocoderInitialized = false;
function initGeocoder() {
  if (!geocoderInitialized) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    geocoderInitialized = true;
  }
}

interface Props {
  restaurantId: number;
  /** The restaurant's stored address — shown as-is for non-default restaurants. */
  storedAddress?: string | null;
  /** Real lat/lng from DB — if present, this is a non-default restaurant and we use storedAddress directly. */
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  /** If true, always show the stored address without virtual addressing. */
  isOwned?: boolean;
  /** Shown before the address text — only rendered when an address is available. */
  prefix?: string;
  className?: string;
}

export default function VirtualRestaurantAddress({ restaurantId, storedAddress, restaurantLat, restaurantLng, isOwned = false, prefix = '', className }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const isDefault = !isOwned && (restaurantLat == null || restaurantLng == null);
  const info = isDefault ? getRestaurantDeliveryInfo(restaurantId) : null;
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    // User-owned or geocoded restaurants: use their stored address directly
    if (!isDefault) {
      setAddress(storedAddress ?? null);
      return;
    }
    if (!info?.virtualLat || !info?.virtualLng) return;
    let cancelled = false;
    setAddress(null); // reset when coords change (new delivery location)
    initGeocoder();
    importLibrary('geocoding').then(() => {
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat: info.virtualLat, lng: info.virtualLng } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any[], status: string) => {
          if (!cancelled && status === 'OK' && results?.[0]) {
            setAddress(results[0].formatted_address);
          }
        }
      );
    });
    return () => { cancelled = true; };
  }, [isDefault, storedAddress, info?.virtualLat, info?.virtualLng]);

  if (!address) return null;
  return <span className={className}>{prefix}{address}</span>;
}
