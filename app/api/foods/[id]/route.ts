import { NextResponse } from "next/server";
import { getDishByIdWithRestaurant } from "@/lib/services/dish.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await params;
    const dish = await getDishByIdWithRestaurant(resolvedParams.id);

    if (!dish) {
      return NextResponse.json(
        {
          success: false,
          error: "Dish not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: dish,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching dish details:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dish details",
      },
      { status: 400 },
    );
  }
}
