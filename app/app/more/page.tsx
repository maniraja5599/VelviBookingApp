"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";

export default function MoreMenuPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  useEffect(() => {
    // Redirect to unified Settings page (Admin portal is role-gated for currentUser?.role === "SUPER_ADMIN")
    router.replace("/app/settings");
  }, [router, currentUser]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
