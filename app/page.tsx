// app/page.tsx
import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-rose-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Huy hiệu nhỏ */}
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide">
          🚀 Hệ thống Đặt đồ ăn trực tuyến
        </div>

        {/* Tiêu đề chính */}
        <h1 className="text-4xl sm:text-6xl font-extrabold text-gray-900 tracking-tight">
          Giao đồ ăn nhanh chóng, <span className="text-rose-600">thơm ngon tận cửa!</span>
        </h1>

        {/* Mô tả ngắn */}
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Khám phá thực đơn đa dạng từ cơm tấm, bánh mì, trà sữa cho đến các món ăn nhanh yêu thích của bạn ngay hôm nay.
        </p>

        {/* Các nút điều hướng */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link 
            href="/foods"
            className="w-full sm:w-auto bg-rose-500 hover:bg-rose-600 text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2"
          >
            🔥 Khám Phá Menu Ngay
          </Link>
          
          <Link 
            href="/cart"
            className="w-full sm:w-auto bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3.5 rounded-xl border border-gray-200 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            🛒 Xem Giỏ Hàng
          </Link>
        </div>

        {/* Thống kê nhỏ hoặc tiện ích dưới chân */}
        <div className="grid grid-cols-3 gap-4 pt-12 border-t border-gray-100 mt-12 max-w-lg mx-auto text-gray-500 text-sm">
          <div>
            <p className="font-bold text-gray-900 text-lg">100%</p>
            <p>Món ăn chuẩn vị</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Nhanh chóng</p>
            <p>Giao hàng đúng giờ</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">Hỗ trợ 24/7</p>
            <p>Tận tâm phục vụ</p>
          </div>
        </div>

      </div>
    </main>
  );
}