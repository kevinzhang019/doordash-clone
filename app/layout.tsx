import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { LocationProvider } from '@/components/providers/LocationProvider';
import { SearchProvider } from '@/components/providers/SearchProvider';
import { CuisineProvider } from '@/components/providers/CuisineProvider';
import { ChatSeenProvider } from '@/components/providers/ChatSeenProvider';
import { ModeProvider } from '@/components/providers/ModeProvider';
import Navbar from '@/components/layout/Navbar';
import ModeSidebar from '@/components/layout/ModeSidebar';
import CartSidebar from '@/components/cart/CartSidebar';
import OnboardingModal from '@/components/ui/OnboardingModal';
import FloatingDriverChat from '@/components/chat/FloatingDriverChat';
import CartAutoRemovedWatcher from '@/components/cart/CartAutoRemovedWatcher';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: 'DashDoor - Food Delivery',
  description: 'Order food from your favorite local restaurants. Fast delivery, real-time tracking, and great deals.',
  openGraph: {
    title: 'DashDoor - Food Delivery',
    description: 'Order food from your favorite local restaurants. Fast delivery, real-time tracking, and great deals.',
    type: 'website',
    siteName: 'DashDoor',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DashDoor - Food Delivery',
    description: 'Order food from your favorite local restaurants. Fast delivery, real-time tracking, and great deals.',
  },
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
          <ModeProvider>
            <LocationProvider>
              <SearchProvider>
                <CuisineProvider>
                <CartProvider>
                  <ChatSeenProvider>
                    <ModeSidebar />
                    <CartAutoRemovedWatcher />
                    <OnboardingModal />
                    <Navbar />
                    <CartSidebar />
                    <FloatingDriverChat />
                    <main className="min-h-screen bg-gray-50">
                      {children}
                    </main>
                  </ChatSeenProvider>
                </CartProvider>
                </CuisineProvider>
              </SearchProvider>
            </LocationProvider>
          </ModeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
