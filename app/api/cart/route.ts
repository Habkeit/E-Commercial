// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cartItems, users, dishes, restaurants } from "@/db/schema";
import { eq, and, sql} from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ success: true, cart: [] });

    // Đảm bảo user đã tồn tại trong bảng users (sync tự động)
    let userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!userRecord) {
      const clerkUser = await currentUser();
      const newUserId = uuidv7();
      const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
      const name =
        `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
        "User";

      await db.insert(users).values({
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: name,
      });

      userRecord = {
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const currentUserId = String(userRecord.id);

    const items = await db
      .select({
        dishId: dishes.id,
        name: dishes.name,
        price: dishes.price,
        quantity: cartItems.quantity,
        note: cartItems.note,
        restaurantName: restaurants.name,
      })
      .from(cartItems)
      .innerJoin(dishes, eq(cartItems.dishId, dishes.id))
      .innerJoin(restaurants, sql`${dishes.restaurantId}::uuid = ${restaurants.id}`) 
      .where(eq(cartItems.userId, currentUserId));

    const formattedCart = items.map((i) => ({
      ...i,
      price: Number(i.price),
    }));

    return NextResponse.json({ success: true, cart: formattedCart });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve cart" },
      { status: 400 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );

    const { dishId, quantity, note } = await req.json();

    let userRecord = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!userRecord) {
      const clerkUser = await currentUser();
      const newUserId = uuidv7();
      const email = clerkUser?.emailAddresses[0]?.emailAddress || "";
      const name =
        `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
        "User";

      await db.insert(users).values({
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: name,
      });

      // 👇 CHÍNH LÀ ĐOẠN NÀY: Bạn phải gán lại dữ liệu thì ESLint mới thấy 
      // từ khóa "let" có tác dụng, và TypeScript mới biết userRecord đã có ID
      userRecord = {
        id: newUserId,
        clerkId: clerkId,
        email: email,
        fullName: name,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    const currentUserId = String(userRecord.id);

    // 💡 Kiểm tra item trong giỏ bằng clerkId
    const existingItem = await db.query.cartItems.findFirst({
      where: and(eq(cartItems.userId, currentUserId), eq(cartItems.dishId, dishId)),
    });

    if (existingItem) {
      await db
        .update(cartItems)
        .set({
          quantity: existingItem.quantity + quantity,
          note: note || existingItem.note,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existingItem.id));
    } else {
      await db.insert(cartItems).values({
        id: uuidv7(),
        userId: clerkId, // 💡 Lưu trực tiếp clerkId vào bảng cart_items
        dishId,
        quantity,
        note,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 400 },
    );
  }
}
