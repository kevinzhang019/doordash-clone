'use client';

import { useLocation } from '@/components/providers/LocationProvider';
import RestaurantMap from './RestaurantMap';

interface Props {
  restaurantId: number;
  name: string;
  fallbackLat: number | null;
  fallbackLng: number | null;
}

export default function VirtualRestaurantMap({ restaurantId, name, fallbackLat, fallbackLng }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  // Pass real coords so non-default restaurants are placed at their actual location
  const info = getRestaurantDeliveryInfo(restaurantId, fallbackLat, fallbackLng);

  const lat = info?.virtualLat ?? fallbackLat;
  const lng = info?.virtualLng ?? fallbackLng;

  if (!lat || !lng) return null;

  return <RestaurantMap lat={lat} lng={lng} name={name} />;
}
