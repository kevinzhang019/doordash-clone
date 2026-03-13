'use client';

interface Addon {
  name: string;
  price: number;
}

interface AddonManagerProps {
  addons: Addon[];
  onChange: (addons: Addon[]) => void;
}

export default function AddonManager({ addons, onChange }: AddonManagerProps) {
  const update = (index: number, field: keyof Addon, value: string) => {
    const next = addons.map((a, i) =>
      i === index ? { ...a, [field]: field === 'price' ? parseFloat(value) || 0 : value } : a
    );
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(addons.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...addons, { name: '', price: 0 }]);
  };

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">Add-ons</p>
      <div className="space-y-2">
        {addons.map((addon, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="text"
              value={addon.name}
              onChange={(e) => update(i, 'name', e.target.value)}
              placeholder="e.g. Extra cheese"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
            />
            <div className="relative w-24 flex-shrink-0">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={addon.price}
                onChange={(e) => update(i, 'price', e.target.value)}
                className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-2 text-sm text-[#FF3008] font-medium hover:underline cursor-pointer flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add add-on
      </button>
    </div>
  );
}
