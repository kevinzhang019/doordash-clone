'use client';

import { useLocation } from '@/components/providers/LocationProvider';

interface Props {
  restaurantId: number;
  fallbackFee: number;
  fallbackMin: number;
  fallbackMax: number;
}

export default function RestaurantDeliveryStats({ restaurantId, fallbackFee, fallbackMin, fallbackMax }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const info = getRestaurantDeliveryInfo(restaurantId);

  const fee = info?.deliveryFee ?? fallbackFee;
  const min = info?.min ?? fallbackMin;
  const max = info?.max ?? fallbackMax;

  return (
    <>
      <div>
        <p className="font-bold text-gray-900">{min}–{max} min</p>
        <p className="text-xs text-gray-500">Delivery time</p>
      </div>
      <div className="w-px bg-gray-200" />
      <div>
        <p className="font-bold text-gray-900">
          {fee === 0 ? 'Free' : `$${fee.toFixed(2)}`}
        </p>
        <p className="text-xs text-gray-500">Delivery fee</p>
      </div>
    </>
  );
}
