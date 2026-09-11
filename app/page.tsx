import Link from "next/link";
import { cookies } from "next/headers";
import { dict } from "@/app/utils/dictionary";
// import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function HomePage() {
  const cookieStore = await cookies();
  const currentLang = cookieStore.get("NEXT_LOCALE")?.value || "en";
  const t = dict[currentLang as keyof typeof dict];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex flex-col items-center justify-between p-6 text-center">
      <div className="max-w-3xl mx-auto space-y-6 my-auto">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          🚀 {t.intro_title || "Fast & Reliable"}
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight">
          {currentLang === "vi"
            ? "Giao đồ ăn nhanh chóng,"
            : "Fast food delivery,"}{" "}
          <span className="text-rose-600">
            {currentLang === "vi"
              ? "tươi ngon đến tận cửa!"
              : "fresh to your door!"}
          </span>
        </h1>

        <p className="text-lg text-gray-600 max-w-xl mx-auto">{t.intro}</p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/foods"
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
          >
            🔥 {t.exploreMenu || "Explore Menu"}
          </Link>

          <Link
            href="/cart"
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            🛒 {t.viewCart || "View Cart"}
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-12 border-t border-gray-100 mt-12 max-w-lg mx-auto text-gray-500 text-sm">
          <div>
            <p className="font-bold text-gray-900 text-lg">100%</p>
            <p>
              {currentLang === "vi" ? "Hương vị chuẩn xác" : "Authentic flavor"}
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">
              {currentLang === "vi" ? "Siêu tốc" : "Lightning Fast"}
            </p>
            <p>
              {currentLang === "vi" ? "Giao hàng đúng giờ" : "On-time delivery"}
            </p>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">24/7</p>
            <p>
              {currentLang === "vi" ? "Hỗ trợ tận tâm" : "Dedicated service"}
            </p>
          </div>
        </div>
      </div>

      <div></div>
    </main>
  );
}
