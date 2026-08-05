import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// Initialize the Inter font
const inter = Inter({ subsets: ['latin'] });


export const metadata: Metadata = {
  title: 'Food Delivery App',
  description: 'Order your favorite food online easily and quickly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* 
          Since we are now using Zustand for state management (cartStore), 
          we no longer need a Context Provider wrapping the children! 
        */}
        {children}
      </body>
    </html>
  );
}