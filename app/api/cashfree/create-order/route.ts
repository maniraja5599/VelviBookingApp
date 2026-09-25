import { NextRequest, NextResponse } from "next/server";
import { cashfree } from "@/lib/payments/cashfree";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessId, userId, planCycle, customer, customAmount, couponCode } = body;

    if (!businessId || !userId) {
      return NextResponse.json(
        { error: "businessId and userId are required" },
        { status: 400 }
      );
    }

    const cycle: "MONTHLY" | "YEARLY" = planCycle === "YEARLY" ? "YEARLY" : "MONTHLY";

    const customerDetails = {
      name: customer?.name || "Velvi Vadhyar",
      email: customer?.email || "priest@velvi.app",
      phone: customer?.phone || "9840012345",
    };

    const orderResponse = await cashfree.createSubscriptionOrder(
      businessId,
      userId,
      cycle,
      customerDetails,
      typeof customAmount === "number" && customAmount > 0 ? customAmount : undefined,
      couponCode
    );

    return NextResponse.json({
      success: true,
      orderId: orderResponse.orderId,
      cfOrderId: orderResponse.cfOrderId,
      paymentSessionId: orderResponse.paymentSessionId,
      orderStatus: orderResponse.orderStatus,
      orderAmount: orderResponse.orderAmount,
      currency: "INR",
      planCycle: cycle,
      environment: cashfree.getEnvironment(),
      isConfigured: cashfree.isConfigured(),
      isSimulated: orderResponse.isSimulated || false,
    });
  } catch (error: any) {
    console.error("Error creating Cashfree subscription order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create Cashfree order" },
      { status: 500 }
    );
  }
}
