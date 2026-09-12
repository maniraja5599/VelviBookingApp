"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Business, Subscription, UserRole } from "@/lib/types";
import { db } from "@/lib/db/store";
import { normalizeIndianMobile, maskEmail } from "@/lib/utils/phone";

interface AuthContextType {
  currentUser: User | null;
  currentBusiness: Business | null;
  subscription: Subscription | null;
  isLoading: boolean;
  loginWithGoogle: (email?: string, name?: string) => Promise<User>;
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
  refreshSubscription: () => void;
  updateBusiness: (updates: Partial<Business>) => void;
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
  logout: () => {},
  switchRole: () => {},
  lookupAccountsByMobile: async () => ({ success: false, users: [] }),
  requestAccountRecoveryOtp: async () => ({ success: false }),
  verifyAccountRecoveryOtp: async () => ({ success: false }),
  refreshSubscription: () => {},
  updateBusiness: () => {},
  completeOnboarding: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncState = () => {
    const savedUserId = typeof window !== "undefined" ? localStorage.getItem("velvi_active_user_id") : null;
    
    if (savedUserId === "LOGGED_OUT") {
      setCurrentUser(null);
      setCurrentBusiness(null);
      setSubscription(null);
      return;
    }

    const user = (savedUserId ? db.users.find((u) => u.id === savedUserId) : null) || db.users[0];

    setCurrentUser(user);

    if (user.role === "SUPER_ADMIN") {
      setCurrentBusiness(db.businesses[0]);
      setSubscription(db.subscriptions[0]);
    } else {
      const biz = db.businesses.find((b) => b.ownerId === user.id) || db.businesses[0];
      setCurrentBusiness(biz);
      const sub = db.subscriptions.find((s) => s.businessId === biz.id) || db.subscriptions[0];
      setSubscription(sub);
    }
  };

  useEffect(() => {
    syncState();
    setIsLoading(false);
    if (typeof window !== "undefined") {
      (window as any).velviDb = db;
    }
  }, []);

  const loginWithGoogle = async (email?: string, name?: string): Promise<User> => {
    setIsLoading(true);
    // Find existing or mock new Google user
    let user = db.users.find((u) => u.email === (email || "ravi.iyer@gmail.com"));
    if (!user) {
      user = {
        id: `u-${Date.now()}`,
        googleId: `google-${Date.now()}`,
        email: email || "new.iyer@gmail.com",
        name: name || "New Iyer",
        mobile: "",
        mobileVerified: false,
        role: "OWNER",
        referralCode: `VELVI-${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", user.id);
    }
    syncState();
    setIsLoading(false);
    return user;
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", "LOGGED_OUT");
    }
    setCurrentUser(null);
    setCurrentBusiness(null);
    setSubscription(null);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  const switchRole = (role: UserRole) => {
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
  };

  const lookupAccountsByMobile = async (rawMobile: string) => {
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
  };

  const requestAccountRecoveryOtp = async (rawMobile: string) => {
    const normalized = normalizeIndianMobile(rawMobile);
    const user = db.findUserByMobile(normalized);
    if (!user) {
      return { success: false, error: "No Velvi account found for this mobile number." };
    }
    // Simulation: In production, sends SMS OTP. For MVP recovery, test OTP is "123456"
    return { success: true };
  };

  const verifyAccountRecoveryOtp = async (rawMobile: string, otp: string) => {
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
  };

  const refreshSubscription = () => {
    if (currentBusiness) {
      const sub = db.getSubscription(currentBusiness.id);
      if (sub) setSubscription({ ...sub });
    }
  };

  const completeOnboarding = async (data: {
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
  };

  const updateBusiness = (updates: Partial<Business>) => {
    if (!currentBusiness) return;
    const bizIndex = db.businesses.findIndex((b) => b.id === currentBusiness.id);
    if (bizIndex >= 0) {
      db.businesses[bizIndex] = { ...db.businesses[bizIndex], ...updates };
      setCurrentBusiness({ ...db.businesses[bizIndex] });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentBusiness,
        subscription,
        isLoading,
        loginWithGoogle,
        logout,
        switchRole,
        lookupAccountsByMobile,
        requestAccountRecoveryOtp,
        verifyAccountRecoveryOtp,
        refreshSubscription,
        updateBusiness,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
