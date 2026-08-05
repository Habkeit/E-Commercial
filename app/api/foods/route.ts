import { NextResponse } from 'next/server';
import { db } from '@/db';

export async function GET() {
  try {
    const allDishes = await db.query.dishes.findMany({
      with: {
        restaurant: true,
      },
    });

    return NextResponse.json({ success: true, data: allDishes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}