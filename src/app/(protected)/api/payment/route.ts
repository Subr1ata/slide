import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ status: 404 });

  // Initialize Razorpay
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const amount = 100; // Amount in the smallest currency unit (e.g., 10000 paise = 100 INR)
  const currency = "INR";

  try {
    // Create an order
    const order = await razorpay.orders.create({
      amount,
      currency,
      receipt: `receipt_${Date.now()}`,
    });

    if (order) {
      return NextResponse.json({
        status: 200,
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
      });
    }
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return NextResponse.json({ status: 500, error: (error as Error).message });
  }

  return NextResponse.json({ status: 400 });
}
