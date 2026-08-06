// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SyncCart from "@/components/SyncCart";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Delivery App",
  description: "Order your favorite food online easily and quickly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <Navbar />
          <SyncCart />
          
          <div className="bg-white border-b border-gray-100 py-2 px-6 flex justify-end gap-4">
            <Link
              href="/restaurant/dashboard"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
            >
              🏪 Restaurant Dashboard
            </Link>
            <Link
              href="/restaurant/register"
              className="text-sm font-medium text-gray-700 hover:text-rose-500 transition-colors"
            >
              Register Restaurant 🏪
            </Link>
          </div>

          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}