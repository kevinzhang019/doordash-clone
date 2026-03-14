import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import { LocationProvider } from '@/components/providers/LocationProvider';
import { SearchProvider } from '@/components/providers/SearchProvider';
import { ChatSeenProvider } from '@/components/providers/ChatSeenProvider';
import { ModeProvider } from '@/components/providers/ModeProvider';
import Navbar from '@/components/layout/Navbar';
import ModeSidebar from '@/components/layout/ModeSidebar';
import CartSidebar from '@/components/cart/CartSidebar';
import OnboardingModal from '@/components/ui/OnboardingModal';
import FloatingDriverChat from '@/components/chat/FloatingDriverChat';

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
          <ModeProvider>
            <LocationProvider>
              <SearchProvider>
                <CartProvider>
                  <ChatSeenProvider>
                    <ModeSidebar />
                    <OnboardingModal />
                    <Navbar />
                    <CartSidebar />
                    <FloatingDriverChat />
                    <main className="min-h-screen bg-gray-50">
                      {children}
                    </main>
                  </ChatSeenProvider>
                </CartProvider>
              </SearchProvider>
            </LocationProvider>
          </ModeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
