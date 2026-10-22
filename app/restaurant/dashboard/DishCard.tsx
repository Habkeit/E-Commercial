// app/restaurant/dashboard/DishCard.tsx
import Link from "next/link";
import DeleteConfirmButton from "@/components/DeleteConfirmButton";
import { deleteDishAction } from "@/app/actions/restaurant";
import { type DishRecord } from "@/lib/services/dish.service";
import {
  DISH_STATUS,
  DISH_STATUS_BADGES,
  type DishStatus,
} from "@/lib/constants";

interface DishCardProps {
  dish: DishRecord;
  labels: {
    editBtn: string;
    deleteDishConfirm: string;
    deleteDishTitle: string;
    noDescription: string;
    stock: string;
    activeStatus: string;
    preOrderStatus: string;
    inactiveStatus: string;
  };
}

export default function DishCard({ dish, labels }: DishCardProps) {
  const status = (dish.status as DishStatus) || DISH_STATUS.ACTIVE;
  const badgeConfig = DISH_STATUS_BADGES[status] || DISH_STATUS_BADGES[DISH_STATUS.ACTIVE];

  const getStatusDisplay = () => {
    switch (status) {
      case DISH_STATUS.PRE_ORDER:
        return `⏳ ${labels.preOrderStatus}`;
      case DISH_STATUS.INACTIVE:
        return `🔴 ${labels.inactiveStatus}`;
      case DISH_STATUS.ACTIVE:
      default:
        return labels.activeStatus;
    }
  };

  return (
    <div className="border border-gray-100 bg-gray-50/50 p-5 rounded-xl flex flex-col justify-between relative group hover:border-rose-200 transition-colors">
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full shadow-sm p-1 border border-gray-100 z-10">
        <Link
          href={`?editDish=${dish.id}`}
          className="text-gray-400 hover:text-rose-600 p-1 rounded-full transition-colors"
          title={labels.editBtn}
        >
          ✏️
        </Link>

        <form action={deleteDishAction}>
          <input type="hidden" name="dishId" value={dish.id} />
          <DeleteConfirmButton
            confirmMessage={labels.deleteDishConfirm}
            className="text-gray-400 hover:text-red-600 p-1 rounded-full transition-colors cursor-pointer"
            title={labels.deleteDishTitle}
          >
            🗑️
          </DeleteConfirmButton>
        </form>
      </div>

      <div>
        <h3 className="font-bold text-gray-900 text-lg pr-16">{dish.name}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {dish.description || labels.noDescription}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200/60 flex justify-between items-center">
        <span className="font-extrabold text-rose-600">
          {Number(dish.price).toLocaleString("en-US")} VND
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
            {labels.stock}: {dish.stock ?? 0}
          </span>

          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-lg ${badgeConfig.fullClass}`}
          >
            {getStatusDisplay()}
          </span>
        </div>
      </div>
    </div>
  );
}
