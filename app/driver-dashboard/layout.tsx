export default function DriverDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black flex flex-col">
      {children}
    </div>
  );
}
