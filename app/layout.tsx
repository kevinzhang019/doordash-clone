import CartAutoRemovedWatcher from '@/components/cart/CartAutoRemovedWatcher';
import CartSidebar from '@/components/cart/CartSidebar';
import FloatingDriverChat from '@/components/chat/FloatingDriverChat';
import ModeSidebar from '@/components/layout/ModeSidebar';
import Navbar from '@/components/layout/Navbar';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { ChatSeenProvider } from '@/components/providers/ChatSeenProvider';
import { CuisineProvider } from '@/components/providers/CuisineProvider';
import { LocationProvider } from '@/components/providers/LocationProvider';
import { ModeProvider } from '@/components/providers/ModeProvider';
import { SearchProvider } from '@/components/providers/SearchProvider';
import OnboardingModal from '@/components/ui/OnboardingModal';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DashDoor - Food Delivery',
  description: 'Order food from your favorite local restaurants. Fast delivery, real-time tracking, and great deals.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
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
        <SpeedInsights />
      </body>
    </html>
  );
}
