import { NextResponse } from "next/server";
import { cashfree } from "@/lib/payments/cashfree";

export async function GET() {
  const isConfigured = cashfree.isConfigured();
  const environment = cashfree.getEnvironment();

  return NextResponse.json({
    isConfigured,
    environment,
    appIdConfigured: Boolean(process.env.CASHFREE_APP_ID),
    secretConfigured: Boolean(process.env.CASHFREE_SECRET_KEY),
  });
}
