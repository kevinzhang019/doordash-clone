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
  fallback: string;
  className?: string;
}

export default function VirtualRestaurantAddress({ restaurantId, fallback, className }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const info = getRestaurantDeliveryInfo(restaurantId);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (!info?.virtualLat || !info?.virtualLng) return;
    let cancelled = false;
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
  }, [info?.virtualLat, info?.virtualLng]);

  return <span className={className}>{address || fallback}</span>;
}
