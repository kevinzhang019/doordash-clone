'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';

export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="bg-black border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#FF3008] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <span className="text-white font-semibold text-sm">Driver Mode</span>
          </div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-gray-400 text-sm hidden sm:block">
                {user.name.split(' ')[0]}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white border border-[#2a2a2a] rounded-lg px-3 py-1.5 hover:border-gray-500 transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
