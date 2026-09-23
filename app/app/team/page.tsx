"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { BusinessMember } from "@/lib/types";
import { normalizeIndianMobile } from "@/lib/utils/phone";
import { Plus, UserCheck, Phone, MessageCircle, MoreVertical, X, Sparkles, Check } from "lucide-react";

export default function TeamPage() {
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIyer, setSelectedIyer] = useState<BusinessMember | null>(null);

  React.useEffect(() => {
    setMembers(db.getMembers(businessId));
    const handleDbChange = () => setMembers([...db.getMembers(businessId)]);
    window.addEventListener("velvi:db-change", handleDbChange);
    return () => window.removeEventListener("velvi:db-change", handleDbChange);
  }, [businessId]);

  // New Iyer form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [workingHours, setWorkingHours] = useState("06:00 - 20:00");

  const handleAddIyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim()) return;

    const normalizedMobile = normalizeIndianMobile(mobile);
    const newMember: BusinessMember = {
      id: `m-${Date.now()}`,
      businessId,
      userId: `u-${Date.now()}`,
      name: name.trim(),
      mobile: normalizedMobile,
      role: "IYER",
      active: true,
      specialization: specialization.trim() || "General Vedic Rituals",
      workingDays: "All days",
      workingHours,
      bookingCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.members.push(newMember);
    setMembers([...db.getMembers(businessId)]);
    setShowAddModal(false);
    setName("");
    setMobile("");
    setSpecialization("");
  };

  const toggleActiveStatus = (member: BusinessMember) => {
    member.active = !member.active;
    setMembers([...db.getMembers(businessId)]);
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">My Team</h2>
          <p className="text-xs text-velvi-brown/60">{members.length} Iyers & Purohits</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
          <span>Add Iyer</span>
        </button>
      </div>

      {/* Iyers List */}
      <div className="space-y-2.5">
        {members.map((iyer) => {
          const initials = iyer.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={iyer.id}
              onClick={() => setSelectedIyer(iyer)}
              className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-velvi-brown to-velvi-gold text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {initials}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
                    <span>{iyer.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                        iyer.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {iyer.active ? "Active" : "Inactive"}
                    </span>
                  </h4>
                  <p className="text-xs text-velvi-brown/70 mt-0.5">{iyer.specialization}</p>
                  <p className="text-[11px] text-velvi-goldDark font-semibold">
                    {iyer.bookingCount || 8} bookings this month
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${iyer.mobile}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown rounded-xl transition"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Iyer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-velvi-gold/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-velvi-brownDark">Add New Iyer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddIyer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Iyer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Venkatesh Iyer"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43213"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ganapathi & Sudarshana Homam"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-velvi-cream text-velvi-brown rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Iyer Detail & Settlement Setting Drawer */}
      {selectedIyer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-velvi-gold animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-velvi-brownDark">{selectedIyer.name}</h3>
                <p className="text-xs text-velvi-brown/70">{selectedIyer.mobile}</p>
              </div>
              <button
                onClick={() => setSelectedIyer(null)}
                className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Status</span>
                <button
                  onClick={() => toggleActiveStatus(selectedIyer)}
                  className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                    selectedIyer.active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {selectedIyer.active ? "Active (Tap to disable)" : "Inactive (Tap to enable)"}
                </button>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Specialization</span>
                <span className="font-bold text-velvi-brownDark">
                  {selectedIyer.specialization}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Working Hours</span>
                <span className="font-semibold text-velvi-brownDark">
                  {selectedIyer.workingHours}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedIyer(null)}
              className="w-full py-3 bg-velvi-brown text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
