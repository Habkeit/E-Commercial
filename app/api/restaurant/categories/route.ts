import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục"),
  description: z.string().trim().optional(),
});

// 1. Thêm hàm GET để lấy danh sách danh mục cho trang thêm món
export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    // Tìm nhà hàng của user hiện tại
    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.userId, userId),
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dữ liệu cửa hàng" },
        { status: 404 }
      );
    }

    // Lấy tất cả danh mục thuộc nhà hàng này
    const list = await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurant.id));

    return NextResponse.json({ success: true, categories: list });
  } catch (error) {
    console.error("Lỗi API lấy danh mục:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ nội bộ" },
      { status: 400 }
    );
  }
}

// 2. Giữ nguyên hàm POST để tạo danh mục như cũ
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Vui lòng đăng nhập" },
        { status: 401 }
      );
    }

    const restaurant = await db.query.restaurants.findFirst({
      where: eq(restaurants.userId, userId),
    });

    if (!restaurant) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy dữ liệu cửa hàng của bạn" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsedData = categorySchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.issues[0].message },
        { status: 400 }
      );
    }

    await db.insert(categories).values({
      id: crypto.randomUUID(),
      name: parsedData.data.name,
      description: parsedData.data.description || null,
      restaurantId: restaurant.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Lỗi API tạo danh mục:", error);
    return NextResponse.json(
      { success: false, message: "Lỗi máy chủ nội bộ" },
      { status: 400 }
    );
  }
}