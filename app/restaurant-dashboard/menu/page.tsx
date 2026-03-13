'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import MenuItemEditor from '@/components/restaurant-dashboard/MenuItemEditor';
import type { MenuItem } from '@/lib/types';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = async () => {
    const res = await fetch('/api/restaurant-dashboard/menu');
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];
  const existingCategories = Array.from(new Set(items.map(i => i.category)));

  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setDeleting(id);
    await fetch(`/api/restaurant-dashboard/menu/${id}`, { method: 'DELETE' });
    await load();
    setDeleting(null);
  };

  const handleSave = async () => {
    setEditorOpen(false);
    setEditingItem(null);
    await load();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-gray-100" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
        <button
          onClick={() => { setEditingItem(null); setEditorOpen(true); }}
          className="bg-[#FF3008] text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-2 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Item
        </button>
      </div>

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                activeCategory === cat ? 'bg-[#FF3008] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-lg mb-3">No items yet</p>
          <button
            onClick={() => { setEditingItem(null); setEditorOpen(true); }}
            className="text-[#FF3008] font-medium hover:underline cursor-pointer"
          >
            Add your first menu item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map(item => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm flex">
              <div className="relative w-24 flex-shrink-0">
                <Image
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                {!item.is_available && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white text-xs font-medium">Unavailable</span>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                    <p className="text-sm font-semibold text-[#FF3008] mt-1">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => { setEditingItem(item); setEditorOpen(true); }}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deleting === item.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editorOpen && (
        <MenuItemEditor
          item={editingItem}
          existingCategories={existingCategories}
          onSave={handleSave}
          onClose={() => { setEditorOpen(false); setEditingItem(null); }}
        />
      )}
    </div>
  );
}
