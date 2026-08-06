// app/api/sync-user/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const { clerkId, email, fullName, localCart } = await request.json();

    console.log("Cart data to sync:", localCart);

    if (!clerkId || !email) {
      return NextResponse.json(
        { success: false, error: "Missing user data" },
        { status: 400 },
      );
    }

    // 1. Kiểm tra xem user đã tồn tại trong DB chưa, nếu chưa thì tạo mới
    let existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId,
          email,
          fullName: fullName || "Anonymous",
        })
        .returning();
      existingUser = newUser;
    }

    // 2. Xử lý đồng bộ giỏ hàng (localCart từ Guest chuyển thành giỏ hàng của User trên DB nếu cần)
    // Tại đây bạn có thể lưu trữ giỏ hàng vào bảng cart trong DB tương ứng với existingUser.id

    return NextResponse.json(
      { success: true, userId: existingUser.id },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error in sync-user API:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
