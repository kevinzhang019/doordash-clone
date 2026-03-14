'use client';

import { useEffect, useState, useRef } from 'react';
import type { MenuItem, MenuItemOptionGroup, MenuItemOption } from '@/lib/types';

export interface SelectionDraft {
  option_id: number;
  name: string;
  price_modifier: number;
}

interface ItemCustomizationModalProps {
  item: MenuItem;
  onClose: () => void;
  onAddToCart: (selections: SelectionDraft[]) => Promise<void>;
}

export default function ItemCustomizationModal({ item, onClose, onAddToCart }: ItemCustomizationModalProps) {
  const [groups, setGroups] = useState<MenuItemOptionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [selected, setSelected] = useState<Map<number, SelectionDraft[]>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/menu-items/${item.id}/option-groups`)
      .then(r => r.json())
      .then(d => {
        setGroups(d.groups || []);
        setLoadingGroups(false);
      })
      .catch(() => setLoadingGroups(false));
  }, [item.id]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const toggleOption = (group: MenuItemOptionGroup, option: MenuItemOption) => {
    setSelected(prev => {
      const next = new Map(prev);
      const current = next.get(group.id) || [];
      const sel: SelectionDraft = { option_id: option.id, name: option.name, price_modifier: option.price_modifier };

      if (group.max_selections === 1) {
        // Radio behavior: replace selection
        const alreadySelected = current.some(s => s.option_id === option.id);
        next.set(group.id, alreadySelected ? [] : [sel]);
      } else {
        // Checkbox behavior
        const idx = current.findIndex(s => s.option_id === option.id);
        if (idx >= 0) {
          next.set(group.id, current.filter((_, i) => i !== idx));
        } else {
          const limit = group.max_selections;
          if (limit && current.length >= limit) return prev; // at limit
          next.set(group.id, [...current, sel]);
        }
      }
      return next;
    });
  };

  const isSelected = (groupId: number, optionId: number) => {
    return (selected.get(groupId) || []).some(s => s.option_id === optionId);
  };

  const selectionTotal = Array.from(selected.values())
    .flat()
    .reduce((sum, s) => sum + s.price_modifier, 0);

  const effectivePrice = item.price + selectionTotal;

  const unfilledRequired = groups.filter(g => g.required && !(selected.get(g.id)?.length));

  const handleSubmit = async () => {
    if (unfilledRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    const allSelections = Array.from(selected.values()).flat();
    await onAddToCart(allSelections);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div
        ref={modalRef}
        className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl sm:mx-4 rounded-t-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-gray-900 truncate">{item.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Base price: ${item.price.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loadingGroups ? (
            <div className="space-y-3">
              {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : groups.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No customization options available.</p>
          ) : (
            groups.map(group => {
              const groupSels = selected.get(group.id) || [];
              const isRequiredAndEmpty = showErrors && group.required && groupSels.length === 0;
              const isRadio = group.max_selections === 1;

              return (
                <div key={group.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className={`font-semibold text-sm ${isRequiredAndEmpty ? 'text-red-600' : 'text-gray-900'}`}>
                      {group.name}
                    </h3>
                    {group.required && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isRequiredAndEmpty ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        Required
                      </span>
                    )}
                    {group.max_selections && group.max_selections > 1 && (
                      <span className="text-xs text-gray-400">Up to {group.max_selections}</span>
                    )}
                  </div>
                  {isRequiredAndEmpty && (
                    <p className="text-xs text-red-500 mb-2">Please make a selection</p>
                  )}
                  <div className="space-y-1.5">
                    {(group.options || []).map(option => {
                      const checked = isSelected(group.id, option.id);
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => toggleOption(group, option)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors cursor-pointer text-left ${
                            checked
                              ? 'border-[#FF3008] bg-red-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          } ${isRequiredAndEmpty ? 'border-red-200' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-4 h-4 flex-shrink-0 flex items-center justify-center rounded-full border-2 ${
                              checked ? 'border-[#FF3008] bg-[#FF3008]' : 'border-gray-300'
                            } ${!isRadio ? 'rounded' : ''}`}>
                              {checked && (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <span className={checked ? 'text-gray-900 font-medium' : 'text-gray-700'}>{option.name}</span>
                          </div>
                          {option.price_modifier !== 0 && (
                            <span className={`text-sm font-medium ${checked ? 'text-[#FF3008]' : 'text-gray-500'}`}>
                              {option.price_modifier > 0 ? '+' : ''}${option.price_modifier.toFixed(2)}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4 flex-shrink-0">
          {selectionTotal > 0 && (
            <div className="flex justify-between text-sm text-gray-600 mb-3">
              <span>Total</span>
              <span className="font-semibold text-gray-900">${effectivePrice.toFixed(2)}</span>
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full bg-[#FF3008] text-white font-semibold py-3 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Adding...' : `Add to Cart • $${effectivePrice.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
