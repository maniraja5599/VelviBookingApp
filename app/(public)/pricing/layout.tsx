import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing & Plans — Velvi | Sacred Vedic Management Platform (₹499/mo)",
  description:
    "Transparent pricing for Tamil Vadhyars, Purohits, and Vedic service providers. 30-day free trial. Unlimited devotee bookings, automated WhatsApp samagri checklists, muhurtham calendar, and dakshina accounting.",
  alternates: {
    canonical: "https://velvi.date/pricing",
  },
  openGraph: {
    title: "Velvi Pricing — ₹499/mo for Full Sacred Vedic Management",
    description:
      "Start your 30-day free trial today. Includes pooja bookings, WhatsApp samagri checklists, muhurtham calendar, and devotee dakshina receipts.",
    url: "https://velvi.date/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
