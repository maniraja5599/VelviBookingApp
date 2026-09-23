"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { Download, X, Share, PlusSquare, Smartphone, Sparkles } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const FirstTimeInstallPopup: React.FC = () => {
  const pathname = usePathname();
  const { currentUser } = useAuth();

  const [showPopup, setShowPopup] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(6);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 1. Never show on login screen or if user is not logged in yet
    if (!currentUser || pathname.startsWith("/login")) {
      return;
    }

    // 2. Check if already installed in standalone PWA mode or marked installed
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      localStorage.getItem("velvi_pwa_installed") === "true";

    if (isStandalone) return;

    // 3. Check if first-time user has already seen this popup (only once)
    const hasSeenPrompt = localStorage.getItem("velvi_first_install_prompt_seen");
    if (hasSeenPrompt) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isApple = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isApple);

    // Listen for chromium beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Track native install completion
    const handleAppInstalled = () => {
      localStorage.setItem("velvi_pwa_installed", "true");
      setShowPopup(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // Show popup strictly after 5 seconds for logged-in first-time users ("5 sec kalichu")
    const delayTimer = setTimeout(() => {
      setShowPopup(true);
      localStorage.setItem("velvi_first_install_prompt_seen", "true");

      // Auto-close countdown (6 seconds: "6 sec la maraiyanum")
      setSecondsLeft(6);
      countdownIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
            setShowPopup(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-close after exactly 6 seconds (6000ms)
      timerRef.current = setTimeout(() => {
        setShowPopup(false);
      }, 6000);
    }, 5000);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [currentUser, pathname]);

  const handleDismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setShowPopup(false);
  };

  const handleInstall = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        localStorage.setItem("velvi_pwa_installed", "true");
        setShowPopup(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      alert("To install Velvi, tap your browser menu (⋮) and select 'Install App' or 'Add to Home Screen'.");
      setShowPopup(false);
    }
  };

  if (!showPopup && !showIOSGuide) return null;

  return (
    <>
      {/* 10-Second First-Time User Install Popup */}
      {showPopup && (
        <div className="fixed bottom-20 left-3 right-3 z-50 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-gradient-to-br from-velvi-brownDark via-velvi-brown to-velvi-brownLight text-white rounded-3xl p-4 shadow-2xl border border-velvi-gold/40 relative overflow-hidden">
            {/* Countdown progress bar along top edge */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-velvi-gold to-amber-300 transition-all duration-1000 ease-linear"
                style={{ width: `${(secondsLeft / 6) * 100}%` }}
              />
            </div>

            <div className="flex items-start justify-between gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 p-1 border border-velvi-gold/30 flex items-center justify-center shrink-0">
                  <VelviLogo size="sm" variant="icon" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-xs text-white">Install Velvi Mobile App</h4>
                    <span className="px-1.5 py-0.2 bg-velvi-gold text-velvi-brownDark text-[9px] font-black rounded-full uppercase">
                      New
                    </span>
                  </div>
                  <p className="text-[11px] text-velvi-cream/80 leading-tight mt-0.5">
                    1-tap home screen access & faster offline experience.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="p-1 rounded-full text-velvi-cream/60 hover:text-white hover:bg-white/10 transition shrink-0"
                aria-label="Close install prompt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Actions & Countdown info */}
            <div className="mt-3.5 flex items-center justify-between gap-2 pt-2 border-t border-white/10">
              <span className="text-[10px] text-velvi-goldLight/90 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-velvi-gold shrink-0" />
                Auto closes in {secondsLeft}s
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleDismiss}
                  className="px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-velvi-cream/70 hover:text-white transition"
                >
                  Later
                </button>
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 bg-gradient-to-r from-velvi-gold to-velvi-goldLight hover:opacity-95 text-velvi-brownDark rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                  Install App
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Add to Home Screen Instructions */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-velvi-gold/30 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <VelviLogo size="sm" variant="icon" />
                <h3 className="font-bold text-sm text-velvi-brownDark">Install on iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-full text-velvi-brown/50 hover:bg-velvi-cream"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-velvi-brown/80">
              <div className="flex items-start gap-2.5 bg-velvi-cream/60 p-2.5 rounded-xl border border-velvi-gold/20">
                <span className="w-5 h-5 rounded-full bg-velvi-gold text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  Tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at the bottom of Safari.
                </p>
              </div>
              <div className="flex items-start gap-2.5 bg-velvi-cream/60 p-2.5 rounded-xl border border-velvi-gold/20">
                <span className="w-5 h-5 rounded-full bg-velvi-gold text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-velvi-brown" />.
                </p>
              </div>
              <div className="flex items-start gap-2.5 bg-velvi-cream/60 p-2.5 rounded-xl border border-velvi-gold/20">
                <span className="w-5 h-5 rounded-full bg-velvi-gold text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  Tap <strong>Add</strong> in the top right. Velvi will appear as a native app on your home screen!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-velvi-brown text-white font-bold text-xs rounded-xl shadow-sm hover:bg-velvi-brownDark transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
