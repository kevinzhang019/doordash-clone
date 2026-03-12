'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MenuItem } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';
import { useAuth } from '@/components/providers/AuthProvider';

interface MenuItemCardProps {
  item: MenuItem;
}

export default function MenuItemCard({ item }: MenuItemCardProps) {
  const { user } = useAuth();
  const { addItem, openSidebar } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    setLoading(true);
    setConflictError(null);

    const result = await addItem(item.id);
    setLoading(false);

    if (result.conflictingRestaurant) {
      setConflictError(`Your cart has items from ${result.conflictingRestaurant}. Clear cart to add this item?`);
      return;
    }

    if (result.error) {
      alert(result.error);
      return;
    }

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{item.name}</h4>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{item.description}</p>
          <p className="text-gray-900 font-bold mt-2">${item.price.toFixed(2)}</p>

          {conflictError && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-xs">{conflictError}</p>
              <button
                onClick={() => setConflictError(null)}
                className="text-yellow-600 text-xs underline mt-1"
              >
                Dismiss
              </button>
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
  );
}
