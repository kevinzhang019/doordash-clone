'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import MenuItemEditor from '@/components/restaurant-dashboard/MenuItemEditor';
import type { MenuItem } from '@/lib/types';

export default function MenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [deleting, setDeleting] = useState<number | null>(null);
  const [togglingAvailable, setTogglingAvailable] = useState<number | null>(null);
  const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

  const cardRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const pendingScrollRef = useRef<number | null>(null);

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

  const handleToggleExpand = (itemId: number) => {
    if (expandedItemId === itemId) {
      setExpandedItemId(null);
    } else {
      setExpandedItemId(itemId);
      pendingScrollRef.current = itemId;
    }
  };

  const handleExpandAnimationComplete = (itemId: number) => {
    if (pendingScrollRef.current !== itemId) return;
    pendingScrollRef.current = null;
    const el = cardRefs.current.get(itemId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    if (rect.height >= viewportHeight) {
      el.scrollIntoView({ block: 'start', behavior: 'smooth' });
    } else if (rect.bottom > viewportHeight) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    setDeleting(id);
    if (expandedItemId === id) setExpandedItemId(null);
    await fetch(`/api/restaurant-dashboard/menu/${id}`, { method: 'DELETE' });
    await load();
    setDeleting(null);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    setTogglingAvailable(item.id);
    const newVal = !item.is_available;
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: newVal ? 1 : 0 } : i));
    await fetch(`/api/restaurant-dashboard/menu/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_available: newVal }),
    });
    setTogglingAvailable(null);
  };

  const handleSave = async () => {
    setEditorOpen(false);
    setExpandedItemId(null);
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
          onClick={() => setEditorOpen(true)}
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
            onClick={() => setEditorOpen(true)}
            className="text-[#FF3008] font-medium hover:underline cursor-pointer"
          >
            Add your first menu item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start">
          {filtered.map(item => {
            const isExpanded = expandedItemId === item.id;
            return (
              <div
                key={item.id}
                ref={el => { if (el) cardRefs.current.set(item.id, el); else cardRefs.current.delete(item.id); }}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-opacity ${item.is_available ? 'border-gray-100 opacity-100' : 'border-gray-100 opacity-50'}`}
              >
                {/* Card header — click anywhere to expand/collapse */}
                <div
                  className="flex cursor-pointer"
                  onClick={() => handleToggleExpand(item.id)}
                >
                  <div className="relative w-24 flex-shrink-0">
                    <Image
                      src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                        <p className="text-sm font-semibold text-[#FF3008] mt-1">${item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 items-center">
                        {/* Chevron */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {/* Availability toggle */}
                        <button
                          onClick={e => { e.stopPropagation(); handleToggleAvailable(item); }}
                          disabled={togglingAvailable === item.id}
                          title={item.is_available ? 'Mark unavailable' : 'Mark available'}
                          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                            item.is_available
                              ? 'text-[#FF3008] hover:text-red-600 hover:bg-red-50'
                              : 'text-gray-300 hover:text-[#FF3008] hover:bg-red-50'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
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
                    <p className="text-xs text-gray-500 mt-1 truncate">{item.description || '\u00A0'}</p>
                  </div>
                </div>

                {/* Animated inline editor */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 240, damping: 30, mass: 1.2 }}
                      style={{ overflow: 'hidden' }}
                      onAnimationComplete={() => handleExpandAnimationComplete(item.id)}
                    >
                      <MenuItemEditor
                        variant="inline"
                        item={item}
                        existingCategories={existingCategories}
                        onSave={handleSave}
                        onClose={() => setExpandedItemId(null)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Side panel for Add Item */}
      {editorOpen && (
        <MenuItemEditor
          item={null}
          existingCategories={existingCategories}
          onSave={handleSave}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
