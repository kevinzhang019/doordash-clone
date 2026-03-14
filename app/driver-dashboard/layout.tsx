'use client';

import { useModeContext } from '@/components/providers/ModeProvider';

export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  const { openMode } = useModeContext();

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Minimal header strip with hamburger */}
      <div className="flex items-center px-4 pt-3 pb-1">
        <button
          onClick={openMode}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Switch mode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {children}
    </div>
  );
}
