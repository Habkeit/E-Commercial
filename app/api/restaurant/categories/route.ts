// app/api/restaurant/categories/route.ts
import { db } from "@/db";
import { categories, restaurants, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { uuidv7 } from "uuidv7";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: false }, { status: 401 });

    const currentUser = await db.select().from(users).where(eq(users.clerkId, clerkId));
    if (!currentUser.length) return NextResponse.json({ success: false });

    const myRestaurants = await db.select().from(restaurants).where(eq(restaurants.userId, currentUser[0].id));
    if (!myRestaurants.length) return NextResponse.json({ success: false });

    const myCategories = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, myRestaurants[0].id));

    return NextResponse.json({ success: true, categories: myCategories });
  } catch (error) {
    console.error("Lỗi GET categories:", error);
    return NextResponse.json({ success: false, message: "Lỗi Server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, message: "Tên danh mục là bắt buộc!" }, { status: 400 });
    }

    const currentUser = await db.select().from(users).where(eq(users.clerkId, clerkId));
    const myRestaurants = await db.select().from(restaurants).where(eq(restaurants.userId, currentUser[0].id));
    if (!myRestaurants.length) return NextResponse.json({ success: false, message: "Không tìm thấy nhà hàng" }, { status: 404 });

    await db.insert(categories).values({
      id: uuidv7(),
      restaurantId: myRestaurants[0].id,
      name: name,
      description: description || null,
    });

    return NextResponse.json({ success: true, message: "Tạo danh mục thành công!" });
  } catch (error) {
    console.error("Lỗi POST category:", error);
    return NextResponse.json({ success: false, message: "Lỗi Server" }, { status: 500 });
  }
}