'use client';

import { useEffect, useState } from 'react';
import type { Deal, MenuItem } from '@/lib/types';

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [selectedItemId, setSelectedItemId] = useState('');
  const [dealType, setDealType] = useState<'percentage_off' | 'bogo'>('percentage_off');
  const [discountValue, setDiscountValue] = useState('20');

  const load = async () => {
    const [dealsRes, menuRes] = await Promise.all([
      fetch('/api/restaurant-dashboard/deals'),
      fetch('/api/restaurant-dashboard/menu'),
    ]);
    const dealsData = await dealsRes.json();
    const menuData = await menuRes.json();
    setDeals(dealsData.deals || []);
    setMenuItems((menuData.items || []).filter((i: MenuItem) => i.is_available));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) { setError('Please select a menu item'); return; }
    setError('');
    setSaving(true);
    const res = await fetch('/api/restaurant-dashboard/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_item_id: parseInt(selectedItemId),
        deal_type: dealType,
        discount_value: dealType === 'percentage_off' ? parseFloat(discountValue) : null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || 'Failed to create deal'); } else {
      setSelectedItemId('');
      setDealType('percentage_off');
      setDiscountValue('20');
      await load();
    }
    setSaving(false);
  };

  const handleToggle = async (deal: Deal) => {
    setTogglingId(deal.id);
    await fetch(`/api/restaurant-dashboard/deals/${deal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !deal.is_active }),
    });
    await load();
    setTogglingId(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this deal?')) return;
    setDeletingId(id);
    await fetch(`/api/restaurant-dashboard/deals/${id}`, { method: 'DELETE' });
    await load();
    setDeletingId(null);
  };

  const dealLabel = (deal: Deal) =>
    deal.deal_type === 'bogo' ? 'Buy One Get One Free' : `${deal.discount_value}% Off`;

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-200 rounded-2xl" />
        <div className="h-24 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Deals</h1>
        <p className="text-gray-500 mt-1">Create deals to be featured on the home page.</p>
      </div>

      {/* Add deal form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
        <h2 className="font-semibold text-gray-900 mb-4">Add a New Deal</h2>
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Menu Item</label>
            <select
              value={selectedItemId}
              onChange={e => setSelectedItemId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent bg-white"
            >
              <option value="">Select an item…</option>
              {menuItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} — ${item.price.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Deal Type</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDealType('percentage_off')}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  dealType === 'percentage_off'
                    ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                % Off
              </button>
              <button
                type="button"
                onClick={() => setDealType('bogo')}
                className={`flex-1 py-2.5 px-4 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${
                  dealType === 'bogo'
                    ? 'border-[#FF3008] bg-red-50 text-[#FF3008]'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Buy One Get One
              </button>
            </div>
          </div>

          {dealType === 'percentage_off' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Discount Percentage</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
              </div>
            </div>
          )}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving…' : 'Add Deal'}
          </button>
        </form>
      </div>

      {/* Existing deals */}
      {deals.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-medium text-gray-600">No deals yet</p>
          <p className="text-sm mt-1">Add a deal above to feature it on the home page.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Current Deals</h2>
          {deals.map(deal => (
            <div key={deal.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{deal.menu_item_name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#FF3008] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {dealLabel(deal)}
                  </span>
                  {deal.menu_item_price != null && (
                    <span className="text-gray-400 text-xs">${deal.menu_item_price.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Active toggle */}
                <button
                  onClick={() => handleToggle(deal)}
                  disabled={togglingId === deal.id}
                  title={deal.is_active ? 'Deactivate' : 'Activate'}
                  className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer disabled:opacity-50 ${
                    deal.is_active ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    deal.is_active ? 'translate-x-5' : 'translate-x-1'
                  }`} />
                </button>
                <span className={`text-xs font-medium w-16 ${deal.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {deal.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => handleDelete(deal.id)}
                  disabled={deletingId === deal.id}
                  className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
