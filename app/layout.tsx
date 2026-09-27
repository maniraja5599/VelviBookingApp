import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/components/providers/LanguageContext";
import { ThemeProvider } from "@/components/providers/ThemeContext";
import { AuthProvider } from "@/components/providers/AuthContext";
import { FirstTimeInstallPopup } from "@/components/mobile/FirstTimeInstallPopup";

export const metadata: Metadata = {
  metadataBase: new URL("https://velvi.date"),
  title: {
    default: "Velvi — Modern Sacred Management for Vedic Services | வேள்வி",
    template: "%s | Velvi",
  },
  description:
    "India's premier digital platform for Iyers, Tamil Vadhyars, Purohits & Vedic service providers. Seamlessly organize pooja bookings, muhurtham calendars, devotee records, dakshina accounting, and 1-click WhatsApp samagri checklists.",
  keywords: [
    // Tamil Keywords
    "வேள்வி",
    "வேள்வி ஆப்",
    "வாத்தியார் முன்பதிவு",
    "புரோகிதர் செயலி",
    "சாஸ்திரிகள் செயலி",
    "ஐயர் முன்பதிவு",
    "பூஜை மேலாண்மை",
    "சாமக்ரி பட்டியல்",
    "முகூர்த்த நாள்காட்டி",
    "ஹோமம் முன்பதிவு",
    "தக்ஷிணை கணக்கு",
    "தமிழ் வாத்தியார்",
    "வேத புரோகிதர்",
    "கணபதி ஹோமம்",
    "கிரஹப்பிரவேசம் வாத்தியார்",
    // Tanglish Keywords
    "Velvi",
    "Velvi app",
    "Velvi booking app",
    "Tamil Vadhyar app",
    "Purohit booking app",
    "Iyer booking app",
    "Pooja samagri list Tamil",
    "Ganapathi homam booking",
    "Grihapravesam vadhyar",
    "Muhurtham date calendar",
    "Vedic priest software",
    // English Keywords
    "Pooja management software",
    "Priest booking CRM",
    "Vedic ritual scheduling",
    "Hindu priest app",
    "Temple seva management",
    "Dakshina payment tracker",
    "WhatsApp pooja reminder",
    "Vedic calendar Tamil Nadu",
    "Vadhyar booking app",
    "Iyer booking software",
    "Purohit calendar app",
    "Tamil priest software",
    "Ganapathi homam samagri list PDF",
    "Grihapravesam pooja items checklist",
    "Navagraha homam vadhyar contact",
    "Tamil muhurtham dates 2026",
    "Panchangam daily nalla neram app",
    "Online vadhyar booking Chennai",
    "Hindu priest scheduling CRM",
    "Devotee gotram and nakshatram tracker",
  ],
  authors: [{ name: "Velvi Sacred Tech", url: "https://velvi.date" }],
  creator: "Velvi Sacred Tech",
  publisher: "Velvi Sacred Tech",
  applicationName: "Velvi",
  category: "BusinessApplication",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: "https://velvi.date",
    languages: {
      "ta-IN": "https://velvi.date",
      "en-IN": "https://velvi.date",
      "en-US": "https://velvi.date",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["ta_IN"],
    url: "https://velvi.date",
    siteName: "Velvi — Sacred Vedic Management",
    title: "Velvi — Modern Sacred Management for Vedic Services | வேள்வி",
    description:
      "Modern, sacred, mobile-first platform for Iyers, Purohits, and Vedic service providers. Pooja bookings, samagri lists, muhurtham tracking, and devotee dakshina receipts.",
    images: [
      {
        url: "https://velvi.date/icons/icon-512.png",
        width: 512,
        height: 512,
        alt: "Velvi Sacred Tech Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Velvi — Sacred Vedic Management | வேள்வி",
    description:
      "Modern, sacred, mobile-first platform for Iyers, Purohits, and Vedic service providers.",
    images: ["https://velvi.date/icons/icon-512.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "V0kvApttcPvkHuLlHw8pZBJj2_fWp5fSgZ6jKZYEqCI",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Velvi",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#4A2E18",
};

import { Suspense } from "react";
import { VisitorTracker } from "@/components/analytics/VisitorTracker";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://velvi.date/#website",
      "url": "https://velvi.date",
      "name": "Velvi",
      "alternateName": [
        "வேள்வி",
        "Velvi App",
        "Velvi Booking App",
        "Velvi Sacred Tech"
      ],
      "description":
        "Sacred digital management platform for Tamil Vadhyars, Iyers, Purohits and Vedic service providers.",
      "inLanguage": ["en-IN", "ta-IN"],
      "publisher": {
        "@id": "https://velvi.date/#organization"
      }
    },
    {
      "@type": "Organization",
      "@id": "https://velvi.date/#organization",
      "name": "Velvi Sacred Tech",
      "alternateName": "வேள்வி",
      "url": "https://velvi.date",
      "logo": {
        "@type": "ImageObject",
        "url": "https://velvi.date/icons/icon-512.png",
        "width": 512,
        "height": 512
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer support",
        "email": "support@velvi.date",
        "telephone": "+91-9159036301",
        "availableLanguage": ["Tamil", "English"]
      }
    },
    {
      "@type": "ProfessionalService",
      "@id": "https://velvi.date/#localservice",
      "name": "Velvi — Vedic Services & Vadhyar Software",
      "alternateName": "வேள்வி வாத்தியார் சேவைகள்",
      "url": "https://velvi.date",
      "telephone": "+91-9159036301",
      "email": "support@velvi.date",
      "priceRange": "₹₹",
      "address": {
        "@type": "PostalAddress",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      },
      "areaServed": [
        "Tamil Nadu",
        "Chennai",
        "Coimbatore",
        "Madurai",
        "Tiruchirappalli",
        "Salem",
        "Bengaluru",
        "India"
      ],
      "serviceType": [
        "Vedic Pooja Management Software",
        "Tamil Vadhyar Booking Platform",
        "Purohit Scheduling & Dakshina Accounting",
        "Pooja Samagri WhatsApp Checklist"
      ]
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://velvi.date/#software",
      "name": "Velvi — Vedic Services & Pooja Management Platform",
      "alternateName": "வேள்வி வாத்தியார் செயலி",
      "operatingSystem": "Web, iOS, Android, PWA",
      "applicationCategory": "BusinessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "INR",
        "category": "30-Day Free Trial Available"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "128",
        "bestRating": "5",
        "worstRating": "1"
      },
      "description":
        "Velvi is the leading Vedic booking and devotee CRM app for Tamil Vadhyars, Iyers, and Purohits. Manage Ganapathi Homam, Grihapravesam, and Vivaham bookings, WhatsApp samagri lists, muhurtham timings, and dakshina receipts.",
      "featureList": [
        "Priest and Devotee Booking Management",
        "One-Click WhatsApp Samagri & Muhurtham Sharing",
        "Vedic Calendar & Muhurtham Tracking",
        "Devotee Dakshina & Payment Accounting",
        "Client Gotram & Nakshatram Directory",
        "100% Offline-Ready Progressive Web App (PWA)"
      ]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://velvi.date/#breadcrumbs",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://velvi.date"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Pricing",
          "item": "https://velvi.date/pricing"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Login",
          "item": "https://velvi.date/login"
        },
        {
          "@type": "ListItem",
          "position": 4,
          "name": "Contact",
          "item": "https://velvi.date/contact"
        }
      ]
    },
    {
      "@type": "FAQPage",
      "@id": "https://velvi.date/#faq",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is Velvi (வேள்வி) and who is it for?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Velvi (வேள்வி) is a modern, mobile-friendly platform and PWA designed specifically for Tamil Vadhyars, Iyers, Vedic Purohits, and religious service providers. It simplifies devotee bookings, muhurtham scheduling, dakshina accounting, and instant WhatsApp samagri checklist sharing."
          }
        },
        {
          "@type": "Question",
          "name": "வாத்தியார் மற்றும் புரோகிதர்களுக்கான சிறந்த செயலி எது? (Best app for Tamil Vadhyars & Purohits?)",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "தமிழ்நாட்டில் புரோகிதர்கள், சாஸ்திரிகள் மற்றும் ஐயர்களுக்காக உருவாக்கப்பட்ட பிரத்யேக செயலி வேள்வி (Velvi App). இதில் சுலபமாக பூஜை முன்பதிவு (Pooja Booking), வாடிக்கையாளர் விபரம், சாமக்ரி பட்டியல் மற்றும் தக்ஷிணை கணக்குகளை நிர்வகிக்கலாம்."
          }
        },
        {
          "@type": "Question",
          "name": "Can Velvi share pooja samagri lists on WhatsApp in Tamil?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes! Velvi includes pre-built samagri checklists for Ganapathi Homam, Navagraha Pooja, Satyanarayana Pooja, Grihapravesam, and Vivaham with complete Tamil item names that can be sent directly to devotees via WhatsApp in a single click."
          }
        },
        {
          "@type": "Question",
          "name": "வேள்வி செயலியை எவ்வாறு தொடங்குவது? (How to get started with Velvi?)",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "https://velvi.date/login என்ற இணைப்பில் சென்று உங்கள் Google கணக்கு மூலம் நொடியில் பதிவு செய்யலாம். 30 நாட்கள் இலவசமாக முழு வசதிகளுடன் பயன்படுத்தலாம்."
          }
        },
        {
          "@type": "Question",
          "name": "How to manage muhurtham dates and devotee dakshina receipts with Velvi?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Velvi provides an integrated sacred calendar to schedule muhurtham dates, store devotee gotram and nakshatram records, and generate clear digital dakshina receipts to track cash and online offerings."
          }
        }
      ]
    }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="V0kvApttcPvkHuLlHw8pZBJj2_fWp5fSgZ6jKZYEqCI"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-velvi-cream text-velvi-brownDark" suppressHydrationWarning>
        <GoogleAnalytics />
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <Suspense fallback={null}>
                <VisitorTracker />
              </Suspense>
              {children}
              <FirstTimeInstallPopup />
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
