"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { db } from "@/lib/db/store";

function getOrSetSessionId(): string {
  if (typeof window === "undefined") return "sess-server";
  try {
    let sid = sessionStorage.getItem("velvi_visitor_session_id");
    if (!sid) {
      sid = `sess-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      sessionStorage.setItem("velvi_visitor_session_id", sid);
    }
    return sid;
  } catch {
    return `sess-${Date.now()}`;
  }
}

function detectDevice(): "MOBILE" | "DESKTOP" | "TABLET" | "BOT" {
  if (typeof window === "undefined") return "DESKTOP";
  const ua = navigator.userAgent.toLowerCase();
  if (/bot|googlebot|crawler|spider|robot|crawling/i.test(ua)) return "BOT";
  if (/(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/.test(ua)) {
    return "TABLET";
  }
  if (/mobile|iphone|ipod|android.*mobile|blackberry|iemobile|opera mini/i.test(ua) || window.innerWidth < 768) {
    return "MOBILE";
  }
  return "DESKTOP";
}

function detectOS(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function detectBrowser(): string {
  if (typeof window === "undefined") return "Unknown";
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return "Microsoft Edge";
  if (/chrome|crios/i.test(ua)) return "Google Chrome";
  if (/firefox|fxios/i.test(ua)) return "Mozilla Firefox";
  if (/safari/i.test(ua) && !/chrome/i.test(ua)) return "Apple Safari";
  if (/opera|opr/i.test(ua)) return "Opera";
  return "Mobile Browser";
}

export function VisitorTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string>("");
  const lastTrackedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const currentPath = pathname || "/";
    const now = Date.now();

    // Prevent duplicate firing on same path within 3 seconds
    if (lastTrackedPathRef.current === currentPath && now - lastTrackedTimeRef.current < 3000) {
      return;
    }
    lastTrackedPathRef.current = currentPath;
    lastTrackedTimeRef.current = now;

    // Do not track internal admin operations or API calls
    if (currentPath.startsWith("/api")) return;

    try {
      const sessionId = getOrSetSessionId();
      const referrer = document.referrer || "direct";
      const utmSource = searchParams?.get("utm_source") || searchParams?.get("ref") || "";
      const utmMedium = searchParams?.get("utm_medium") || "";
      const utmCampaign = searchParams?.get("utm_campaign") || "";
      const screenResolution = `${window.screen?.width || window.innerWidth}x${window.screen?.height || window.innerHeight}`;
      const language = navigator.language || "en-IN";
      const deviceType = detectDevice();
      const os = detectOS();
      const browser = detectBrowser();
      const pageTitle = document.title || "Velvi";

      // Check if logged in
      let isLoggedIn = false;
      let userEmail: string | undefined = undefined;

      try {
        const rawAuth = localStorage.getItem("velvi_auth_user") || sessionStorage.getItem("velvi_auth_user");
        if (rawAuth) {
          const authUser = JSON.parse(rawAuth);
          if (authUser?.email) {
            isLoggedIn = true;
            userEmail = authUser.email;
          }
        }
      } catch {
        // Ignore JSON error
      }

      const payload = {
        pagePath: currentPath,
        pageTitle,
        referrer,
        utmSource,
        utmMedium,
        utmCampaign,
        deviceType,
        browser,
        os,
        screenResolution,
        language,
        visitorSessionId: sessionId,
        isLoggedIn,
        userEmail,
        userAgent: navigator.userAgent,
      };

      // Send to server telemetry API
      fetch("/api/traffic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.log) {
            // Also store in local database store for instantaneous zero-latency reflection in super admin
            db.logWebTraffic(data.log);
          }
        })
        .catch(() => {});
    } catch {
      // Non-blocking catch
    }
  }, [pathname, searchParams]);

  return null;
}
