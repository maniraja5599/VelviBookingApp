"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Customer, BusinessMember, Booking } from "@/lib/types";
import {
  normalizeIndianMobile,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "@/lib/utils/phone";
import {
  Search,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  MoreVertical,
  User,
  X,
  IndianRupee,
  Clipboard,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Sparkles,
  ChevronRight,
} from "lucide-react";

export default function CustomersPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [activeTab, setActiveTab] = useState<"devotees" | "priests">("devotees");
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [members, setMembers] = useState<BusinessMember[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Priest Tab States
  const [priestSearch, setPriestSearch] = useState("");
  const [selectedPriest, setSelectedPriest] = useState<BusinessMember | null>(null);
  const [showAddPriestModal, setShowAddPriestModal] = useState(false);
  const [newPriestName, setNewPriestName] = useState("");
  const [newPriestMobile, setNewPriestMobile] = useState("");
  const [newPriestSpec, setNewPriestSpec] = useState("உதவி குருக்கள் (Assistant Priest)");
  const [priestError, setPriestError] = useState("");

  React.useEffect(() => {
    const update = () => {
      setCustomers(db.getCustomers(businessId));
      setMembers(db.getMembers(businessId));
    };
    update();
    window.addEventListener("velvi:db-change", update);
    return () => window.removeEventListener("velvi:db-change", update);
  }, [businessId]);

  // New customer form
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Namakkal");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState("");

  const mobileInspection = inspectIndianMobile(mobile);

  const handleMobileChange = (val: string) => {
    const cleaned = cleanPastedIndianMobile(val);
    setMobile(cleaned);
  };

  const handleMobilePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const cleaned = cleanPastedIndianMobile(pastedText);
    setMobile(cleaned);
  };

  const handlePasteButtonClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = cleanPastedIndianMobile(text);
      if (cleaned) {
        setMobile(cleaned);
      }
    } catch {
      // Ignore if clipboard permissions not granted
    }
  };

  // 1. Deduplicate Priest Members
  const uniqueMembers = React.useMemo(() => {
    const seen = new Set<string>();
    return members.filter((m) => {
      const cleanMobile = m.mobile ? normalizeIndianMobile(m.mobile) : "";
      const key = cleanMobile ? `m:${cleanMobile}` : `id:${m.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [members]);

  // 2. Index priest mobiles & names to eliminate duplicate/mismatch with devotees
  const priestMemberMobiles = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of uniqueMembers) {
      if (m.mobile) set.add(normalizeIndianMobile(m.mobile));
      if (m.name) set.add(m.name.trim().toLowerCase());
    }
    return set;
  }, [uniqueMembers]);

  // 3. Deduplicate Devotees and filter out priest members to avoid duplicate/mismatch
  const uniqueCustomers = React.useMemo(() => {
    const seen = new Set<string>();
    return customers.filter((c) => {
      const cleanMobile = c.mobile ? normalizeIndianMobile(c.mobile) : "";
      if (cleanMobile && priestMemberMobiles.has(cleanMobile)) return false;
      if (c.name && priestMemberMobiles.has(c.name.trim().toLowerCase())) return false;
      const key = cleanMobile ? `m:${cleanMobile}` : `id:${c.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customers, priestMemberMobiles]);

  const filteredCustomers = React.useMemo(() => {
    return uniqueCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.mobile && c.mobile.includes(searchQuery)) ||
        (c.city && c.city.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [uniqueCustomers, searchQuery]);

  const filteredPriests = React.useMemo(() => {
    return uniqueMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(priestSearch.toLowerCase()) ||
        (m.mobile && m.mobile.includes(priestSearch)) ||
        (m.specialization && m.specialization.toLowerCase().includes(priestSearch.toLowerCase()))
    );
  }, [uniqueMembers, priestSearch]);

  const allBookings = React.useMemo(() => db.getBookings(businessId), [businessId]);

  const handleAddPriest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriestName.trim()) {
      setPriestError("குருக்கள் பெயர் அவசியம் / Priest Name is required.");
      return;
    }
    setPriestError("");
    db.createMember({
      businessId,
      name: newPriestName.trim(),
      mobile: newPriestMobile.trim(),
      role: "IYER",
      specialization: newPriestSpec.trim() || "உதவி குருக்கள் (Assistant Priest)",
    });
    setNewPriestName("");
    setNewPriestMobile("");
    setNewPriestSpec("உதவி குருக்கள் (Assistant Priest)");
    setShowAddPriestModal(false);
  };

  // Bookings for selected customer
  const selectedCustomerBookings = React.useMemo(() => {
    if (!selectedCustomer) return [];
    return db.getBookings(businessId).filter(
      (b) => b.customerId === selectedCustomer.id || (selectedCustomer.mobile && b.customerMobile === selectedCustomer.mobile)
    );
  }, [selectedCustomer, businessId]);

  // Associated Priest: check latest booking's assigned priest or business default
  const associatedPriest = React.useMemo(() => {
    if (!selectedCustomer) return null;
    const latestWithPriest = selectedCustomerBookings.find((b) => b.assignedIyerName || b.assignedIyerId);
    if (latestWithPriest) {
      const foundMember = members.find((m) => m.id === latestWithPriest.assignedIyerId || m.name === latestWithPriest.assignedIyerName);
      return {
        id: foundMember?.id || latestWithPriest.assignedIyerId,
        name: latestWithPriest.assignedIyerName || foundMember?.name || "வேள்வி தலைமை குருக்கள்",
        mobile: foundMember?.mobile || "",
        role: foundMember?.role || "ASSISTANT",
      };
    }
    const owner = members.find((m) => m.role === "OWNER") || members[0];
    return owner ? {
      id: owner.id,
      name: owner.name,
      mobile: owner.mobile,
      role: owner.role,
    } : {
      id: "default",
      name: currentBusiness?.name || "வேள்வி தலைமை குருக்கள்",
      mobile: currentBusiness?.phone || "",
      role: "OWNER",
    };
  }, [selectedCustomer, selectedCustomerBookings, members, currentBusiness]);

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("வாடிக்கையாளர் பெயர் அவசியம் / Customer Name is required.");
      return;
    }

    let normalizedMobile = "";
    if (mobile.trim()) {
      const cleanDigits = mobile.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        setFormError("சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் அல்லது காலியாக விடவும்.");
        return;
      }
      normalizedMobile = normalizeIndianMobile(cleanDigits);

      // Duplicate check within business
      if (customers.some((c) => c.mobile && normalizeIndianMobile(c.mobile) === normalizedMobile)) {
        setFormError("இந்த மொபைல் எண்ணுடன் ஏற்கனவே ஒரு வாடிக்கையாளர் உள்ளார்.");
        return;
      }
    }

    db.createCustomer({
      businessId,
      name: name.trim(),
      mobile: normalizedMobile,
      whatsapp: normalizedMobile,
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim(),
    });

    setCustomers([...db.getCustomers(businessId)]);
    setShowAddModal(false);
    setName("");
    setMobile("");
    setAddress("");
    setNotes("");
  };

  const handleDeleteCustomer = (customer: Customer) => {
    if (confirm(`Delete devotee "${customer.name}"? (பக்தர் "${customer.name}" விபரத்தை நீக்கவா?)`)) {
      db.deleteCustomer(customer.id);
      setSelectedCustomer(null);
    }
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Sub-Tabs Switcher: Devotees vs Priests */}
      <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveTab("devotees")}
          className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "devotees"
              ? "bg-white text-slate-900 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👥</span>
          <span>பக்தர்கள் / Devotees ({uniqueCustomers.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("priests")}
          className={`flex-1 py-2 rounded-lg transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === "priests"
              ? "bg-white text-slate-900 shadow-2xs font-extrabold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🪔</span>
          <span>குருக்கள் / Priests ({uniqueMembers.length})</span>
        </button>
      </div>

      {activeTab === "devotees" ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-velvi-brownDark">பக்தர்கள் (Devotees)</h2>
              <p className="text-xs text-velvi-brown/60">
                {filteredCustomers.length} registered devotees
              </p>
            </div>

            <button
              id="addCustomerBtn"
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
              <span>புதிய பக்தர் (Add)</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-velvi-brown/40 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customers by name, mobile, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-velvi-gold/20 text-xs text-velvi-brownDark placeholder:text-velvi-brown/40 focus:outline-none focus:border-velvi-gold transition"
            />
          </div>

          {/* Customer List */}
          <div className="space-y-2">
            {filteredCustomers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-velvi-gold/30">
                <User className="w-8 h-8 text-velvi-gold mx-auto mb-2" />
                <h4 className="font-bold text-sm text-velvi-brown">No customers found</h4>
                <p className="text-xs text-velvi-brown/60 mt-1">
                  Add your first customer to quickly assign bookings.
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => {
                const customerBookings = db
                  .getBookings(businessId)
                  .filter((b) => b.customerId === c.id || b.customerMobile === c.mobile);
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="bg-white rounded-2xl p-3 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-velvi-gold/15 text-velvi-brown font-bold text-xs flex items-center justify-center border border-velvi-gold/30">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-velvi-brownDark">{c.name}</h4>
                        <p className="text-xs text-velvi-brown/70 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-velvi-gold shrink-0" />
                          <span>{c.city || "Namakkal"}</span>
                        </p>
                        <p className="text-[11px] text-velvi-brown/60">{c.mobile}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`https://wa.me/${c.mobile.replace(/\D/g, "")}`}
                        onClick={(e) => e.stopPropagation()}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl transition"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                      <a
                        href={`tel:${c.mobile}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 bg-velvi-cream text-velvi-brown hover:bg-velvi-gold/20 rounded-xl transition"
                        title="Call"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* Priests Sub-Tab */
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-emerald-950">குருக்கள் (Priests)</h2>
              <p className="text-xs text-slate-500">
                {filteredPriests.length} assigned priests
              </p>
            </div>

            <button
              onClick={() => setShowAddPriestModal(true)}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>புதிய குருக்கள் (Add)</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search priests by name, mobile, spec..."
              value={priestSearch}
              onChange={(e) => setPriestSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 transition"
            />
          </div>

          {/* Priests List */}
          <div className="space-y-2">
            {filteredPriests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-slate-200">
                <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">No priests found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Add your first assistant priest to assign poojas.
                </p>
              </div>
            ) : (
              filteredPriests.map((m) => {
                const isOwner = m.role === "OWNER" || m.id === "m-owner-01";
                const priestBookings = allBookings.filter((b) => {
                  if (isOwner) {
                    return (
                      b.assignedIyerId === m.id ||
                      b.assignedIyerName === m.name ||
                      b.assignedIyerName === "Ravi Iyer" ||
                      !b.assignedIyerName ||
                      b.assignedIyerName.toLowerCase() === "self"
                    );
                  }
                  return b.assignedIyerId === m.id || b.assignedIyerName === m.name;
                });
                const totalCollections = priestBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedPriest(m)}
                    className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:border-emerald-500 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-950 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
                        {isOwner ? "🪔" : "👥"}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-slate-900">{m.name}</h4>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                              isOwner
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-blue-50 text-blue-900 border-blue-200"
                            }`}
                          >
                            {isOwner ? "Head Priest" : "Assistant"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {m.specialization || "Vedic Rituals & Pooja"}
                        </p>
                        <p className="text-[11px] font-bold text-emerald-900 mt-0.5">
                          🪔 {priestBookings.length} Poojas • ₹{totalCollections.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {m.mobile && (
                        <>
                          <a
                            href={`https://wa.me/${m.mobile.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                            title="WhatsApp Priest"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                          <a
                            href={`tel:${m.mobile}`}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                            title="Call Priest"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-velvi-gold/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-velvi-brownDark">Add Customer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-velvi-brown flex items-center gap-1">
                    <span>அலைபேசி எண் / Mobile</span>
                    <span className="text-[10px] text-gray-500 font-normal">(விருப்பத்தேர்வு / Optional)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteButtonClick}
                    className="text-[10px] font-bold text-velvi-maroon hover:text-velvi-gold flex items-center gap-1 bg-velvi-cream/70 hover:bg-velvi-cream px-2 py-0.5 rounded-md border border-velvi-gold/20 transition active:scale-95"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-3 h-3 text-velvi-gold" />
                    <span>ஒட்டு (Paste)</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="bg-velvi-cream/70 border border-velvi-gold/30 rounded-xl px-2 py-2 text-xs font-bold text-velvi-brownDark flex items-center gap-1 shrink-0 shadow-2xs">
                    <span>🇮🇳</span>
                    <span className="text-[11px]">+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210 (Optional)"
                    value={mobile}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    onPaste={handleMobilePaste}
                    maxLength={10}
                    className="flex-1 min-w-0 bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>

                {/* Live validation indicator */}
                {mobile.trim() ? (
                  <div
                    className={`text-[10px] font-bold mt-1 flex items-center gap-1 ${
                      mobileInspection.status === "VALID"
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    <span>{mobileInspection.messageTa}</span>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-400 mt-1">
                    எண் இல்லாவிட்டாலும் வாடிக்கையாளரைச் சேர்க்கலாம்.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Namakkal"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Street / Area"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="Gothram, star, family notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
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
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Profile Drawer (Point 38) */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-velvi-gold animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-velvi-brownDark">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-velvi-brown/70">{selectedCustomer.mobile}</p>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 text-xs">
              <div>
                <span className="text-velvi-brown/60 block">Address</span>
                <span className="font-bold text-velvi-brownDark">
                  {selectedCustomer.address || selectedCustomer.city || "Not specified"}
                </span>
              </div>
              <div>
                <span className="text-velvi-brown/60 block">Notes</span>
                <span className="font-semibold text-velvi-brownDark">
                  {selectedCustomer.notes || "No notes"}
                </span>
              </div>
            </div>

            {/* Associated Priest Card (Connecting Devotee with Priest & Team) */}
            {associatedPriest && (
              <div className="p-3 bg-gradient-to-br from-amber-50/90 via-white to-amber-100/50 rounded-2xl border border-amber-300 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>ஒதுக்கப்பட்ட வாத்யார் (Assigned Priest)</span>
                  </span>
                  <Link
                    href="/app/team"
                    className="text-[10.5px] font-extrabold text-amber-900 hover:text-amber-950 flex items-center gap-0.5 underline transition"
                    title="வாத்யார்கள் & குழு மேலாண்மை"
                  >
                    <span>குழு பட்டியல் (Team)</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="flex items-center justify-between gap-2.5 bg-white/95 p-2.5 rounded-xl border border-amber-200 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ring-1 ring-amber-400/50">
                      {associatedPriest.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-xs text-slate-900 truncate">
                        {associatedPriest.name}
                      </h4>
                      <p className="text-[10.5px] text-amber-800 font-bold truncate flex items-center gap-1">
                        <span>வாத்யார் • Priest</span>
                        {associatedPriest.mobile && <span>• {associatedPriest.mobile}</span>}
                      </p>
                    </div>
                  </div>

                  {associatedPriest.mobile && (
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={`https://wa.me/${associatedPriest.mobile.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                        title="WhatsApp Priest"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`tel:${associatedPriest.mobile}`}
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg transition"
                        title="Call Priest"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Booking History */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wider">
                Booking History
              </h4>
              {selectedCustomerBookings.length === 0 ? (
                <p className="text-xs text-velvi-brown/60">No past bookings found.</p>
              ) : (
                selectedCustomerBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 bg-velvi-cream/30 rounded-xl border border-velvi-gold/15 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-velvi-brownDark">
                        {b.poojaEnglishName}
                      </div>
                      <div className="text-[11px] text-velvi-brown/60">
                        {b.date} • {b.startTime}
                      </div>
                      <div className="text-[10px] font-bold text-amber-900 mt-0.5 flex items-center gap-1">
                        <span>👤 வாத்யார்:</span>
                        <span>{b.assignedIyerName || associatedPriest?.name || "வேள்வி வாத்யார்"}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-velvi-brownDark">
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </div>
                      <span className="text-[10px] text-green-700 font-semibold">
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleDeleteCustomer(selectedCustomer)}
                className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition border border-rose-200/80 flex items-center justify-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
              <Link
                href={`/app/bookings/quick?customerId=${selectedCustomer.id}&name=${encodeURIComponent(selectedCustomer.name)}&mobile=${encodeURIComponent(selectedCustomer.mobile || "")}`}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-700 to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>புதிய பதிவு (Book Pooja)</span>
              </Link>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD PRIEST                                                         */}
      {/* ========================================================================= */}
      {showAddPriestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                <span>🪔</span>
                <span>புதிய குருக்கள் சேர்க்க / Add Priest</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPriestModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {priestError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {priestError}
              </div>
            )}

            <form onSubmit={handleAddPriest} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  குருக்கள் பெயர் (Priest Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="எ.கா: சுந்தரமூர்த்தி வாத்யார் / Sundar Iyer"
                  value={newPriestName}
                  onChange={(e) => setNewPriestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  மொபைல் எண் (Mobile - Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={newPriestMobile}
                    onChange={(e) => setNewPriestMobile(cleanPastedIndianMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பொறுப்பு / சிறப்பு (Specialization)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா: உதவி குருக்கள் / ஹோமம் & பூஜா"
                  value={newPriestSpec}
                  onChange={(e) => setNewPriestSpec(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPriestModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ரத்து / Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                >
                  ✓ சேமி / Save Priest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: PRIEST PROFILE & FULL COLLECTIONS                                 */}
      {/* ========================================================================= */}
      {selectedPriest && (() => {
        const isOwner = selectedPriest.role === "OWNER" || selectedPriest.id === "m-owner-01";
        const priestBookings = allBookings.filter((b) => {
          if (isOwner) {
            return (
              b.assignedIyerId === selectedPriest.id ||
              b.assignedIyerName === selectedPriest.name ||
              b.assignedIyerName === "Ravi Iyer" ||
              !b.assignedIyerName ||
              b.assignedIyerName.toLowerCase() === "self"
            );
          }
          return b.assignedIyerId === selectedPriest.id || b.assignedIyerName === selectedPriest.name;
        });
        const totalBilled = priestBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const directPriestAmount = priestBookings
          .filter((b) => b.paymentRecipient === "PRIEST")
          .reduce((sum, b) => sum + (b.advanceAmount || (b.paymentStatus === "PAID" ? b.totalAmount : 0)), 0);
        const businessAccountAmount = totalBilled - directPriestAmount;
        const totalPending = priestBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto space-y-4 shadow-2xl border-t-2 border-emerald-500 animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-950 font-black text-xl flex items-center justify-center border border-emerald-300 shrink-0 shadow-2xs">
                    {isOwner ? "🪔" : "👥"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-lg text-slate-900 leading-tight">
                        {selectedPriest.name}
                      </h3>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                          isOwner
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-blue-50 text-blue-900 border-blue-200"
                        }`}
                      >
                        {isOwner ? "தலைமை குருக்கள்" : "உதவி குருக்கள்"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {selectedPriest.specialization || "Vedic Rituals & Pooja"}
                    </p>
                    {selectedPriest.mobile && (
                      <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {selectedPriest.mobile}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPriest(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Communication Actions */}
              {selectedPriest.mobile && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedPriest.mobile}`}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Priest</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedPriest.mobile.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Financial & Collection Summary Breakdown */}
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1">
                    <span>📊 மொத்த வசூல் & கணக்கு (Total Collections)</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-800/80 rounded-full text-emerald-200 border border-emerald-700">
                    {priestBookings.length} பூஜைகள்
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">மொத்த தட்சணை (Billed)</span>
                    <span className="text-base font-black text-white">₹{totalBilled.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-rose-300 block">மீதி நிலுவை (Pending)</span>
                    <span className="text-base font-black text-rose-200">₹{totalPending.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Distinct Breakdown: Business Received vs Directly to Priest */}
                <div className="space-y-1.5 pt-1 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                      <span>🏛️</span>
                      <span>நிர்வாகக் கணக்கு (Business Account):</span>
                    </span>
                    <span className="font-black text-emerald-300">
                      ₹{businessAccountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-200 flex items-center gap-1">
                      <span>👤</span>
                      <span>வாத்யாரிடம் நேரடி வசூல் (Direct to Priest):</span>
                    </span>
                    <span className="font-black text-amber-300">
                      ₹{directPriestAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* List of All Poojas Done by this Priest */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>🪔</span>
                    <span>பூஜைகள் பட்டியல் ({priestBookings.length})</span>
                  </h4>
                </div>

                {priestBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">இவருக்கு இன்னும் எந்த பூஜையும் ஒதுக்கப்படவில்லை.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {priestBookings.map((b) => (
                      <Link
                        key={b.id}
                        href={`/app/bookings/${b.id}`}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition block group"
                      >
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate group-hover:text-emerald-950">
                            👤 {b.customerName}
                          </div>
                          <div className="text-[10.5px] text-slate-600 truncate mt-0.5">
                            🪔 {b.poojaTamilName || b.poojaEnglishName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            📅 {b.date} • {b.startTime}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <div className="font-black text-slate-900 text-xs">
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </div>
                          <div>
                            {b.paymentRecipient === "PRIEST" ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9.5px] font-bold border border-amber-300 block">
                                👤 நேரடி
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[9.5px] font-bold border border-emerald-300 block">
                                🏛️ நிர்வாகம்
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPriest(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                மூடுக / Close
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
