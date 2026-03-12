'use client';

import { useLocation } from '@/components/providers/LocationProvider';

interface Props {
  restaurantId: number;
}

export default function RestaurantDistance({ restaurantId }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const info = getRestaurantDeliveryInfo(restaurantId);

  if (!info) return null;

  const { distance } = info;
  return (
    <p className="text-xs text-[#FF3008] font-medium mt-0.5">
      {distance < 0.1 ? 'Less than 0.1 mi away' : `${distance.toFixed(1)} mi away`}
    </p>
  );
}
