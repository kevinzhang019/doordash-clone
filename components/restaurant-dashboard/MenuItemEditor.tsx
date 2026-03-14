'use client';

import { useState, useEffect } from 'react';
import OptionGroupEditor, { type OptionGroupDraft } from './OptionGroupEditor';
import type { MenuItem } from '@/lib/types';

interface MenuItemEditorProps {
  item?: MenuItem | null;
  existingCategories: string[];
  onSave: () => void;
  onClose: () => void;
}

export default function MenuItemEditor({ item, existingCategories, onSave, onClose }: MenuItemEditorProps) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [categoryInput, setCategoryInput] = useState(item?.category || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [isAvailable, setIsAvailable] = useState(item ? Boolean(item.is_available) : true);
  const [groups, setGroups] = useState<OptionGroupDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupError, setGroupError] = useState('');

  useEffect(() => {
    if (item) {
      fetch(`/api/restaurant-dashboard/menu/${item.id}/option-groups`)
        .then(r => r.json())
        .then(d => {
          const rawGroups = d.groups || [];
          setGroups(rawGroups.map((g: { name: string; required: number; max_selections: number | null; options?: { name: string; price_modifier: number }[] }) => ({
            name: g.name,
            required: Boolean(g.required),
            max_selections: g.max_selections,
            options: (g.options || []).map((o: { name: string; price_modifier: number }) => ({ name: o.name, price_modifier: o.price_modifier })),
          })));
        })
        .catch(() => {});
    }
  }, [item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setGroupError('');
    const finalCategory = categoryInput.trim() || category;
    if (!finalCategory) {
      setError('Category is required');
      return;
    }
    const unnamedModifiedGroup = groups.find(
      g => !g.name.trim() && (g.options.length > 0 || g.required || g.max_selections !== null)
    );
    if (unnamedModifiedGroup) {
      setGroupError('All modified option groups must have a name');
      return;
    }
    setLoading(true);

    const body = {
      name: name.trim(),
      category: finalCategory,
      description: description.trim(),
      price: parseFloat(price),
      image_url: imageUrl.trim(),
      is_available: isAvailable,
      allow_special_requests: true,
    };

    try {
      let itemId: number;
      if (item) {
        const res = await fetch(`/api/restaurant-dashboard/menu/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        itemId = item.id;
      } else {
        const res = await fetch('/api/restaurant-dashboard/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        itemId = data.item.id;
      }

      // Save option groups
      await fetch(`/api/restaurant-dashboard/menu/${itemId}/option-groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups }),
      });

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-md bg-white h-full overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{item ? 'Edit Item' : 'Add Item'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              placeholder="e.g. Margherita Pizza"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
            <input
              type="text"
              required
              value={categoryInput}
              onChange={e => setCategoryInput(e.target.value)}
              list="category-suggestions"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              placeholder="e.g. Appetizers"
            />
            <datalist id="category-suggestions">
              {existingCategories.map(c => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent resize-none"
              placeholder="Briefly describe the item..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              placeholder="https://..."
            />
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt="preview"
                className="mt-2 w-full h-28 object-cover rounded-lg border border-gray-200"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={e => setIsAvailable(e.target.checked)}
                className="w-4 h-4 accent-[#FF3008]"
              />
              <span className="text-sm text-gray-700">Available</span>
            </label>
          </div>

          {groupError && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">{groupError}</div>
          )}
          <OptionGroupEditor groups={groups} onChange={setGroups} />

          <div className="flex gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
