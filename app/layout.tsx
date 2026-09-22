// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import "./globals.css";
import Navbar from "@/components/Navbar";

// Import component LanguageSwitcher (đảm bảo đúng đường dẫn của bạn)
import LanguageSwitcher from "@/components/LanguageSwitcher";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale, getTranslations } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Food Delivery App",
  description: "Order your favorite food online easily and quickly.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  const t = await getTranslations("RestaurantDashboard");

  return (
    <ClerkProvider>
      <html lang={locale}>
        <body className={inter.className}>
          <NextIntlClientProvider messages={messages}>
            <Navbar />

            {/* Đổi thành flex justify-between items-center để đẩy nút ngôn ngữ sang trái */}
            <div className="bg-white border-b border-gray-100 py-2 px-6 flex justify-between items-center gap-4">
              {/* Nút chuyển đổi ngôn ngữ */}
              <LanguageSwitcher />

              {/* Nhóm các nút quản lý nhà hàng nằm bên phải */}
              <div className="flex items-center gap-4">
                <Link
                  href="/restaurant/dashboard"
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 transition-colors"
                >
                  🏪 {t("restaurantDashboard")}
                </Link>
                <Link
                  href="/restaurant/register"
                  className="text-sm font-medium text-gray-700 hover:text-rose-500 transition-colors"
                >
                  {t("restaurantRegister")} 🏪
                </Link>
              </div>
            </div>

            {children}
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
