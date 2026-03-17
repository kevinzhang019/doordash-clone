'use client';

import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';
import { useModeContext } from '@/components/providers/ModeProvider';
import type { UserRole } from '@/lib/types';

const MODES: { role: UserRole; label: string; subtitle: string; icon: React.ReactNode }[] = [
  {
    role: 'customer',
    label: 'Customer',
    subtitle: 'Order food for delivery',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    role: 'driver',
    label: 'Driver',
    subtitle: 'Deliver orders & earn',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
  {
    role: 'restaurant',
    label: 'Restaurant',
    subtitle: 'Manage your restaurant',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
];

export default function ModeSidebar() {
  const { isModeOpen, closeMode } = useModeContext();

  const handleModeClick = (role: UserRole) => {
    closeMode();
    window.open(`/login?role=${role}`, '_blank');
  };

  return (
    <LazyMotion features={domAnimation}>
    <AnimatePresence>
      {isModeOpen && (
        <>
          {/* Backdrop */}
          <m.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-50 will-change-[opacity]"
            onClick={closeMode}
          />

          {/* Panel */}
          <m.div
            key="panel"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.9 }}
            className="fixed top-0 left-0 h-full w-[270px] bg-[#FF3008] z-50 flex flex-col shadow-2xl will-change-transform"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/20">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#FF3008] font-bold text-xs">D</span>
                </div>
                <span className="text-white font-bold text-lg">DoorDash</span>
              </div>
              <button
                onClick={closeMode}
                className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Label */}
            <div className="px-5 pt-5 pb-2">
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Sign in as</p>
            </div>

            {/* Mode list */}
            <div className="flex flex-col gap-2 px-3 pb-4">
              {MODES.map(({ role, label, subtitle, icon }) => (
                <button
                  key={role}
                  onClick={() => handleModeClick(role)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer text-left"
                >
                  <div className="flex-shrink-0 text-white">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white">{label}</p>
                    <p className="text-xs text-white/70">{subtitle}</p>
                  </div>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/50 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
            </div>
          </m.div>
        </>
      )}
    </AnimatePresence>
    </LazyMotion>
  );
}
