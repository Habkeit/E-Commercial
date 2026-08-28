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
    } else {
      await db
        .update(users)
        .set({
          email,
          fullName: fullName || existingUser.fullName,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, clerkId));
    }

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
