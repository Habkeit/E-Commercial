import { NextResponse } from "next/server";
import { db } from "@/db";
import { dishes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const resolvedParams = await params;
    const dishId = resolvedParams.id;

    const dish = await db.query.dishes.findFirst({
      where: eq(dishes.id, dishId),
      with: {
        restaurant: true,
      },
    });

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
        error: "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
