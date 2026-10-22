// app/restaurant/dashboard/DishEditForm.tsx
import Link from "next/link";
import { updateDishInfoAction } from "@/app/actions/restaurant";
import { type DishRecord } from "@/lib/services/dish.service";
import { DISH_STATUS } from "@/lib/constants";

interface CategoryOption {
  id: string;
  name: string;
}

interface DishEditFormProps {
  dish: DishRecord;
  categories: CategoryOption[];
  labels: {
    dishNameLabel: string;
    dishPriceLabel: string;
    stock: string;
    status: string;
    category: string;
    selectCategory: string;
    dishDescLabel: string;
    saveChanges: string;
    cancelBtn: string;
    activeStatus: string;
    preOrderStatus: string;
    inactiveStatus: string;
  };
}

export default function DishEditForm({
  dish,
  categories,
  labels,
}: DishEditFormProps) {
  return (
    <div className="border-2 border-rose-400 bg-rose-50/30 p-5 rounded-xl flex flex-col justify-between shadow-sm animate-in fade-in">
      <form action={updateDishInfoAction} className="space-y-3">
        <input type="hidden" name="dishId" value={dish.id} />

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {labels.dishNameLabel} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={dish.name}
            required
            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {labels.dishPriceLabel} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="price"
              defaultValue={dish.price}
              min="0"
              step="1"
              required
              className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              {labels.stock} <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              name="stock"
              defaultValue={dish.stock ?? 0}
              min="0"
              step="1"
              required
              className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {labels.status} <span className="text-rose-500">*</span>
          </label>
          <select
            name="status"
            defaultValue={dish.status || DISH_STATUS.ACTIVE}
            required
            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
          >
            <option value={DISH_STATUS.ACTIVE}>🟢 {labels.activeStatus}</option>
            <option value={DISH_STATUS.PRE_ORDER}>⏳ {labels.preOrderStatus}</option>
            <option value={DISH_STATUS.INACTIVE}>🔴 {labels.inactiveStatus}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {labels.category} <span className="text-rose-500">*</span>
          </label>
          <select
            name="categoryId"
            defaultValue={dish.categoryId || ""}
            required
            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white text-gray-900"
          >
            <option value="" disabled>
              {labels.selectCategory}
            </option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {labels.dishDescLabel}
          </label>
          <textarea
            name="description"
            defaultValue={dish.description || ""}
            rows={2}
            className="w-full border border-gray-300 p-2 text-sm rounded outline-none focus:ring-1 focus:ring-rose-500 bg-white resize-none text-gray-900"
          ></textarea>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
          >
            {labels.saveChanges}
          </button>
          <Link
            href="?"
            className="flex-1 bg-white hover:bg-gray-50 border text-center text-gray-700 py-2 rounded-lg text-sm font-semibold transition-colors block"
          >
            {labels.cancelBtn}
          </Link>
        </div>
      </form>
    </div>
  );
}
