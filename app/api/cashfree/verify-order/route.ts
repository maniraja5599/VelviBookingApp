import { NextRequest, NextResponse } from "next/server";
import { cashfree } from "@/lib/payments/cashfree";
import { db } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, businessId, userId, planCycle } = body;

    if (!orderId || !businessId) {
      return NextResponse.json(
        { error: "orderId and businessId are required" },
        { status: 400 }
      );
    }

    const cycle: "MONTHLY" | "YEARLY" = planCycle === "YEARLY" ? "YEARLY" : "MONTHLY";
    const daysToAdd = cycle === "MONTHLY" ? 30 : 365;
    const amount = cycle === "MONTHLY" ? 499 : 4999;

    // 1. Fetch order details & payments from Cashfree
    const orderDetails = await cashfree.getOrderDetails(orderId);
    const payments = await cashfree.getOrderPayments(orderId);

    const successfulPayment = payments.find((p) => p.paymentStatus === "SUCCESS");
    const isPaid =
      orderDetails?.order_status === "PAID" ||
      Boolean(successfulPayment) ||
      !cashfree.isConfigured(); // Sandbox dev simulation if unconfigured

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        verified: false,
        orderId,
        orderStatus: orderDetails?.order_status || "PENDING",
        message: "Payment is pending or was not successful on Cashfree",
      });
    }

    const gatewayPaymentId =
      successfulPayment?.cfPaymentId || `cf_pay_${Date.now()}`;
    const paymentMethod =
      successfulPayment?.paymentMethod ? "UPI / Card" : "Cashfree Online";

    // 2. Extend subscription in DB Store
    const adjustResult = db.adjustSubscriptionValidity({
      businessId,
      adminUserId: "u-super-admin-01",
      adminName: "Cashfree Payment Gateway",
      adjustmentType: "EXTEND",
      days: daysToAdd,
      reason: `Cashfree verified payment for Velvi Pro (${cycle}) - Order: ${orderId}`,
    });

    // 3. Record verified payment in financial audit log
    const paymentRecord = {
      id: `pay-${Date.now()}`,
      businessId,
      userId: userId || "u-priest-01",
      orderId,
      gateway: "CASHFREE" as const,
      gatewayPaymentId,
      amount,
      currency: "INR",
      status: "SUCCESS" as const,
      billingCycle: cycle,
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // Avoid duplicate payments if already recorded
    const existingPayment = db.payments.find((p) => p.orderId === orderId);
    if (!existingPayment) {
      db.payments.push(paymentRecord);
    }

    return NextResponse.json({
      success: true,
      verified: true,
      orderId,
      gatewayPaymentId,
      daysAdded: daysToAdd,
      amount,
      billingCycle: cycle,
      subscription: adjustResult.subscription,
      message: `Cashfree payment verified! Subscription extended by ${daysToAdd} days.`,
    });
  } catch (error: any) {
    console.error("Error verifying Cashfree order:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to verify Cashfree order" },
      { status: 500 }
    );
  }
}
