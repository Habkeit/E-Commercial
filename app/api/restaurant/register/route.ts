// app/api/restaurant/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, restaurants } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    const user = await currentUser();

    if (!clerkId || !user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // 1. Kiểm tra xem user đã có trong bảng users chưa, nếu chưa thì tự động đồng bộ vào
    const dbUser = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId));
    let currentUserId: string;

    if (dbUser.length === 0) {
      const newUserId = uuidv7();
      const email = user.emailAddresses[0]?.emailAddress || "";
      const name =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";

      await db.insert(users).values({
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: name,
      });
      currentUserId = newUserId;
    } else {
      currentUserId = dbUser[0].id;
    }

    // 2. Lấy dữ liệu từ form gửi lên
    const body = await req.json();
    const { name, houseNumber, street, ward, province } = body;

    if (!name || !street || !province) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    await db.insert(restaurants).values({
      id: uuidv7(),
      userId: currentUserId,
      name,
      houseNumber: houseNumber || "",
      street,
      ward: ward || "",
      province,
      openTime: new Date(),
      closeTime: new Date(),
      note: "",
    });

    return NextResponse.json({
      success: true,
      message: "Restaurant registered successfully",
    });
  } catch (error) {
    console.error("Error registering restaurant:", error);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
