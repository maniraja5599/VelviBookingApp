"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // Authenticates with Google (or simulated OAuth)
      const user = await loginWithGoogle("ravi.iyer@gmail.com", "Ravi Iyer");
      if (!user.mobile) {
        // First-time user needs onboarding
        router.push("/onboarding");
      } else {
        router.push("/app");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-velvi-cream flex flex-col justify-center px-4 py-12">
      <div className="max-w-sm w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <VelviLogo size="xl" variant="full" showTagline={true} />
        </div>

        {/* Login Card (Point 7) */}
        <div className="bg-white rounded-3xl p-6 border border-velvi-gold/30 shadow-sacred space-y-4 text-center">
          <h2 className="font-bold text-sm text-velvi-brownDark">Sign In to Continue</h2>

          {/* Primary Action: Continue with Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 border border-gray-300 rounded-2xl font-bold text-xs text-gray-700 flex items-center justify-center gap-3 shadow-sm active:scale-[0.99] transition"
          >
            {/* Google G Logo SVG */}
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? "Signing in..." : "Continue with Google"}</span>
          </button>

          {/* Quick Instant Dev Switcher Note */}
          <div className="text-[11px] text-velvi-brown/60 pt-2 border-t border-velvi-creamDark">
            No password required. Sign in securely with your Google Mail account.
          </div>
        </div>

        {/* Account Recovery Card - Find Linked Google Mail */}
        <div className="bg-white/70 border border-velvi-gold/25 rounded-2xl p-3.5 text-center space-y-1.5 shadow-sm">
          <p className="text-xs font-bold text-velvi-brownDark">
            Forgot which Google Mail you used?
          </p>
          <p className="text-[11px] text-velvi-brown/70 leading-relaxed">
            Enter your mobile number to instantly view your linked Google account(s).
          </p>
          <Link
            href="/recover"
            className="inline-flex items-center gap-1 text-xs font-bold text-velvi-brown hover:text-velvi-goldDark hover:underline pt-0.5"
          >
            <span>Find Linked Google Mail</span> →
          </Link>
        </div>

        {/* Developer Credit */}
        <div className="text-center pt-2">
          <DeveloperCredit />
        </div>
      </div>
    </div>
  );
}
