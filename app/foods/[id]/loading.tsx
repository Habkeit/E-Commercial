// app/restaurant/[id]/loading.tsx
export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center items-center">
      <div className="flex flex-col items-center gap-4">
        {/* Vòng tròn xoay (spinner) */}
        <div className="w-10 h-10 border-4 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
        <p className="text-gray-600 font-medium animate-pulse">
          Đang tải thông tin nhà hàng...
        </p>
      </div>
    </div>
  );
}