'use client';

import { useMemo } from 'react';
import { MenuItem, Deal } from '@/lib/types';
import { useLocation } from '@/components/providers/LocationProvider';
import { getAddressDeal, seededRng, dealLabel } from '@/lib/dealUtils';
import MenuSection from '@/components/restaurant/MenuSection';

interface Props {
  menu: Record<string, MenuItem[]>;
  restaurantId: number;
}

export default function RestaurantMenuWithDeals({ menu, restaurantId }: Props) {
  const { deliveryAddress } = useLocation();
  const categories = Object.keys(menu);

  const { deal, featuredItem } = useMemo(() => {
    if (!deliveryAddress) return { deal: null, featuredItem: null };
    const addressDeal = getAddressDeal(deliveryAddress, restaurantId);
    if (!addressDeal) return { deal: null, featuredItem: null };

    const allItems = Object.values(menu).flat();
    if (allItems.length === 0) return { deal: null, featuredItem: null };

    // Pick a featured item deterministically based on address + restaurant
    const rng = seededRng(`${deliveryAddress}|${restaurantId}|featured`);
    const featured = allItems[Math.floor(rng() * allItems.length)];
    return { deal: addressDeal, featuredItem: featured };
  }, [deliveryAddress, restaurantId, menu]);

  // Build a Deal-shaped object so MenuSection/MenuItemCard can consume it
  const dealRecord: Deal | null = deal && featuredItem
    ? {
        id: -1,
        restaurant_id: restaurantId,
        menu_item_id: featuredItem.id,
        deal_type: deal.deal_type,
        discount_value: deal.discount_value,
        is_active: 1,
        created_at: '',
      }
    : null;

  const deals = dealRecord ? [dealRecord] : [];

  return (
    <div className="space-y-10 mb-12">
      {/* Featured Deals section */}
      {dealRecord && featuredItem && (
        <section>
          <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-[#FF3008] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF3008]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-[#FF3008]">
              Today&apos;s Deal — {dealLabel(deal!)}
            </span>
          </h2>
          <MenuSection items={[featuredItem]} deals={deals} />
        </section>
      )}

      {/* Regular menu */}
      {categories.map((category) => (
        <section key={category}>
          <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            {category}
          </h2>
          <MenuSection items={menu[category]} deals={deals} />
        </section>
      ))}
    </div>
  );
}
