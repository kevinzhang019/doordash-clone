import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { CartProvider } from '@/components/providers/CartProvider';
import Navbar from '@/components/layout/Navbar';
import CartSidebar from '@/components/cart/CartSidebar';

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
          <CartProvider>
            <Navbar />
            <CartSidebar />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
