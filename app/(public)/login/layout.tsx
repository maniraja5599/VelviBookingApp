import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login — Velvi | Access Your Vedic Management Workspace",
  description:
    "Sign in to Velvi Vedic Management platform. Access your pooja calendar, devotee records, dakshina accounts, and WhatsApp checklists securely with Google or Phone login.",
  alternates: {
    canonical: "https://velvi.date/login",
  },
  openGraph: {
    title: "Sign in to Velvi — Sacred Vedic Workspace",
    description:
      "Sign in with Google or Phone to manage your pooja bookings, devotee contacts, and muhurtham dates.",
    url: "https://velvi.date/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
