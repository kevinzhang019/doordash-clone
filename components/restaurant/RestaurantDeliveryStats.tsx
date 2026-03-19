'use client';

import { useLocation } from '@/components/providers/LocationProvider';
import { useDashPass } from '@/lib/useDashPass';

interface Props {
  restaurantId: number;
  restaurantLat?: number | null;
  restaurantLng?: number | null;
  fallbackFee: number;
  fallbackMin: number;
  fallbackMax: number;
}

export default function RestaurantDeliveryStats({ restaurantId, restaurantLat, restaurantLng, fallbackFee, fallbackMin, fallbackMax }: Props) {
  const { getRestaurantDeliveryInfo } = useLocation();
  const { hasDashPass } = useDashPass();
  const info = getRestaurantDeliveryInfo(restaurantId, restaurantLat, restaurantLng);

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
        {hasDashPass ? (
          <>
            <p className="font-bold text-[#FF3008]">
              Free
              {fee > 0 && <span className="ml-1 line-through text-gray-400 text-sm font-normal">${fee.toFixed(2)}</span>}
            </p>
            <p className="text-xs text-[#FF3008] font-medium">PassDash</p>
          </>
        ) : (
          <>
            <p className="font-bold text-gray-900">
              {fee === 0 ? <span className="text-green-600">Free</span> : `$${fee.toFixed(2)}`}
              <span className="ml-1 text-xs font-normal text-gray-500">Delivery</span>
            </p>
            {fee > 0 && <p className="text-xs text-[#FF3008] mt-0.5">Free with PassDash</p>}
          </>
        )}
      </div>
    </>
  );
}
