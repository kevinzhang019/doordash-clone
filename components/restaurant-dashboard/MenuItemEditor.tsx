'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import OptionGroupEditor, { type OptionGroupDraft } from './OptionGroupEditor';
import type { MenuItem } from '@/lib/types';

interface MenuItemEditorProps {
  item?: MenuItem | null;
  existingCategories: string[];
  onSave: () => void;
  onClose: () => void;
  variant?: 'panel' | 'inline';
}

export default function MenuItemEditor({ item, existingCategories, onSave, onClose, variant = 'panel' }: MenuItemEditorProps) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [categoryInput, setCategoryInput] = useState(item?.category || '');
  const [description, setDescription] = useState(item?.description || '');
  const [price, setPrice] = useState(item?.price?.toString() || '');
  const [imageUrl, setImageUrl] = useState(item?.image_url || '');
  const [isAvailable, setIsAvailable] = useState(item ? Boolean(item.is_available) : true);
  const [groups, setGroups] = useState<OptionGroupDraft[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groupError, setGroupError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/restaurant-dashboard/image-upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Upload failed');
      } else {
        const data = await res.json();
        setImageUrl(data.imageUrl);
      }
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  useEffect(() => {
    if (item) {
      fetch(`/api/restaurant-dashboard/menu/${item.id}/option-groups`)
        .then(r => r.json())
        .then(d => {
          const rawGroups = d.groups || [];
          setGroups(rawGroups.map((g: { id: number; name: string; required: number; max_selections: number | null; selection_type?: string; options?: { id: number; name: string; price_modifier: number }[] }) => ({
            id: g.id,
            name: g.name,
            required: Boolean(g.required),
            max_selections: g.max_selections,
            selection_type: (g.selection_type === 'quantity' ? 'quantity' : 'check') as 'check' | 'quantity',
            options: (g.options || []).map((o: { id: number; name: string; price_modifier: number }) => ({ id: o.id, name: o.name, price_modifier: o.price_modifier })),
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

  const formFields = (
    <>
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Image <span className="text-gray-400 font-normal">(optional)</span></label>
        <div className="relative mt-1 mb-2 w-full h-32 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt="preview"
              fill
              className="object-cover"
              unoptimized
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageUpload}
          disabled={uploadingImage}
          className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FF3008] file:text-white hover:file:bg-red-600 file:cursor-pointer border border-gray-200 rounded-xl px-3 py-2 focus:outline-none disabled:opacity-50"
        />
        {uploadingImage && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
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
    </>
  );

  if (variant === 'inline') {
    return (
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 border-t border-gray-100 bg-gray-50">
        {formFields}
      </form>
    );
  }

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
          {formFields}
        </form>
      </div>
    </div>
  );
}
