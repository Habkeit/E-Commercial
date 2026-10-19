// app/restaurant/dashboard/RestaurantEditForm.tsx
import Link from "next/link";
import { updateRestaurantInfoAction } from "@/app/actions/restaurant";
import { type RestaurantRecord } from "@/lib/services/restaurant.service";

interface RestaurantEditFormProps {
  restaurant: RestaurantRecord;
  labels: {
    editRestaurantInfo: string;
    restaurantName: string;
    houseNumber: string;
    street: string;
    ward: string;
    cityProvince: string;
    saveChanges: string;
    cancelBtn: string;
  };
}

export default function RestaurantEditForm({
  restaurant,
  labels,
}: RestaurantEditFormProps) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-rose-200 space-y-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>

      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-bold text-gray-900">
          {labels.editRestaurantInfo}
        </h2>
        <Link
          href="?"
          className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-2 rounded-full"
        >
          ❌
        </Link>
      </div>

      <form action={updateRestaurantInfoAction} className="space-y-4">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {labels.restaurantName} <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            defaultValue={restaurant.name}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labels.houseNumber} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="houseNumber"
              defaultValue={restaurant.houseNumber || ""}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labels.street} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="street"
              defaultValue={restaurant.street}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labels.ward} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="ward"
              defaultValue={restaurant.ward || ""}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {labels.cityProvince} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="province"
              defaultValue={restaurant.province}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none text-gray-900"
            />
          </div>
        </div>

        <div className="pt-4 flex items-center gap-3">
          <button
            type="submit"
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm cursor-pointer"
          >
            {labels.saveChanges}
          </button>
          <Link
            href="?"
            className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm shadow-sm flex items-center"
          >
            {labels.cancelBtn}
          </Link>
        </div>
      </form>
    </div>
  );
}
