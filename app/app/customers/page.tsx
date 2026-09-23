"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Customer } from "@/lib/types";
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
} from "lucide-react";

export default function CustomersPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  React.useEffect(() => {
    const update = () => setCustomers(db.getCustomers(businessId));
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

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">{t("customers")}</h2>
          <p className="text-xs text-velvi-brown/60">
            {filteredCustomers.length} registered devotees
          </p>
        </div>

        <button
          id="addCustomerBtn"
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
        >
          <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
          <span>புதிய பக்தர் (Add)</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-velvi-brown/40 absolute left-3 top-2.5" />
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

            {/* Booking History */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wider">
                Booking History
              </h4>
              {db
                .getBookings(businessId)
                .filter(
                  (b) =>
                    b.customerId === selectedCustomer.id ||
                    b.customerMobile === selectedCustomer.mobile
                ).length === 0 ? (
                <p className="text-xs text-velvi-brown/60">No past bookings found.</p>
              ) : (
                db
                  .getBookings(businessId)
                  .filter(
                    (b) =>
                      b.customerId === selectedCustomer.id ||
                      b.customerMobile === selectedCustomer.mobile
                  )
                  .map((b) => (
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
                className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition border border-rose-200/80 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="flex-1 py-3 bg-velvi-brown text-white text-xs font-bold rounded-xl shadow-sm hover:bg-velvi-brownLight transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
