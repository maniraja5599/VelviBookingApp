"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { Sparkles, Calendar, MessageCircle, ArrowRight } from "lucide-react";

export default function PublicLandingPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (currentUser) {
      router.replace("/app/calendar");
    } else {
      router.replace("/login");
    }

    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = currentUser ? "/app/calendar" : "/login";
      }
    }, 1500);
    return () => clearTimeout(fallbackTimer);
  }, [currentUser, isLoading, router]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var uid = localStorage.getItem("velvi_active_user_id");
              if (uid && uid !== "LOGGED_OUT") {
                window.location.replace("/app/calendar");
              } else {
                window.location.replace("/login");
              }
            } catch(e) {}
          `,
        }}
      />
      <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col items-center justify-center p-4">
        <main className="max-w-xl w-full text-center space-y-6">
          <div className="flex justify-center">
            <VelviLogo size="lg" variant="full" showTagline={false} />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300/80">
              <Sparkles className="w-3.5 h-3.5 text-amber-800" />
              <span>வேத சேவைகளுக்கான நவீன தளம் • Sacred Vedic Management</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              வேள்வி — வாத்தியார் &amp; புரோகிதர் மேலாண்மை செயலி
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
              தமிழ்நாட்டில் புரோகிதர்கள், சாஸ்திரிகள் மற்றும் ஐயர்களுக்கான பிரத்யேக செயலி. சுலபமான பூஜை முன்பதிவு, வாட்ஸ்அப் சாமக்ரி பட்டியல் பகிர்வு மற்றும் தக்ஷிணை கணக்குகள்.
            </p>
          </div>

          {/* Key Features for Search & AI Engines */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            <div className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <Calendar className="w-4 h-4 text-amber-700" />
                <span>பூஜை &amp; முகூர்த்த முன்பதிவு</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                வாடிக்கையாளர் பெயர், நட்சத்திரம், கோத்ரம் மற்றும் முகூர்த்த நேரத்தை துல்லியமாக பதிவு செய்யுங்கள்.
              </p>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                <MessageCircle className="w-4 h-4 text-emerald-700" />
                <span>WhatsApp சாமக்ரி பட்டியல்</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                கணபதி ஹோமம், நவகிரக பூஜை, கிரஹப்பிரவேச சாமக்ரி பட்டியல்களை ஒரே கிளிக்கில் வாட்ஸ்அப்பில் பகிருங்கள்.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>இலவசமாக தொடங்க / Launch Velvi</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/pricing"
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs sm:text-sm transition"
            >
              கட்டண விபரம் / Pricing
            </Link>
          </div>

          <div className="pt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>Redirecting to your Velvi workspace...</span>
          </div>

          {/* Hidden Semantic Crawl Content for Search Engines & Accessibility */}
          <section className="sr-only" aria-label="Velvi Vedic Management Platform Overview">
            <h2>Velvi — India's Premier Digital Workspace for Vedic Priests and Tamil Vadhyars</h2>
            <p>
              Velvi (வேள்வி) is a modern, mobile-friendly application engineered for Vedic Purohits, Tamil Vadhyars, Iyers, and sacred service providers across Tamil Nadu, Chennai, Bengaluru, and worldwide. 
              The application provides automated pooja bookings, devotee CRM with Gotram and Nakshatram tracking, digital dakshina accounting with PDF and WhatsApp receipts, 
              and one-click WhatsApp sharing of pre-configured pooja samagri checklists.
            </p>
            <h3>Supported Vedic Ceremonies and Pooja Services</h3>
            <ul>
              <li>Ganapathi Homam — Complete samagri list, muhurtham timing, and devotee booking.</li>
              <li>Navagraha Homam &amp; Shanthi Pooja — Planetary remedies and ritual schedules.</li>
              <li>Grihapravesam — Housewarming ceremony planning, Vastu pooja checklists, and muhurtham dates.</li>
              <li>Vivaham &amp; Upanayanam — Sacred wedding ceremonies, sacred thread ceremonies, and auspicious lagna timings.</li>
              <li>Sudarshana Homam, Mrityunjaya Homam &amp; Chandi Homam — Protection rituals and dakshina receipts.</li>
              <li>Ayush Homam, Shashtiabdapoorthi &amp; Sathabishekam — Milestone birth ceremonies and devotee family registries.</li>
              <li>Shraddham &amp; Thithi Reminders — Annual ancestral rites scheduling with timely devotee notifications.</li>
            </ul>
            <h3>Key Features for Vedic Service Providers</h3>
            <ul>
              <li>Sacred Muhurtham Calendar with daily Panchangam, Nalla Neram, and Gowri Nalla Neram timings.</li>
              <li>Devotee directory saving phone numbers, addresses, Gotram, Nakshatram, and family member details.</li>
              <li>Real-time payment tracking showing total billed, advance received, and pending dakshina balance dues.</li>
              <li>Direct WhatsApp integration to send bilingual (Tamil and English) booking confirmations and samagri lists.</li>
              <li>Works 100% offline as a Progressive Web App (PWA) with instant cloud sync.</li>
            </ul>
            <nav aria-label="Velvi Site Links">
              <Link href="/pricing">Velvi Pricing &amp; Plans (₹499/mo with 30-Day Free Trial)</Link>
              <Link href="/login">Devotee &amp; Vadhyar Login Portal</Link>
              <Link href="/contact">Customer Support Desk (+91 9159036301)</Link>
              <Link href="/terms">Terms of Service</Link>
              <Link href="/privacy">Privacy Policy</Link>
            </nav>
          </section>
        </main>
      </div>
    </>
  );
}
