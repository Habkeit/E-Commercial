// app/api/restaurant/register/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { restaurants } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";
import { getOrCreateUser } from "@/lib/services/user.service";

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Automatically ensure user is synced
    await getOrCreateUser(clerkId);

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
      userId: clerkId,
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
      { success: false, message: "Failed to register restaurant" },
      { status: 400 },
    );
  }
}
