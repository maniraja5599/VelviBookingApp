import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact & Support — Velvi Sacred Tech (+91 9159036301)",
  description:
    "Contact the Velvi team for onboarding assistance, technical support, or inquiries. Available via WhatsApp and phone at +91 9159036301 or email support@velvi.date.",
  alternates: {
    canonical: "https://velvi.date/contact",
  },
  openGraph: {
    title: "Contact Velvi Sacred Tech",
    description:
      "Official support desk for Velvi Vedic Management App. Phone: +91 9159036301, Email: support@velvi.date.",
    url: "https://velvi.date/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
