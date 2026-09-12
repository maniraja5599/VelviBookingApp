"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Check } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export const PwaInstallBanner: React.FC<{
  mode?: "banner" | "card" | "button";
  onInstalled?: () => void;
}> = ({ mode = "banner", onInstalled }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // Listen for BeforeInstallPrompt event (Android / Chromium)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Check if user previously dismissed
      const dismissedTime = localStorage.getItem("velvi_pwa_dismissed");
      if (!dismissedTime || Date.now() - parseInt(dismissedTime, 10) > 86400000) {
        setShowBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    window.addEventListener("appinstalled", () => {
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstalledSuccess(true);
      if (onInstalled) onInstalled();
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, [onInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
        setInstalledSuccess(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General fallback alert/guide
      alert("To install Velvi on your phone, open your browser menu (⋮) and select 'Install app' or 'Add to Home Screen'.");
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("velvi_pwa_dismissed", Date.now().toString());
  };

  // If already running as installed app
  if (isStandalone) {
    if (mode === "card") {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-emerald-800">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-bold text-xs">Installed on this Device</h4>
            <p className="text-[11px] text-emerald-700/80">Running in native standalone app mode</p>
          </div>
        </div>
      );
    }
    return null;
  }

  // Button Mode (for settings or more page)
  if (mode === "button") {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-velvi-brown via-velvi-brownDark to-velvi-brown text-white shadow-sacred hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-velvi-gold/20 flex items-center justify-center text-velvi-goldLight">
              <Download className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                Install Velvi App
                <span className="px-1.5 py-0.2 bg-velvi-gold text-velvi-brownDark text-[9px] font-black rounded-full uppercase">
                  Mobile App
                </span>
              </h4>
              <p className="text-[11px] text-white/70">Add to home screen for 1-tap quick access</p>
            </div>
          </div>
          <Download className="w-4 h-4 text-velvi-gold shrink-0" />
        </button>

        {/* iOS Instruction Modal */}
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
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

              <div className="space-y-3 text-xs text-velvi-brown/80">
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
  }

  // Floating or In-page Banner Mode
  if (!showBanner && !installedSuccess) return null;

  if (installedSuccess) {
    return (
      <div className="bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-lg">
        <span className="flex items-center gap-1.5">
          <Check className="w-4 h-4 stroke-[3]" /> Velvi App added to your Home Screen!
        </span>
        <button onClick={() => setInstalledSuccess(false)} className="p-1">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-velvi-brownDark via-velvi-brown to-velvi-brownLight text-white rounded-2xl p-3.5 shadow-sacred border border-velvi-gold/40 flex items-center justify-between gap-3 animate-slide-up">
      <div className="flex items-center gap-2.5">
        <VelviLogo size="sm" variant="icon" />
        <div>
          <h4 className="font-bold text-xs flex items-center gap-1">
            Install Velvi App
            <span className="bg-velvi-gold text-velvi-brownDark text-[9px] font-black px-1.5 py-0.2 rounded-full">
              PWA
            </span>
          </h4>
          <p className="text-[10px] text-velvi-cream/80 leading-tight">
            Install for offline access & faster experience
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleInstallClick}
          className="px-2.5 py-1.5 bg-gradient-to-r from-velvi-gold to-velvi-goldLight hover:opacity-95 text-velvi-brownDark rounded-xl text-xs font-black shadow-sm flex items-center gap-1 transition"
        >
          <Download className="w-3 h-3 stroke-[2.5]" />
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-velvi-cream/60 hover:text-white transition"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
