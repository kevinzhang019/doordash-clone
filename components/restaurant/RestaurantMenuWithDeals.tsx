'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MenuItem, Deal } from '@/lib/types';
import { getItemDeal } from '@/lib/dealUtils';
import { useLocation } from '@/components/providers/LocationProvider';
import { useCart } from '@/components/providers/CartProvider';
import MenuSection from '@/components/restaurant/MenuSection';

interface Props {
  menu: Record<string, MenuItem[]>;
  restaurantId: number;
  isAcceptingOrders: boolean;
  isSeeded?: boolean;
  ownerDeals?: Deal[];
}

export default function RestaurantMenuWithDeals({ menu, restaurantId, isAcceptingOrders, isSeeded = false, ownerDeals = [] }: Props) {
  const { deliveryAddress } = useLocation();
  const { cartItems } = useCart();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const categories = Object.keys(menu);
  const allItems = useMemo(() => Object.values(menu).flat(), [menu]);

  const editCartItemId = searchParams.get('editCartItem') ? parseInt(searchParams.get('editCartItem')!) : null;
  const editCartItem = editCartItemId ? cartItems.find(item => item.id === editCartItemId) ?? null : null;

  const handleEditComplete = () => {
    router.replace(pathname, { scroll: false });
  };

  const deals: Deal[] = useMemo(() => {
    if (!isSeeded) return ownerDeals.filter(d => d.is_active);
    if (!deliveryAddress) return [];
    return allItems.flatMap(item => {
      const d = getItemDeal(item.id, deliveryAddress);
      if (!d) return [];
      return [{
        id: -item.id,
        restaurant_id: restaurantId,
        menu_item_id: item.id,
        deal_type: d.deal_type,
        discount_value: d.discount_value,
        is_active: 1,
        created_at: '',
      }];
    });
  }, [allItems, restaurantId, isSeeded, ownerDeals, deliveryAddress]);

  const dealItemIds = useMemo(() => new Set(deals.map(d => d.menu_item_id)), [deals]);
  const featuredItems = useMemo(() => allItems.filter(item => dealItemIds.has(item.id)), [allItems, dealItemIds]);

  // Only one section should trigger the edit expand+scroll — prefer featured if present, else category
  const editMenuItemId = editCartItem?.menu_item_id;
  const editInFeatured = editMenuItemId != null && featuredItems.some(i => i.id === editMenuItemId);

  const editProps = {
    editCartItemId: editCartItem?.id,
    editSelections: editCartItem?.selections,
    editSpecialRequests: editCartItem?.special_requests ?? '',
    onEditComplete: handleEditComplete,
  };

  return (
    <div className="space-y-10 mb-12">
      {!isAcceptingOrders && (
        <div className="bg-gray-100 border border-gray-300 rounded-xl px-4 py-3 text-gray-600 text-sm font-medium">
          This restaurant is not accepting orders right now.
        </div>
      )}

      {featuredItems.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-4 pb-2 border-b-2 border-[#FF3008] flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#FF3008]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <span className="text-[#FF3008]">Featured Deals</span>
          </h2>
          <MenuSection
            items={featuredItems}
            deals={deals}
            isAcceptingOrders={isAcceptingOrders}
            editMenuItemId={editInFeatured ? editMenuItemId : undefined}
            {...(editInFeatured ? editProps : {})}
          />
        </section>
      )}

      {categories.map((category) => {
        const categoryHasEdit = !editInFeatured && editMenuItemId != null && menu[category].some(i => i.id === editMenuItemId);
        return (
          <section key={category}>
            <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              {category}
            </h2>
            <MenuSection
              items={menu[category]}
              deals={deals}
              isAcceptingOrders={isAcceptingOrders}
              editMenuItemId={categoryHasEdit ? editMenuItemId : undefined}
              {...(categoryHasEdit ? editProps : {})}
            />
          </section>
        );
      })}
    </div>
  );
}
