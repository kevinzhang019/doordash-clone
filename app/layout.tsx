import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { LocationProvider } from '@/components/providers/LocationProvider';
import { SearchProvider } from '@/components/providers/SearchProvider';
import Navbar from '@/components/layout/Navbar';
import CartSidebar from '@/components/cart/CartSidebar';
import OnboardingModal from '@/components/ui/OnboardingModal';

export const metadata: Metadata = {
  title: 'DoorDash - Food Delivery',
  description: 'Order food from your favorite restaurants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <LocationProvider>
            <SearchProvider>
              <CartProvider>
                <OnboardingModal />
                <Navbar />
                <CartSidebar />
                <main className="min-h-screen bg-gray-50">
                  {children}
                </main>
              </CartProvider>
            </SearchProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
