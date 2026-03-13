'use client';

interface EarningsDisplayProps {
  totalEarnings: number;
  deliveriesCompleted: number;
  onGoOffline: () => void;
}

export default function EarningsDisplay({ totalEarnings, deliveriesCompleted, onGoOffline }: EarningsDisplayProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2a2a2a] px-4 py-4 z-30">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        <div className="flex gap-6">
          <div>
            <p className="text-gray-400 text-xs">Session Earnings</p>
            <p className="text-[#22c55e] font-bold text-lg">${totalEarnings.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Deliveries</p>
            <p className="text-white font-bold text-lg">{deliveriesCompleted}</p>
          </div>
        </div>
        <button
          onClick={onGoOffline}
          className="border border-[#2a2a2a] text-gray-300 hover:text-white hover:border-gray-500 px-4 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer"
        >
          Go Offline
        </button>
      </div>
    </div>
  );
}
