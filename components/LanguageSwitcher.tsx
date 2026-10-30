"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const router = useRouter();
  const currentLocale = useLocale(); 

  const toggleLanguage = () => {
    const newLocale = currentLocale === "vi" ? "en" : "vi";
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div
      onClick={toggleLanguage}
      className="relative flex items-center w-20 h-8 bg-gray-200 rounded-full p-1 cursor-pointer select-none transition-colors hover:bg-gray-300"
      title="Đổi ngôn ngữ / Switch language"
    >
      <div
        className={`absolute left-1 top-1 w-9 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ease-spring ${
          currentLocale === "en" ? "translate-x-9" : "translate-x-0"
        }`}
      ></div>

      <span
        className={`relative z-10 w-1/2 text-center text-xs font-bold transition-colors duration-300 ${
          currentLocale === "vi" ? "text-rose-600" : "text-gray-400"
        }`}
      >
        VI
      </span>

      <span
        className={`relative z-10 w-1/2 text-center text-xs font-bold transition-colors duration-300 ${
          currentLocale === "en" ? "text-rose-600" : "text-gray-400"
        }`}
      >
        EN
      </span>
    </div>
  );
}