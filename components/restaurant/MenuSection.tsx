'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MenuItem, Deal } from '@/lib/types';
import MenuItemCard from './MenuItemCard';

const ANIM_MS = 300;

interface MenuSectionProps {
  items: MenuItem[];
  deals?: Deal[];
}

export default function MenuSection({ items, deals }: MenuSectionProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const cardWrapperRefs = useRef<Map<number, HTMLDivElement | null>>(new Map());
  const switchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Collapse on outside click
  useEffect(() => {
    if (expandedId === null) return;
    const handleMouseDown = (e: MouseEvent) => {
      const wrapper = cardWrapperRefs.current.get(expandedId);
      if (wrapper && !wrapper.contains(e.target as Node)) {
        setExpandedId(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [expandedId]);

  const handleExpand = useCallback((newId: number) => {
    if (switchTimeout.current) clearTimeout(switchTimeout.current);

    if (expandedId !== null && expandedId !== newId) {
      // Close current card first, then open the new one after the animation
      setExpandedId(null);
      switchTimeout.current = setTimeout(() => setExpandedId(newId), ANIM_MS);
    } else {
      setExpandedId(newId);
    }
  }, [expandedId]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      {items.map(item => (
        <div
          key={item.id}
          ref={el => { cardWrapperRefs.current.set(item.id, el); }}
        >
          <MenuItemCard
            item={item}
            isExpanded={expandedId === item.id}
            onExpand={() => handleExpand(item.id)}
            onCollapse={() => setExpandedId(null)}
            deal={deals?.find(d => d.menu_item_id === item.id) ?? null}
          />
        </div>
      ))}
    </div>
  );
}
