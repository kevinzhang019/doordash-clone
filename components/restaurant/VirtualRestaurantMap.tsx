'use client';

import { useEffect, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useLocation } from '@/components/providers/LocationProvider';
import RestaurantMap from './RestaurantMap';

interface Props {
  restaurantId: number;
  name: string;
  fallbackLat: number | null;
  fallbackLng: number | null;
  isOwned?: boolean;
  storedAddress?: string | null;
}

let geocoderInitialized = false;
function initGeocoder() {
  if (!geocoderInitialized) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '' });
    geocoderInitialized = true;
  }
}

export default function VirtualRestaurantMap({ restaurantId, name, fallbackLat, fallbackLng, isOwned = false, storedAddress }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const [geocodedCoords, setGeocodedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // For owned restaurants without real coords, geocode the stored address
  useEffect(() => {
    if (!isOwned || fallbackLat != null || !storedAddress) return;
    let cancelled = false;
    initGeocoder();
    importLibrary('geocoding').then(() => {
      if (cancelled) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: storedAddress },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (results: any[], status: string) => {
          if (!cancelled && status === 'OK' && results?.[0]) {
            const loc = results[0].geometry.location;
            setGeocodedCoords({ lat: loc.lat(), lng: loc.lng() });
          }
        }
      );
    });
    return () => { cancelled = true; };
  }, [isOwned, fallbackLat, storedAddress]);

  // For owned restaurants without real coords, don't use virtual placement
  const info = isOwned && fallbackLat == null ? null : getRestaurantDeliveryInfo(restaurantId, fallbackLat, fallbackLng);

  const lat = fallbackLat ?? geocodedCoords?.lat ?? info?.virtualLat ?? null;
  const lng = fallbackLng ?? geocodedCoords?.lng ?? info?.virtualLng ?? null;

  if (!lat || !lng) return null;

  return <RestaurantMap lat={lat} lng={lng} name={name} />;
}
