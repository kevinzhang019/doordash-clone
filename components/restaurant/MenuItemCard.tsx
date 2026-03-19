'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { MenuItem, MenuItemOptionGroup, MenuItemOption, Deal, CartItemSelection } from '@/lib/types';
import { useCart } from '@/components/providers/CartProvider';

interface SelectionDraft {
  option_id: number;
  name: string;
  price_modifier: number;
  quantity: number;
  group_name?: string;
}

interface MenuItemCardProps {
  item: MenuItem;
  isExpanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  deal?: Deal | null;
  isAcceptingOrders?: boolean;
  editCartItemId?: number;
  initialSelections?: CartItemSelection[];
  initialSpecialRequests?: string;
  onEditComplete?: () => void;
}

function getDealLabel(deal: Deal): string {
  if (deal.deal_type === 'bogo') return 'BOGO';
  if (deal.deal_type === 'percentage_off' && deal.discount_value) return `${deal.discount_value}% Off`;
  return '';
}

const ANIM_MS = 300;

export default function MenuItemCard({ item, isExpanded, onExpand, onCollapse, deal, isAcceptingOrders = true, editCartItemId, initialSelections, initialSpecialRequests, onEditComplete }: MenuItemCardProps) {
  const { addItem, clearCartAndAdd, updateCartItemSelections } = useCart();

  const cardRef = useRef<HTMLDivElement>(null);
  const savedScrollY = useRef(0);
  const restoreScrollOnClose = useRef(false);

  const [groups, setGroups] = useState<MenuItemOptionGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [selected, setSelected] = useState<Map<number, SelectionDraft[]>>(new Map());
  // For quantity-based groups: Map<groupId, Map<optionId, quantity>>
  const [qtySelections, setQtySelections] = useState<Map<number, Map<number, number>>>(new Map());
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictingRestaurant, setConflictingRestaurant] = useState<string | null>(null);
  const [specialRequests, setSpecialRequests] = useState('');
  // isClosing stays true for ANIM_MS after isExpanded goes false so the exit animation plays
  const [isClosing, setIsClosing] = useState(false);
  const didPrePopulateRef = useRef(false);

  // Panel is visible when expanded or mid-close-animation
  const showPanel = isExpanded || isClosing;
  // Grid row is open when expanded but NOT closing
  const panelOpen = isExpanded && !isClosing;

  // Drive close animation whenever isExpanded flips false
  const prevExpandedRef = useRef(false);
  useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    prevExpandedRef.current = isExpanded;
    if (wasExpanded && !isExpanded) {
      setShowErrors(false);
      setIsClosing(true);
      didPrePopulateRef.current = false;
      // Scroll back simultaneously with the close animation (only when explicitly cancelled/added)
      if (restoreScrollOnClose.current) {
        restoreScrollOnClose.current = false;
        window.scrollTo({ top: savedScrollY.current, behavior: 'smooth' });
      }
      const t = setTimeout(() => setIsClosing(false), ANIM_MS);
      return () => clearTimeout(t);
    }
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    setLoadingGroups(true);
    fetch(`/api/menu-items/${item.id}/option-groups`)
      .then(r => r.json())
      .then(d => setGroups(d.groups || []))
      .catch(() => {})
      .finally(() => setLoadingGroups(false));
  }, [isExpanded, item.id]);

  // Pre-populate selections when editing an existing cart item
  useEffect(() => {
    if (!isExpanded || !editCartItemId || !initialSelections || groups.length === 0 || didPrePopulateRef.current) return;
    didPrePopulateRef.current = true;

    const newSelected = new Map<number, SelectionDraft[]>();
    const newQtySelections = new Map<number, Map<number, number>>();

    for (const group of groups) {
      if (group.selection_type === 'quantity') {
        const qtyMap = new Map<number, number>();
        for (const sel of initialSelections) {
          if (!sel.option_id) continue;
          const opt = group.options?.find(o => o.id === sel.option_id);
          if (opt) qtyMap.set(opt.id, sel.quantity ?? 1);
        }
        if (qtyMap.size > 0) newQtySelections.set(group.id, qtyMap);
      } else {
        const groupSels: SelectionDraft[] = [];
        for (const sel of initialSelections) {
          if (!sel.option_id) continue;
          const opt = group.options?.find(o => o.id === sel.option_id);
          if (opt) groupSels.push({ option_id: opt.id, name: opt.name, price_modifier: opt.price_modifier, quantity: 1, group_name: group.name });
        }
        if (groupSels.length > 0) newSelected.set(group.id, groupSels);
      }
    }

    setSelected(newSelected);
    setQtySelections(newQtySelections);
    setSpecialRequests(initialSpecialRequests ?? '');
  }, [isExpanded, editCartItemId, groups, initialSelections, initialSpecialRequests]);

  const handleAddClick = () => {
    if (!isAcceptingOrders) return;
    savedScrollY.current = window.scrollY;
    setSelected(new Map());
    setQtySelections(new Map());
    setShowErrors(false);
    setConflictingRestaurant(null);
    setSpecialRequests('');
    onExpand();
    // Scroll card into position simultaneously with the expand animation
    requestAnimationFrame(() => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const targetY = window.scrollY + rect.top - 80; // 80px from top for navbar clearance
        if (targetY < window.scrollY) {
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }
    });
    // After animation completes, scroll down if the expanded card is out of view
    setTimeout(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const viewportH = window.innerHeight;
      const navbarH = 80;
      if (rect.height > viewportH - navbarH) {
        // Card taller than viewport — scroll to top of card
        const targetY = window.scrollY + rect.top - navbarH;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      } else if (rect.bottom > viewportH) {
        // Bottom cut off — scroll down to reveal it with a bit of padding
        const targetY = window.scrollY + (rect.bottom - viewportH) + 16;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
    }, ANIM_MS);
  };

  // Collapse with scroll-back (used for explicit cancel / add-to-cart)
  const collapseWithScroll = () => {
    restoreScrollOnClose.current = true;
    onCollapse(); // triggers isExpanded→false → useEffect plays close animation + scroll
  };

  const toggleOption = (group: MenuItemOptionGroup, option: MenuItemOption) => {
    setSelected(prev => {
      const next = new Map(prev);
      const current = next.get(group.id) || [];
      const sel: SelectionDraft = { option_id: option.id, name: option.name, price_modifier: option.price_modifier, quantity: 1, group_name: group.name };

      if (group.max_selections === 1) {
        const alreadySelected = current.some(s => s.option_id === option.id);
        next.set(group.id, alreadySelected ? [] : [sel]);
      } else {
        const idx = current.findIndex(s => s.option_id === option.id);
        if (idx >= 0) {
          next.set(group.id, current.filter((_, i) => i !== idx));
        } else {
          const limit = group.max_selections;
          if (limit && current.length >= limit) return prev;
          next.set(group.id, [...current, sel]);
        }
      }
      return next;
    });
  };

  const updateQtyOption = (group: MenuItemOptionGroup, option: MenuItemOption, delta: number) => {
    setQtySelections(prev => {
      const next = new Map(prev);
      const groupMap = new Map(next.get(group.id) || []);
      const current = groupMap.get(option.id) || 0;
      const newQty = Math.max(0, current + delta);

      // Enforce max total
      if (delta > 0 && group.max_selections) {
        const currentTotal = Array.from(groupMap.values()).reduce((s, v) => s + v, 0);
        if (currentTotal >= group.max_selections) return prev;
      }

      if (newQty === 0) {
        groupMap.delete(option.id);
      } else {
        groupMap.set(option.id, newQty);
      }
      next.set(group.id, groupMap);
      return next;
    });
  };

  const isSelected = (groupId: number, optionId: number) =>
    (selected.get(groupId) || []).some(s => s.option_id === optionId);

  // Price from check-based selections
  const checkSelTotal = Array.from(selected.values()).flat().reduce((sum, s) => sum + s.price_modifier, 0);
  // Price from quantity-based selections
  const qtySelTotal = groups
    .filter(g => g.selection_type === 'quantity')
    .reduce((sum, g) => {
      const groupMap = qtySelections.get(g.id);
      if (!groupMap) return sum;
      for (const [optId, qty] of groupMap) {
        const opt = g.options?.find(o => o.id === optId);
        if (opt) sum += opt.price_modifier * qty;
      }
      return sum;
    }, 0);
  const selectionTotal = checkSelTotal + qtySelTotal;
  const effectivePrice = item.price + selectionTotal;

  const unfilledRequired = groups.filter(g => {
    if (!g.required) return false;
    if (g.selection_type === 'quantity') {
      const groupMap = qtySelections.get(g.id);
      const total = groupMap ? Array.from(groupMap.values()).reduce((s, v) => s + v, 0) : 0;
      return total === 0;
    }
    return !(selected.get(g.id)?.length);
  });

  const buildAllSelections = (): SelectionDraft[] => {
    const checkSels = Array.from(selected.values()).flat();
    const qtySels: SelectionDraft[] = [];
    for (const group of groups) {
      if (group.selection_type !== 'quantity') continue;
      const groupMap = qtySelections.get(group.id);
      if (!groupMap) continue;
      for (const [optId, qty] of groupMap) {
        if (qty <= 0) continue;
        const opt = group.options?.find(o => o.id === optId);
        if (opt) {
          qtySels.push({ option_id: opt.id, name: opt.name, price_modifier: opt.price_modifier, quantity: qty, group_name: group.name });
        }
      }
    }
    return [...checkSels, ...qtySels];
  };

  const handleAddToCart = async () => {
    if (unfilledRequired.length > 0) { setShowErrors(true); return; }
    setSubmitting(true);
    const allSelections = buildAllSelections();
    const result = await addItem(item.id, allSelections, specialRequests);
    setSubmitting(false);
    if (result.conflictingRestaurant) {
      setConflictingRestaurant(result.conflictingRestaurant);
      return;
    }
    if (result.error) { alert(result.error); return; }
    collapseWithScroll();
  };

  const handleClearAndAdd = async () => {
    setSubmitting(true);
    const allSelections = buildAllSelections();
    await clearCartAndAdd(item.id, allSelections, specialRequests);
    setSubmitting(false);
    collapseWithScroll();
  };

  const handleUpdateCart = async () => {
    if (unfilledRequired.length > 0) { setShowErrors(true); return; }
    if (!editCartItemId) return;
    setSubmitting(true);
    const allSelections = buildAllSelections();
    const result = await updateCartItemSelections(editCartItemId, allSelections, specialRequests);
    setSubmitting(false);
    if (result.error) { alert(result.error); return; }
    onEditComplete?.();
    collapseWithScroll();
  };

  return (
    <div
      ref={cardRef}
      onClick={!isExpanded && !isClosing && isAcceptingOrders ? handleAddClick : undefined}
      className={`bg-white rounded-xl border overflow-hidden transition-[box-shadow,border-color] duration-200 ${
        showErrors && unfilledRequired.length > 0
          ? 'border-[#FF3008]/40 shadow-[0_0_0_3px_rgba(255,48,8,0.15),0_4px_16px_rgba(255,48,8,0.25)]'
          : isExpanded
          ? 'border-[#FF3008]/30 shadow-md'
          : isAcceptingOrders
          ? 'border-gray-100 shadow-sm hover:shadow-md cursor-pointer'
          : 'border-gray-100 shadow-sm opacity-60'
      }`}
    >
      {/* Item header row */}
      <div className="flex gap-4 p-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900">{item.name}</h4>
          <p className={`text-gray-500 text-sm mt-1 ${isExpanded ? '' : 'line-clamp-2'}`}>{item.description}</p>
          {deal && deal.deal_type === 'percentage_off' && deal.discount_value ? (
            <div className="flex items-center gap-1.5 mt-2">
              <p className="text-gray-400 line-through text-sm">${item.price.toFixed(2)}</p>
              <p className="text-[#FF3008] font-bold">${(item.price * (1 - deal.discount_value / 100)).toFixed(2)}</p>
            </div>
          ) : (
            <p className="text-gray-900 font-bold mt-2">${effectivePrice.toFixed(2)}</p>
          )}
          {deal && deal.deal_type === 'bogo' && (
            <p className="text-[#FF3008] text-xs font-semibold mt-1">Buy 1 get 1 free</p>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden">
            <Image src={item.image_url} alt={item.name} fill sizes="96px" className="object-cover" loading="lazy" />
            {deal && (
              <div className="absolute bottom-0 left-0 right-0 bg-[#FF3008] text-white text-[10px] font-bold px-1 py-0.5 text-center leading-tight">
                {getDealLabel(deal)}
              </div>
            )}
          </div>
          {!isExpanded && (
            <button
              onClick={e => { e.stopPropagation(); handleAddClick(); }}
              disabled={!isAcceptingOrders}
              className="w-24 py-1.5 rounded-lg text-sm font-semibold bg-[#FF3008] text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* Animated expanded panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateRows: panelOpen ? '1fr' : '0fr',
          transition: `grid-template-rows ${ANIM_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        <div style={{ overflow: 'hidden' }}>
          {showPanel && (
            <div className="border-t border-gray-100 px-4 pb-4" onClick={e => e.stopPropagation()}>
              {/* Edit mode banner */}
              {editCartItemId && (
                <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-blue-700 text-xs font-semibold">Editing your cart item</p>
                </div>
              )}
              {/* Deal banner inside expanded panel */}
              {deal && (
                <div className="mt-3 bg-red-50 border border-[#FF3008]/20 rounded-lg px-3 py-2 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#FF3008] flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  <p className="text-[#FF3008] text-xs font-semibold">
                    {deal.deal_type === 'percentage_off' && deal.discount_value
                      ? `${deal.discount_value}% off applied at checkout`
                      : 'Buy 1 get 1 free — discount applied at checkout'}
                  </p>
                </div>
              )}
              {/* Option groups */}
              {loadingGroups ? (
                <div className="space-y-3 mt-4">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : groups.length > 0 ? (
                <div className="mt-4 space-y-5">
                  {groups.map(group => {
                    const isQuantityGroup = group.selection_type === 'quantity';
                    const groupQtyMap = qtySelections.get(group.id);
                    const qtyTotal = groupQtyMap ? Array.from(groupQtyMap.values()).reduce((s, v) => s + v, 0) : 0;
                    const groupSels = selected.get(group.id) || [];
                    const isRequiredAndEmpty = showErrors && group.required && (isQuantityGroup ? qtyTotal === 0 : groupSels.length === 0);
                    const isRadio = !isQuantityGroup && group.max_selections === 1;

                    return (
                      <div key={group.id}>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold text-sm ${isRequiredAndEmpty ? 'text-red-600' : 'text-gray-900'}`}>
                            {group.name}
                          </h3>
                          {group.required ? (
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isRequiredAndEmpty ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                              Required
                            </span>
                          ) : (
                            <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-gray-50 text-gray-400">Optional</span>
                          )}
                          {isQuantityGroup && group.max_selections ? (
                            <span className={`text-xs ${qtyTotal >= group.max_selections ? 'text-[#FF3008] font-semibold' : 'text-gray-400'}`}>
                              {qtyTotal}/{group.max_selections}
                            </span>
                          ) : group.max_selections && group.max_selections > 1 ? (
                            <span className="text-xs text-gray-400">Up to {group.max_selections}</span>
                          ) : null}
                        </div>
                        {isRequiredAndEmpty && (
                          <p className="text-xs text-red-500 mb-2">Please make a selection</p>
                        )}

                        {isQuantityGroup ? (
                          /* Quantity-based group: +/- steppers for each option */
                          <div className="space-y-1.5">
                            {(group.options || []).map(option => {
                              const qty = groupQtyMap?.get(option.id) || 0;
                              const atMax = group.max_selections ? qtyTotal >= group.max_selections : false;
                              return (
                                <div
                                  key={option.id}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                                    qty > 0 ? 'border-[#FF3008] bg-red-50' : isRequiredAndEmpty ? 'border-red-200 bg-white' : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className={qty > 0 ? 'text-gray-900 font-medium' : 'text-gray-700'}>{option.name}</span>
                                    {option.price_modifier !== 0 && (
                                      <span className={`text-xs font-medium ${qty > 0 ? 'text-[#FF3008]' : 'text-gray-500'}`}>
                                        {option.price_modifier > 0 ? '+' : ''}${option.price_modifier.toFixed(2)} ea
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => updateQtyOption(group, option, -1)}
                                      disabled={qty === 0}
                                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-base transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      −
                                    </button>
                                    <span className={`w-5 text-center text-sm font-bold tabular-nums ${qty > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateQtyOption(group, option, 1)}
                                      disabled={atMax}
                                      className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-50 hover:text-[#FF3008] flex items-center justify-center text-gray-700 font-bold text-base transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* Check/Radio group: existing toggle behavior */
                          <div className="space-y-1.5">
                            {(group.options || []).map(option => {
                              const checked = isSelected(group.id, option.id);
                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  onClick={() => toggleOption(group, option)}
                                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors cursor-pointer text-left ${
                                    checked ? 'border-[#FF3008] bg-red-50' : isRequiredAndEmpty ? 'border-red-200 bg-white hover:border-red-300' : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className={`w-4 h-4 flex-shrink-0 flex items-center justify-center border-2 ${
                                      checked ? 'border-[#FF3008] bg-[#FF3008]' : 'border-gray-300'
                                    } ${isRadio ? 'rounded-full' : 'rounded'}`}>
                                      {checked && (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </div>
                                    <span className={checked ? 'text-gray-900 font-medium' : 'text-gray-700'}>{option.name}</span>
                                  </div>
                                  {option.price_modifier !== 0 && (
                                    <span className={`text-sm font-medium flex-shrink-0 ${checked ? 'text-[#FF3008]' : 'text-gray-500'}`}>
                                      {option.price_modifier > 0 ? '+' : ''}${option.price_modifier.toFixed(2)}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {/* Special requests */}
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-900 mb-1.5">Special requests</label>
                <textarea
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="e.g. no onions, extra sauce, allergies..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-[#FF3008] focus:outline-none focus:ring-1 focus:ring-[#FF3008] resize-none text-gray-700 placeholder-gray-400"
                />
              </div>

              {/* Cart conflict warning */}
              {conflictingRestaurant && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-xs font-medium mb-2">
                    Your cart has items from {conflictingRestaurant}.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAndAdd}
                      disabled={submitting}
                      className="flex-1 bg-[#FF3008] text-white text-xs font-semibold py-1.5 rounded-lg hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
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

              {/* Required fields error banner */}
              {showErrors && unfilledRequired.length > 0 && (
                <div className="mt-4 px-3 py-2 bg-red-50 border border-[#FF3008]/30 rounded-lg text-[#FF3008] text-xs font-semibold">
                  Fill out all required fields.
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={collapseWithScroll}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {editCartItemId ? (
                  <button
                    onClick={handleUpdateCart}
                    disabled={submitting}
                    className="flex-1 bg-[#FF3008] text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                  >
                    {submitting ? 'Updating...' : `Update • $${effectivePrice.toFixed(2)}`}
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    disabled={submitting}
                    className="flex-1 bg-[#FF3008] text-white font-semibold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
                  >
                    {submitting ? 'Adding...' : `Add to Cart • $${effectivePrice.toFixed(2)}`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
