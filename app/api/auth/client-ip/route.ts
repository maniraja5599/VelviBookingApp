import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  let ip =
    cfConnectingIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    realIp ||
    "106.210.142.88";

  // Provide realistic fallback if running on local loopback
  if (ip === "::1" || ip === "127.0.0.1" || ip === "localhost") {
    ip = "106.210.142.88";
  }

  return NextResponse.json({ ip });
}
