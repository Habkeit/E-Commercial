// app/cart/CheckoutForm.tsx
"use client";

import { useState, useEffect } from "react";
import { message } from "antd";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/app/store/cartStore";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  handleCheckout: (
    formData: FormData,
  ) => Promise<{ success: boolean; message?: string; url?: string | null } | void>;
  defaultPhone: string;
  totalAmount: number;
}

interface LocationData {
  code: number;
  name: string;
}

export default function CheckoutForm({
  handleCheckout,
  defaultPhone,
  totalAmount,
}: CheckoutFormProps) {
  const t = useTranslations("Cart");
  const [messageApi, contextHolder] = message.useMessage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const router = useRouter();

  // State lưu danh sách API
  const [provinces, setProvinces] = useState<LocationData[]>([]);
  const [districts, setDistricts] = useState<LocationData[]>([]);
  const [wards, setWards] = useState<LocationData[]>([]);

  // State lưu giá trị người dùng chọn
  const [selectedProvince, setSelectedProvince] = useState<LocationData | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationData | null>(null);
  const [selectedWard, setSelectedWard] = useState<LocationData | null>(null);
  const [street, setStreet] = useState("");

  // Lấy Tỉnh/Thành phố khi tải trang
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/p/")
      .then((res) => res.json())
      .then((data) => setProvinces(data))
      .catch((err) => console.error("Lỗi lấy danh sách tỉnh", err));
  }, []);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const prov = provinces.find((p) => p.code === code) || null;
    setSelectedProvince(prov);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (code) {
      fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`)
        .then((res) => res.json())
        .then((data) => setDistricts(data.districts || []))
        .catch((err) => console.error("Lỗi lấy danh sách huyện", err));
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const dist = districts.find((d) => d.code === code) || null;
    setSelectedDistrict(dist);
    setSelectedWard(null);
    setWards([]);

    if (code) {
      fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`)
        .then((res) => res.json())
        .then((data) => setWards(data.wards || []))
        .catch((err) => console.error("Lỗi lấy danh sách xã", err));
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = Number(e.target.value);
    const ward = wards.find((w) => w.code === code) || null;
    setSelectedWard(ward);
  };

  // Ghép nối địa chỉ
  const fullAddress = [
    street.trim(),
    selectedWard?.name,
    selectedDistrict?.name,
    selectedProvince?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const onSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    if (!selectedProvince || !selectedDistrict || !selectedWard || !street.trim()) {
      messageApi.warning(t("fillAddress", { fallback: "Vui lòng nhập đầy đủ địa chỉ!" }));
      setIsSubmitting(false);
      return;
    }

    const result = await handleCheckout(formData);

    if (result && !result.success) {
      messageApi.error(result.message || "Đã xảy ra lỗi");
      setIsSubmitting(false);
    } else if (result && result.success && result.url) {
      clearCart();
      window.location.href = result.url;
    } else {
      clearCart();
      router.push("/orders");
      router.refresh();
    }
  };

  return (
    <form action={onSubmit} className="space-y-4">
      {contextHolder}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t("phone")} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="phoneNumber"
          required
          defaultValue={defaultPhone}
          placeholder="e.g., 0987654321"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
        />
        <p className="text-xs text-gray-500 mt-1">{t("phoneNote")}</p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          {t("DeliveryAddress")} <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={selectedProvince?.code || ""}
            onChange={handleProvinceChange}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-800"
          >
            <option value="" disabled>
              {t("province", { fallback: "Tỉnh / Thành phố" })}
            </option>
            {provinces.map((p) => (
              <option key={p.code} value={p.code}>
                {p.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDistrict?.code || ""}
            onChange={handleDistrictChange}
            disabled={!selectedProvince}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="" disabled>
              {t("district", { fallback: "Quận / Huyện" })}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedWard?.code || ""}
            onChange={handleWardChange}
            disabled={!selectedDistrict}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none bg-white text-gray-800 disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="" disabled>
              {t("ward", { fallback: "Phường / Xã" })}
            </option>
            {wards.map((w) => (
              <option key={w.code} value={w.code}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          placeholder={t("streetDetails", { fallback: "Số nhà, tên đường..." })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-800 placeholder-gray-400"
        />

        {/* Input ẩn này sẽ tự động truyền chuỗi địa chỉ hoàn chỉnh vào formData */}
        <input type="hidden" name="address" value={fullAddress} />
      </div>

      <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
        <span className="text-gray-500">{t("totalPayment")}:</span>
        <span className="text-2xl font-extrabold text-rose-600">
          {totalAmount.toLocaleString("en-US")} VND
        </span>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full text-white font-semibold py-3 rounded-xl transition-colors shadow-lg cursor-pointer ${
          isSubmitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
        }`}
      >
        {isSubmitting ? t("processing", { fallback: "Đang xử lý..." }) : t("confirmOrder", { fallback: "Thanh toán bằng thẻ" })}
      </button>
    </form>
  );
}