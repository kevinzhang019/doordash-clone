'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import ItemCustomizationModal, { type SelectionDraft } from './ItemCustomizationModal';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { user } = useAuth();
  const { addItem, clearCartAndAdd, openSidebar } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [conflictingRestaurant, setConflictingRestaurant] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const doAddToCart = async (selections: SelectionDraft[] = []) => {
    const result = await addItem(item.id, selections);
    if (result.conflictingRestaurant) {
      setConflictingRestaurant(result.conflictingRestaurant);
      return false;
    }
    if (result.error) {
      alert(result.error);
      return false;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    openSidebar();
    return true;
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setConflictingRestaurant(null);

    // Check if item has option groups
    try {
      const res = await fetch(`/api/menu-items/${item.id}/option-groups`);
      const data = await res.json();
      if (data.groups?.length > 0) {
        setLoading(false);
        setShowModal(true);
        return;
      }
    } catch {
      // fall through to simple add
    }

    await doAddToCart([]);
    setLoading(false);
  };

  const handleModalAdd = async (selections: SelectionDraft[]) => {
    const ok = await doAddToCart(selections);
    if (ok) setShowModal(false);
  };

  const handleClearAndAdd = async () => {
    setLoading(true);
    setConflictingRestaurant(null);
    const result = await clearCartAndAdd(item.id);
    setLoading(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-4 p-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900">{item.name}</h4>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
            <p className="text-gray-900 font-bold mt-2">${item.price.toFixed(2)}</p>

            {conflictingRestaurant && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-xs font-medium mb-2">
                  Your cart has items from {conflictingRestaurant}.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAndAdd}
                    className="flex-1 bg-[#FF3008] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer"
                  >
                    Clear cart & add
                  </button>
                  <button
                    onClick={() => setConflictingRestaurant(null)}
                    className="flex-1 bg-white text-gray-600 text-xs font-semibold py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Keep current
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <button
              onClick={handleAddToCart}
              disabled={loading}
              className={`w-24 py-1.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                added
                  ? 'bg-green-500 text-white'
                  : 'bg-[#FF3008] text-white hover:bg-red-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? '...' : added ? 'Added!' : 'Add'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <ItemCustomizationModal
          item={item}
          onClose={() => setShowModal(false)}
          onAddToCart={handleModalAdd}
        />
      )}
    </>
  );
}
