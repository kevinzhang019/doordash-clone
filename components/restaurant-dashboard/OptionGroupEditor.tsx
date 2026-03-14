'use client';

import { useState } from 'react';

export interface OptionDraft {
  name: string;
  price_modifier: number;
}

export interface OptionGroupDraft {
  name: string;
  required: boolean;
  max_selections: number | null;
  options: OptionDraft[];
  collapsed?: boolean;
}

interface OptionGroupEditorProps {
  groups: OptionGroupDraft[];
  onChange: (groups: OptionGroupDraft[]) => void;
}

export default function OptionGroupEditor({ groups, onChange }: OptionGroupEditorProps) {
  const [collapsed, setCollapsed] = useState<boolean[]>(groups.map(() => false));

  const updateGroup = (gi: number, patch: Partial<OptionGroupDraft>) => {
    const updated = groups.map((g, i) => i === gi ? { ...g, ...patch } : g);
    onChange(updated);
  };

  const updateOption = (gi: number, oi: number, patch: Partial<OptionDraft>) => {
    const updated = groups.map((g, i) => {
      if (i !== gi) return g;
      return { ...g, options: g.options.map((o, j) => j === oi ? { ...o, ...patch } : o) };
    });
    onChange(updated);
  };

  const addGroup = () => {
    onChange([...groups, { name: '', required: false, max_selections: null, options: [] }]);
    setCollapsed(prev => [...prev, false]);
  };

  const removeGroup = (gi: number) => {
    onChange(groups.filter((_, i) => i !== gi));
    setCollapsed(prev => prev.filter((_, i) => i !== gi));
  };

  const addOption = (gi: number) => {
    updateGroup(gi, { options: [...groups[gi].options, { name: '', price_modifier: 0 }] });
  };

  const removeOption = (gi: number, oi: number) => {
    updateGroup(gi, { options: groups[gi].options.filter((_, j) => j !== oi) });
  };

  const toggleCollapse = (gi: number) => {
    setCollapsed(prev => prev.map((v, i) => i === gi ? !v : v));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Option Groups</h3>
        <button
          type="button"
          onClick={addGroup}
          className="text-xs text-[#FF3008] font-semibold hover:underline cursor-pointer"
        >
          + Add Group
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-xs text-gray-400 italic">No option groups yet. Add groups to let customers customize this item.</p>
      )}

      {groups.map((group, gi) => (
        <div key={gi} className="border border-gray-200 rounded-xl overflow-hidden">
          {/* Group header */}
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50">
            <button
              type="button"
              onClick={() => toggleCollapse(gi)}
              className="text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${collapsed[gi] ? '' : 'rotate-90'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <input
              type="text"
              value={group.name}
              onChange={e => updateGroup(gi, { name: e.target.value })}
              placeholder="Group name (e.g. Size, Toppings)"
              className="flex-1 text-sm font-medium bg-transparent focus:outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              type="button"
              onClick={() => removeGroup(gi)}
              className="text-gray-400 hover:text-red-500 cursor-pointer flex-shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!collapsed[gi] && (
            <div className="px-3 pb-3 pt-2 space-y-2">
              {/* Group settings */}
              <div className="flex items-center gap-4 text-xs text-gray-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={group.required}
                    onChange={e => updateGroup(gi, { required: e.target.checked })}
                    className="w-3.5 h-3.5 accent-[#FF3008]"
                  />
                  Required
                </label>
                <div className="flex items-center gap-1.5">
                  <span>Max selections:</span>
                  <select
                    value={group.max_selections === null ? 'any' : group.max_selections === 1 ? '1' : String(group.max_selections)}
                    onChange={e => {
                      const v = e.target.value;
                      updateGroup(gi, { max_selections: v === 'any' ? null : parseInt(v) });
                    }}
                    className="border border-gray-200 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#FF3008] bg-white"
                  >
                    <option value="any">Any</option>
                    <option value="1">Pick 1</option>
                    <option value="2">Up to 2</option>
                    <option value="3">Up to 3</option>
                    <option value="4">Up to 4</option>
                    <option value="5">Up to 5</option>
                  </select>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-1.5 mt-2">
                {group.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={opt.name}
                      onChange={e => updateOption(gi, oi, { name: e.target.value })}
                      placeholder="Option name"
                      className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#FF3008]"
                    />
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">+$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={opt.price_modifier}
                        onChange={e => updateOption(gi, oi, { price_modifier: parseFloat(e.target.value) || 0 })}
                        className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#FF3008]"
                        placeholder="0.00"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(gi, oi)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addOption(gi)}
                className="text-xs text-gray-500 hover:text-[#FF3008] font-medium mt-1 cursor-pointer"
              >
                + Add option
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
