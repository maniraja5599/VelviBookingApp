"use client";

declare global {
  interface Window {
    Cashfree?: any;
  }
}

let cashfreeSdkPromise: Promise<any> | null = null;

/**
 * Dynamically loads the official Cashfree JS SDK v3
 */
export function loadCashfreeSDK(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree SDK can only be loaded in browser"));
  }

  if (window.Cashfree) {
    return Promise.resolve(window.Cashfree);
  }

  if (cashfreeSdkPromise) {
    return cashfreeSdkPromise;
  }

  cashfreeSdkPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById("cashfree-js-sdk");
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Cashfree));
      existingScript.addEventListener("error", (e) => reject(e));
      return;
    }

    const script = document.createElement("script");
    script.id = "cashfree-js-sdk";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
      } else {
        reject(new Error("Cashfree SDK failed to initialize"));
      }
    };
    script.onerror = (err) => {
      cashfreeSdkPromise = null;
      reject(new Error("Failed to load Cashfree JS SDK from CDN"));
    };

    document.head.appendChild(script);
  });

  return cashfreeSdkPromise;
}

export interface CashfreeCheckoutOptions {
  paymentSessionId: string;
  mode?: "sandbox" | "production";
  onSuccess?: (data: any) => void;
  onFailure?: (data: any) => void;
  onClose?: () => void;
}

/**
 * Initializes and triggers Cashfree Checkout modal or full redirect
 */
export async function openCashfreeCheckout(options: CashfreeCheckoutOptions): Promise<void> {
  const Cashfree = await loadCashfreeSDK();
  const mode = options.mode || "sandbox";

  const cashfreeInstance = Cashfree({
    mode: mode,
  });

  const isMobile =
    typeof window !== "undefined" &&
    (window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));

  const checkoutOptions = {
    paymentSessionId: options.paymentSessionId,
    redirectTarget: isMobile ? "_self" : "_modal",
  };

  return cashfreeInstance.checkout(checkoutOptions);
}
