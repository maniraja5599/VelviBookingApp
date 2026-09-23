import { NextRequest, NextResponse } from "next/server";
import { cashfree } from "@/lib/payments/cashfree";
import { db } from "@/lib/db/store";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature") || "";
    const timestamp = req.headers.get("x-webhook-timestamp") || "";

    // Verify webhook signature
    const isValid = cashfree.verifyWebhookSignature(signature, rawBody, timestamp);
    if (!isValid) {
      console.warn("Cashfree webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    if (type === "PAYMENT_SUCCESS_WEBHOOK" || data?.payment?.payment_status === "SUCCESS") {
      const orderId = data?.order?.order_id || "";
      const orderAmount = Number(data?.order?.order_amount) || 0;
      const paymentId = data?.payment?.cf_payment_id || `cf_${Date.now()}`;
      const customerId = data?.customer_details?.customer_id || "";

      const cycle: "MONTHLY" | "YEARLY" = orderAmount >= 2000 ? "YEARLY" : "MONTHLY";
      const daysToAdd = cycle === "MONTHLY" ? 30 : 365;

      // Extract businessId from orderId if available (order_{businessId}_{timestamp})
      let businessId = "biz-default";
      if (orderId.startsWith("order_")) {
        const parts = orderId.split("_");
        if (parts.length >= 2) {
          businessId = parts[1];
        }
      }

      // Idempotency check: don't process if already processed
      const existing = db.payments.find((p) => p.orderId === orderId);
      if (!existing) {
        db.adjustSubscriptionValidity({
          businessId,
          adminUserId: "u-super-admin-01",
          adminName: "Cashfree Webhook",
          adjustmentType: "EXTEND",
          days: daysToAdd,
          reason: `Cashfree webhook verified payment of ₹${orderAmount} (${cycle})`,
        });

        db.payments.push({
          id: `pay-${Date.now()}`,
          businessId,
          userId: customerId || "u-priest-01",
          orderId,
          gateway: "CASHFREE" as const,
          gatewayPaymentId: paymentId,
          amount: orderAmount,
          currency: "INR",
          status: "SUCCESS" as const,
          billingCycle: cycle,
          paymentMethod: "Cashfree Webhook",
          createdAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Cashfree webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
