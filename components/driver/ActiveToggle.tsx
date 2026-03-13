'use client';

interface ActiveToggleProps {
  onGoActive: () => void;
  loading?: boolean;
}

export default function ActiveToggle({ onGoActive, loading }: ActiveToggleProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-[#1a1a1a] border-2 border-[#2a2a2a] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🚗</span>
        </div>
        <h2 className="text-white text-2xl font-bold mb-2">Ready to drive?</h2>
        <p className="text-gray-400 text-sm">Go active to start receiving delivery requests</p>
      </div>

      <button
        onClick={onGoActive}
        disabled={loading}
        className="bg-[#FF3008] hover:bg-red-700 text-white font-bold text-lg px-12 py-5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-red-900/30"
      >
        {loading ? 'Starting...' : 'Go Active'}
      </button>
    </div>
  );
}
