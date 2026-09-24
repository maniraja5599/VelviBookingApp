"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Business, Subscription, UserRole } from "@/lib/types";
import { db } from "@/lib/db/store";
import { normalizeIndianMobile, maskEmail } from "@/lib/utils/phone";
import { initCloudSync } from "@/lib/supabase/sync";

interface AuthContextType {
  currentUser: User | null;
  currentBusiness: Business | null;
  subscription: Subscription | null;
  isLoading: boolean;
  loginWithGoogle: (email?: string, name?: string, avatarUrl?: string) => Promise<User>;
  loginWithCredentials: (name: string, mobile: string) => Promise<User>;
  loginDemo: () => Promise<User>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  lookupAccountsByMobile: (mobile: string) => Promise<{
    success: boolean;
    users: User[];
    error?: string;
  }>;
  requestAccountRecoveryOtp: (mobile: string) => Promise<{ success: boolean; maskedEmail?: string; error?: string }>;
  verifyAccountRecoveryOtp: (
    mobile: string,
    otp: string
  ) => Promise<{
    success: boolean;
    maskedEmail?: string;
    email?: string;
    userName?: string;
    error?: string;
  }>;
  refreshSubscription: (updatedSub?: Subscription) => void;
  updateBusiness: (updates: Partial<Business>) => void;
  updateUser: (updates: Partial<User>) => void;
  completeOnboarding: (data: {
    mobile: string;
    businessName: string;
    iyerName: string;
    role: "OWNER" | "IYER";
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  currentBusiness: null,
  subscription: null,
  isLoading: true,
  loginWithGoogle: async () => db.users[0],
  loginWithCredentials: async () => db.users[0],
  loginDemo: async () => db.users[0],
  logout: () => {},
  switchRole: () => {},
  lookupAccountsByMobile: async () => ({ success: false, users: [] }),
  requestAccountRecoveryOtp: async () => ({ success: false }),
  verifyAccountRecoveryOtp: async () => ({ success: false }),
  refreshSubscription: () => {},
  updateBusiness: () => {},
  updateUser: () => {},
  completeOnboarding: async () => {},
});

function getInitialAuthState(): {
  user: User | null;
  biz: Business | null;
  sub: Subscription | null;
} {
  if (typeof window === "undefined") {
    return { user: null, biz: null, sub: null };
  }
  try {
    const savedUserId = localStorage.getItem("velvi_active_user_id");
    if (!savedUserId || savedUserId === "LOGGED_OUT") {
      return { user: null, biz: null, sub: null };
    }
    const user = db.users.find((u) => u.id === savedUserId) || null;
    if (!user) return { user: null, biz: null, sub: null };

    if (user.email?.trim().toLowerCase() === "manirajankg@gmail.com") {
      user.role = "SUPER_ADMIN";
    }

    let biz = db.businesses.find((b) => b.ownerId === user.id) || null;
    if (!biz && user.id === "u-ravi-iyer-01") {
      biz = db.businesses[0] || null;
    } else if (!biz) {
      const bizId = `biz-${user.id}`;
      biz = {
        id: bizId,
        ownerId: user.id,
        name: user.name || "Pooja Services",
        serviceName: "Pooja • Homam • Seva",
        iyerName: user.name || "Vadhyar",
        phone: user.mobile || "",
        whatsapp: user.mobile || "",
        address: "தமிழ்நாடு, இந்தியா",
        showWatermark: true,
        createdAt: new Date().toISOString(),
      };
      db.businesses.push(biz);
      db.seedDefaultPoojasForBusiness(bizId);
      db.saveToLocalStorage();
    }

    let sub = db.subscriptions.find((s) => s.businessId === biz?.id) || null;
    if (!sub && biz) {
      if (user.id === "u-ravi-iyer-01") {
        sub = db.subscriptions[0] || null;
      } else {
        const now = new Date();
        const end = new Date(Date.now() + 30 * 86400000);
        sub = {
          id: `sub-${biz.id}`,
          businessId: biz.id,
          planName: "Velvi Pro Monthly",
          planCode: "VELVI_PRO",
          status: "ACTIVE",
          trialStart: now.toISOString(),
          trialEnd: end.toISOString(),
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: end.toISOString(),
          billingCycle: "MONTHLY",
          autoRenew: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        db.subscriptions.push(sub);
        db.saveToLocalStorage();
      }
    }
    return { user, biz, sub };
  } catch {
    return { user: null, biz: null, sub: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialState] = useState(getInitialAuthState);
  const [currentUser, setCurrentUser] = useState<User | null>(initialState.user);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(initialState.biz);
  const [subscription, setSubscription] = useState<Subscription | null>(initialState.sub);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const syncState = React.useCallback(() => {
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("velvi_active_user_id") : null;

    if (!savedUserId || savedUserId === "LOGGED_OUT") {
      setCurrentUser(null);
      setCurrentBusiness(null);
      setSubscription(null);
      return;
    }

    const user = db.users.find((u) => u.id === savedUserId);
    if (!user) {
      setCurrentUser(null);
      setCurrentBusiness(null);
      setSubscription(null);
      return;
    }

    if (user.email?.trim().toLowerCase() === "manirajankg@gmail.com") {
      user.role = "SUPER_ADMIN";
    }

    setCurrentUser({ ...user });

    if (user.role === "SUPER_ADMIN") {
      setCurrentBusiness(db.businesses[0]);
      setSubscription(db.subscriptions[0]);
    } else {
      let biz = db.businesses.find((b) => b.ownerId === user.id);
      if (!biz && user.id === "u-ravi-iyer-01") {
        biz = db.businesses[0];
      } else if (!biz) {
        const bizId = `biz-${user.id}`;
        biz = {
          id: bizId,
          ownerId: user.id,
          name: user.name || "Pooja Services",
          serviceName: "Pooja • Homam • Seva",
          iyerName: user.name || "Vadhyar",
          phone: user.mobile || "",
          whatsapp: user.mobile || "",
          address: "தமிழ்நாடு, இந்தியா",
          showWatermark: true,
          createdAt: new Date().toISOString(),
        };
        db.businesses.push(biz);
        db.seedDefaultPoojasForBusiness(bizId);
        db.saveToLocalStorage();
      }

      // If business logoUrl was auto-populated with user's personal Google avatar, clear it so default Velvi logo displays
      if (
        biz &&
        biz.logoUrl &&
        (biz.logoUrl === user.avatarUrl ||
          biz.logoUrl.includes("googleusercontent.com") ||
          biz.logoUrl.includes("dicebear.com"))
      ) {
        biz.logoUrl = undefined;
        db.saveToLocalStorage();
      }
      setCurrentBusiness(biz ? { ...biz } : null);

      let sub = db.subscriptions.find((s) => s.businessId === biz?.id);
      if (!sub && biz) {
        if (user.id === "u-ravi-iyer-01") {
          sub = db.subscriptions[0];
        } else {
          const now = new Date();
          const end = new Date(Date.now() + 30 * 86400000);
          sub = {
            id: `sub-${biz.id}`,
            businessId: biz.id,
            planName: "Velvi Pro Monthly",
            planCode: "VELVI_PRO",
            status: "ACTIVE",
            trialStart: now.toISOString(),
            trialEnd: end.toISOString(),
            currentPeriodStart: now.toISOString(),
            currentPeriodEnd: end.toISOString(),
            billingCycle: "MONTHLY",
            autoRenew: true,
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          };
          db.subscriptions.push(sub);
          db.saveToLocalStorage();
        }
      }
      setSubscription(sub || null);
    }
  }, []);

  useEffect(() => {
    syncState();
    setIsLoading(false);
    if (typeof window !== "undefined") {
      (window as any).velviDb = db;
    }
  }, [syncState]);

  useEffect(() => {
    const handleDbChange = () => {
      if (currentBusiness) {
        const sub = db.getSubscription(currentBusiness.id);
        if (sub) {
          setSubscription({ ...sub });
        }
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("velvi:db-change", handleDbChange);
      return () => window.removeEventListener("velvi:db-change", handleDbChange);
    }
  }, [currentBusiness]);

  useEffect(() => {
    if (currentBusiness?.id) {
      initCloudSync(currentBusiness.id).catch(() => {});
    }
  }, [currentBusiness?.id]);

  const loginWithCredentials = React.useCallback(
    async (name: string, mobile: string): Promise<User> => {
      setIsLoading(true);
      const cleanDigits = mobile.replace(/\D/g, "");
      const normalized = normalizeIndianMobile(cleanDigits);

      let clientIp = "106.210.142.88";
      let clientCity = "Chennai";
      let clientCountry = "India";
      try {
        const ipRes = await fetch("/api/auth/client-ip");
        const ipData = await ipRes.json();
        if (ipData?.ip) clientIp = ipData.ip;
        if (ipData?.city) clientCity = ipData.city;
        if (ipData?.country) clientCountry = ipData.country;
      } catch {}

      let user = db.users.find((u) => u.mobile && normalizeIndianMobile(u.mobile) === normalized);
      if (!user) {
        const trimmedName = name.trim() || "Vedic Priest";
        const sanitizedName = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, "") || "priest";
        user = {
          id: `u-${Date.now()}`,
          googleId: `phone-${Date.now()}`,
          email: `${sanitizedName}@velvi.app`,
          name: trimmedName,
          mobile: normalized,
          mobileVerified: true,
          role: "OWNER",
          referralCode: `VELVI-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          registrationIp: clientIp,
          lastLoginIp: clientIp,
          registrationCity: clientCity,
          registrationCountry: clientCountry,
          lastLoginCity: clientCity,
          lastLoginCountry: clientCountry,
        };
        db.users.push(user);

        // Also create a business profile for this priest
        const bizId = `biz-${Date.now()}`;
        const newBiz: Business = {
          id: bizId,
          ownerId: user.id,
          name: trimmedName,
          serviceName: "Pooja • Homam • Seva",
          iyerName: trimmedName,
          phone: normalized,
          whatsapp: normalized,
          address: "தமிழ்நாடு, இந்தியா",
          showWatermark: true,
          createdAt: new Date().toISOString(),
        };
        db.businesses.push(newBiz);
        db.seedDefaultPoojasForBusiness(bizId);

        // Assign 30-day Pro subscription
        const now = new Date();
        const end = new Date(Date.now() + 30 * 86400000);
        db.subscriptions.push({
          id: `sub-${Date.now()}`,
          businessId: bizId,
          planName: "Velvi Pro Monthly",
          planCode: "VELVI_PRO",
          status: "ACTIVE",
          trialStart: now.toISOString(),
          trialEnd: end.toISOString(),
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: end.toISOString(),
          billingCycle: "MONTHLY",
          autoRenew: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      } else {
        if (name.trim()) {
          user.name = name.trim();
        }
        user.mobileVerified = true;
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("velvi_active_user_id", user.id);
      }
      db.saveToLocalStorage();
      syncState();
      setIsLoading(false);
      return user;
    },
    [syncState]
  );

  const loginDemo = React.useCallback(async (): Promise<User> => {
    setIsLoading(true);
    let clientIp = "106.210.142.88";
    let clientCity = "Chennai";
    let clientCountry = "India";
    try {
      const ipRes = await fetch("/api/auth/client-ip");
      const ipData = await ipRes.json();
      if (ipData?.ip) clientIp = ipData.ip;
      if (ipData?.city) clientCity = ipData.city;
      if (ipData?.country) clientCountry = ipData.country;
    } catch {}

    const demoUser = db.users[0]; // Ravi Iyer
    demoUser.lastLoginIp = clientIp;
    demoUser.lastLoginCity = clientCity;
    demoUser.lastLoginCountry = clientCountry;

    // Record login in audit logs for Super Admin
    db.logAudit({
      actorId: demoUser.id,
      actorName: demoUser.name,
      action: "DEMO_LOGIN",
      targetType: "AUTH_SESSION",
      targetId: demoUser.id,
      ipAddress: clientIp,
      city: clientCity,
      country: clientCountry,
      reason: "User accessed Quick Demo mode (20-Booking Cap)",
      newValue: { ip: clientIp, city: clientCity, country: clientCountry },
    });

    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", demoUser.id);
    }
    db.saveToLocalStorage();
    syncState();
    setIsLoading(false);
    return demoUser;
  }, [syncState]);

  const loginWithGoogle = React.useCallback(
    async (email?: string, name?: string, avatarUrl?: string): Promise<User> => {
      setIsLoading(true);
      const targetEmail = (email || `priest.${Date.now().toString().slice(-6)}@gmail.com`).trim().toLowerCase();
      const isSuperAdminEmail =
        targetEmail === "manirajankg@gmail.com" || targetEmail === "admin@velvi.app";
      const targetName =
        name ||
        (isSuperAdminEmail
          ? "Maniraja (Super Admin)"
          : targetEmail === "ravi.iyer@gmail.com"
          ? "Ravi Iyer"
          : "Vedic Priest");

      let clientIp = "106.210.142.88";
      let clientCity = "Chennai";
      let clientCountry = "India";
      try {
        const ipRes = await fetch("/api/auth/client-ip");
        const ipData = await ipRes.json();
        if (ipData?.ip) clientIp = ipData.ip;
        if (ipData?.city) clientCity = ipData.city;
        if (ipData?.country) clientCountry = ipData.country;
      } catch {}

      // Find existing or mock new Google user (case-insensitive email matching)
      let user = db.users.find((u) => u.email.trim().toLowerCase() === targetEmail);
      if (!user) {
        user = {
          id: isSuperAdminEmail ? "u-super-admin-01" : `u-${Date.now()}`,
          googleId: `google-${Date.now()}`,
          email: targetEmail,
          name: targetName,
          avatarUrl: avatarUrl || undefined,
          mobile: isSuperAdminEmail ? "+918300030123" : "",
          mobileVerified: isSuperAdminEmail,
          role: isSuperAdminEmail ? "SUPER_ADMIN" : "OWNER",
          referralCode: isSuperAdminEmail
            ? "VELVI-MANI-DEV"
            : `VELVI-${Math.floor(1000 + Math.random() * 9000)}`,
          createdAt: new Date().toISOString(),
          registrationIp: clientIp,
          lastLoginIp: clientIp,
          registrationCity: clientCity,
          registrationCountry: clientCountry,
          lastLoginCity: clientCity,
          lastLoginCountry: clientCountry,
        };
        db.users.push(user);
      } else {
        user.lastLoginIp = clientIp;
        user.lastLoginCity = clientCity;
        user.lastLoginCountry = clientCountry;
        if (!user.registrationIp) {
          user.registrationIp = clientIp;
          user.registrationCity = clientCity;
          user.registrationCountry = clientCountry;
        }
        if (isSuperAdminEmail) {
          user.role = "SUPER_ADMIN";
        }
        if (avatarUrl) {
          user.avatarUrl = avatarUrl;
        }
        if (name && name.trim()) {
          user.name = name.trim();
        }
      }

      // Log login event in audit logs
      db.logAudit({
        actorId: user.id,
        actorName: user.name,
        action: "GOOGLE_LOGIN",
        targetType: "AUTH_SESSION",
        targetId: user.id,
        ipAddress: clientIp,
        city: clientCity,
        country: clientCountry,
        reason: isSuperAdminEmail ? "Super Admin logged in" : "Priest signed in with Google",
        newValue: { ip: clientIp, city: clientCity, country: clientCountry, email: targetEmail },
      });

      // Ensure business profile exists for this user
      let biz = db.businesses.find((b) => b.ownerId === user.id);
      if (!biz) {
        const bizId = `biz-${Date.now()}`;
        biz = {
          id: bizId,
          ownerId: user.id,
          name: user.name || "Pooja Services",
          serviceName: "Pooja • Homam • Seva",
          iyerName: user.name || "Vadhyar",
          logoUrl: undefined, // Default to Velvi sacred logo
          phone: user.mobile || "",
          whatsapp: user.mobile || "",
          address: "தமிழ்நாடு, இந்தியா",
          showWatermark: true,
          createdAt: new Date().toISOString(),
        };
        db.businesses.push(biz);
        db.seedDefaultPoojasForBusiness(bizId);

        const now = new Date();
        const end = new Date(Date.now() + 30 * 86400000);
        db.subscriptions.push({
          id: `sub-${Date.now()}`,
          businessId: bizId,
          planName: "Velvi Pro Monthly",
          planCode: "VELVI_PRO",
          status: "ACTIVE",
          trialStart: now.toISOString(),
          trialEnd: end.toISOString(),
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: end.toISOString(),
          billingCycle: "MONTHLY",
          autoRenew: true,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      } else {
        // If logoUrl was previously auto-set to user Google avatar, clear it
        if (
          biz.logoUrl &&
          (biz.logoUrl === user.avatarUrl ||
            biz.logoUrl.includes("googleusercontent.com") ||
            biz.logoUrl.includes("dicebear.com"))
        ) {
          biz.logoUrl = undefined;
        }
        if (!biz.iyerName && user.name) {
          biz.iyerName = user.name;
        }
      }

    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", user.id);
    }
    db.saveToLocalStorage();
    syncState();
    setIsLoading(false);
    return user;
  }, [syncState]);

  const logout = React.useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", "LOGGED_OUT");
    }
    setCurrentUser(null);
    setCurrentBusiness(null);
    setSubscription(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const switchRole = React.useCallback((role: UserRole) => {
    let target = db.users.find((u) => u.role === role);
    if (!target) {
      if (role === "SUPER_ADMIN") target = db.users.find((u) => u.id === "u-super-admin-01");
      else if (role === "IYER") target = db.users.find((u) => u.id === "u-suresh-iyer-02");
      else target = db.users[0];
    }
    if (target) {
      localStorage.setItem("velvi_active_user_id", target.id);
      syncState();
    }
  }, [syncState]);

  const lookupAccountsByMobile = React.useCallback(async (rawMobile: string) => {
    const normalized = normalizeIndianMobile(rawMobile);
    const users = db.findUsersByMobile(normalized);
    if (!users || users.length === 0) {
      return {
        success: false,
        users: [],
        error: "No Google accounts registered with this mobile number.",
      };
    }
    return { success: true, users };
  }, []);

  const requestAccountRecoveryOtp = React.useCallback(async (rawMobile: string) => {
    const normalized = normalizeIndianMobile(rawMobile);
    const user = db.findUserByMobile(normalized);
    if (!user) {
      return { success: false, error: "No Velvi account found for this mobile number." };
    }
    // Simulation: In production, sends SMS OTP. For MVP recovery, test OTP is "123456"
    return { success: true };
  }, []);

  const verifyAccountRecoveryOtp = React.useCallback(async (rawMobile: string, otp: string) => {
    const normalized = normalizeIndianMobile(rawMobile);
    const user = db.findUserByMobile(normalized);
    if (!user) {
      return { success: false, error: "Account not found." };
    }
    if (otp !== "123456" && otp !== "000000") {
      return { success: false, error: "Invalid OTP. Use demo OTP 123456." };
    }
    return {
      success: true,
      maskedEmail: maskEmail(user.email),
      email: user.email,
      userName: user.name,
    };
  }, []);

  const refreshSubscription = React.useCallback((updatedSub?: Subscription) => {
    if (updatedSub) {
      setSubscription({ ...updatedSub });
      return;
    }
    if (currentBusiness) {
      const sub = db.getSubscription(currentBusiness.id);
      if (sub) setSubscription({ ...sub });
    }
  }, [currentBusiness]);

  const completeOnboarding = React.useCallback(async (data: {
    mobile: string;
    businessName: string;
    iyerName: string;
    role: "OWNER" | "IYER";
  }) => {
    if (!currentUser) return;
    const normalizedMobile = normalizeIndianMobile(data.mobile);

    // Update current user
    currentUser.mobile = normalizedMobile;
    currentUser.role = data.role;

    // Create business
    const newBiz: Business = {
      id: `biz-${Date.now()}`,
      ownerId: currentUser.id,
      name: (data.businessName || "").trim(),
      iyerName: (data.iyerName || "").trim(),
      phone: normalizedMobile,
      whatsapp: "",
      address: "",
      showWatermark: true,
      createdAt: new Date().toISOString(),
    };
    db.businesses.push(newBiz);
    db.seedDefaultPoojasForBusiness(newBiz.id);

    // Add as member
    db.members.push({
      id: `m-${Date.now()}`,
      businessId: newBiz.id,
      userId: currentUser.id,
      name: data.iyerName,
      mobile: normalizedMobile,
      role: "OWNER",
      active: true,
      createdAt: new Date().toISOString(),
    });

    // Start 30-Day Free Trial
    const newSub: Subscription = {
      id: `sub-${Date.now()}`,
      businessId: newBiz.id,
      planName: "Velvi Pro",
      planCode: "VELVI_PRO",
      status: "TRIAL",
      trialStart: new Date().toISOString(),
      trialEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
      billingCycle: "MONTHLY",
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.subscriptions.push(newSub);

    // Record audit
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: newBiz.id,
      actorName: currentUser.name,
      action: "ACCOUNT_ONBOARDED",
      targetType: "USER",
      targetId: currentUser.id,
      newValue: { businessId: newBiz.id, trialDays: 30 },
      reason: "Completed onboarding wizard",
      createdAt: new Date().toISOString(),
    });

    syncState();
  }, [currentUser, syncState]);

  const updateBusiness = React.useCallback((updates: Partial<Business>) => {
    const activeUserId = currentUser?.id || (typeof window !== "undefined" ? localStorage.getItem("velvi_active_user_id") : null);
    const biz = currentBusiness || (activeUserId ? db.businesses.find((b) => b.ownerId === activeUserId) : null);
    if (!biz) return;
    const bizIndex = db.businesses.findIndex((b) => b.id === biz.id);
    if (bizIndex >= 0) {
      db.businesses[bizIndex] = { ...db.businesses[bizIndex], ...updates };
      db.saveToLocalStorage();
      setCurrentBusiness({ ...db.businesses[bizIndex] });
    }
  }, [currentBusiness, currentUser]);

  const updateUser = React.useCallback((updates: Partial<User>) => {
    const activeUserId = currentUser?.id || (typeof window !== "undefined" ? localStorage.getItem("velvi_active_user_id") : null);
    if (!activeUserId) return;
    const userIndex = db.users.findIndex((u) => u.id === activeUserId);
    if (userIndex >= 0) {
      db.users[userIndex] = { ...db.users[userIndex], ...updates };
      db.saveToLocalStorage();
      setCurrentUser({ ...db.users[userIndex] });
    }
  }, [currentUser]);

  const authContextValue = React.useMemo(
    () => ({
      currentUser,
      currentBusiness,
      subscription,
      isLoading,
      loginWithGoogle,
      loginWithCredentials,
      loginDemo,
      logout,
      switchRole,
      lookupAccountsByMobile,
      requestAccountRecoveryOtp,
      verifyAccountRecoveryOtp,
      refreshSubscription,
      updateBusiness,
      updateUser,
      completeOnboarding,
    }),
    [
      currentUser,
      currentBusiness,
      subscription,
      isLoading,
      loginWithGoogle,
      loginWithCredentials,
      loginDemo,
      logout,
      switchRole,
      lookupAccountsByMobile,
      requestAccountRecoveryOtp,
      verifyAccountRecoveryOtp,
      refreshSubscription,
      updateBusiness,
      updateUser,
      completeOnboarding,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
