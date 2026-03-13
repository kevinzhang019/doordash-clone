'use client';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export interface HoursRow {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: number;
}

interface HoursEditorProps {
  hours: HoursRow[];
  onChange: (hours: HoursRow[]) => void;
}

export default function HoursEditor({ hours, onChange }: HoursEditorProps) {
  const update = (index: number, field: keyof HoursRow, value: string | number) => {
    const next = hours.map((h, i) => i === index ? { ...h, [field]: value } : h);
    onChange(next);
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-100">
            <th className="pb-3 w-28">Day</th>
            <th className="pb-3 w-20">Closed</th>
            <th className="pb-3">Open</th>
            <th className="pb-3 px-4 text-center text-gray-300">–</th>
            <th className="pb-3">Close</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {hours.map((h, i) => (
            <tr key={h.day_of_week} className="py-2">
              <td className="py-3 pr-4">
                <span className="text-sm font-medium text-gray-900">{DAY_NAMES[h.day_of_week]}</span>
              </td>
              <td className="py-3 pr-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(h.is_closed)}
                    onChange={e => update(i, 'is_closed', e.target.checked ? 1 : 0)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF3008]" />
                </label>
              </td>
              <td className="py-3 pr-2">
                <input
                  type="time"
                  value={h.open_time}
                  disabled={Boolean(h.is_closed)}
                  onChange={e => update(i, 'open_time', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                />
              </td>
              <td className="py-3 px-2 text-center text-gray-300">–</td>
              <td className="py-3 pl-2">
                <input
                  type="time"
                  value={h.close_time}
                  disabled={Boolean(h.is_closed)}
                  onChange={e => update(i, 'close_time', e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FF3008] disabled:opacity-40 disabled:cursor-not-allowed bg-white"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
