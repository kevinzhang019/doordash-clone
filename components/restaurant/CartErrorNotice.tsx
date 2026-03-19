'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export default function CartErrorNotice() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [removedItems, setRemovedItems] = useState<string[]>([]);

  useEffect(() => {
    const items = searchParams.getAll('removedItem');
    if (items.length > 0) {
      setRemovedItems(items);
      // Strip the params from the URL without triggering navigation
      const params = new URLSearchParams(searchParams.toString());
      params.delete('removedItem');
      const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  }, [searchParams, pathname, router]);

  if (removedItems.length === 0) return null;

  const plural = removedItems.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#FF3008]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          {plural ? 'Items Unavailable' : 'Item Unavailable'}
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          {plural
            ? 'The following items were removed from your cart because the restaurant updated their options:'
            : 'This item was removed from your cart because the restaurant updated its options:'}
        </p>
        <ul className="mb-5 space-y-1">
          {removedItems.map((name, i) => (
            <li key={i} className="text-sm font-semibold text-gray-900 bg-gray-50 rounded-lg px-3 py-2">
              {name}
            </li>
          ))}
        </ul>
        <p className="text-xs text-gray-400 mb-5">Try re-adding {plural ? 'them' : 'it'} to your cart.</p>
        <button
          onClick={() => setRemovedItems([])}
          className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors cursor-pointer"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
