'use client';

export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      {children}
    </div>
  );
}
