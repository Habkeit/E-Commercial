import { NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { uuidv7 } from 'uuidv7';

interface CartItemPayload {
  dishId: string;
  quantity: number;
  price: number;
  note?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const { cart, deliveryAddress, phoneNumber } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ success: false, message: "Cart is empty!" }, { status: 400 });
    }

    const totalAmount = cart.reduce((total: number, item: CartItemPayload) => {
      return total + (item.price * item.quantity);
    }, 0);
    
    const orderId = uuidv7();

    const DUMMY_CUSTOMER_ID = "018f3a3b-1234-7890-abcd-ef1234567890"; 

    await db.insert(orders).values({
      id: orderId,
      customerId: DUMMY_CUSTOMER_ID, 
      totalAmount: totalAmount.toString(),
      deliveryAddress: deliveryAddress,
      phoneNumber: phoneNumber,
      status: 'Pending',
    });

    const orderItemValues = cart.map((item: CartItemPayload) => ({
      id: uuidv7(),
      orderId: orderId,
      dishId: item.dishId, 
      quantity: item.quantity,
      price: item.price.toString(),
      note: item.note || '',
    }));

    await db.insert(orderItems).values(orderItemValues);

    return NextResponse.json({ 
      success: true, 
      message: "Order placed successfully!", 
      orderId: orderId 
    }, { status: 200 });

  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Internal Server Error" 
    }, { status: 500 });
  }
}