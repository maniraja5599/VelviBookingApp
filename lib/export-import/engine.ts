import * as XLSX from "xlsx";
import { Customer, Booking, Pooja, BusinessMember, Payment } from "@/lib/types";
import { isValidIndianMobile, normalizeIndianMobile } from "@/lib/utils/phone";

export interface ExportDataPayload {
  customers: Customer[];
  bookings: Booking[];
  poojas: Pooja[];
  members: BusinessMember[];
  payments: Payment[];
}

export interface ImportValidationResult {
  totalRows: number;
  validCustomers: Array<{ name: string; mobile: string; address?: string; notes?: string }>;
  duplicateCount: number;
  invalidPhoneCount: number;
  errors: string[];
}

/**
 * Generate Excel / CSV / JSON export for paid users
 */
export function exportBusinessData(
  payload: ExportDataPayload,
  format: "xlsx" | "csv" | "json"
): { data: any; filename: string; mimeType: string } {
  const timestamp = new Date().toISOString().split("T")[0];

  if (format === "json") {
    return {
      data: JSON.stringify(payload, null, 2),
      filename: `Velvi_Backup_${timestamp}.json`,
      mimeType: "application/json",
    };
  }

  // Create Excel Workbook
  const wb = XLSX.utils.book_new();

  // 1. Customers Sheet
  const customersData = payload.customers.map((c) => ({
    "Customer Name": c.name,
    "Mobile Number": c.mobile,
    WhatsApp: c.whatsapp || "",
    Address: c.address || "",
    City: c.city || "",
    Notes: c.notes || "",
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customersData);
  XLSX.utils.book_append_sheet(wb, wsCustomers, "Customers");

  // 2. Bookings Sheet
  const bookingsData = payload.bookings.map((b) => ({
    "Booking ID": b.bookingNumber,
    "Pooja / Homam": b.poojaEnglishName,
    "Tamil Name": b.poojaTamilName || "",
    Customer: b.customerName,
    "Customer Mobile": b.customerMobile,
    Date: b.date,
    Time: b.startTime,
    Location: b.location,
    "Assigned Iyer": b.assignedIyerName || "Unassigned",
    Status: b.status,
    "Total Amount (INR)": b.totalAmount,
    "Advance Amount (INR)": b.advanceAmount,
    "Balance Amount (INR)": b.balanceAmount,
    "Payment Status": b.paymentStatus,
    Notes: b.notes || "",
  }));
  const wsBookings = XLSX.utils.json_to_sheet(bookingsData);
  XLSX.utils.book_append_sheet(wb, wsBookings, "Bookings");

  // 3. Poojas Sheet
  const poojasData = payload.poojas.map((p) => ({
    "Pooja Name": p.englishName,
    "Tamil Name": p.tamilName,
    "Base Price (INR)": p.basePrice,
    "Duration (Mins)": p.durationMinutes,
    Description: p.description,
  }));
  const wsPoojas = XLSX.utils.json_to_sheet(poojasData);
  XLSX.utils.book_append_sheet(wb, wsPoojas, "Poojas");

  if (format === "csv") {
    const csvContent = XLSX.utils.sheet_to_csv(wsBookings);
    return {
      data: csvContent,
      filename: `Velvi_Bookings_${timestamp}.csv`,
      mimeType: "text/csv",
    };
  }

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return {
    data: wbout,
    filename: `Velvi_Export_${timestamp}.xlsx`,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

/**
 * Validate customer batch import from CSV/XLSX text or rows (Point 56)
 */
export function validateCustomerImport(
  rawRows: Array<{ name?: string; mobile?: string; address?: string; notes?: string }>,
  existingCustomers: Customer[]
): ImportValidationResult {
  const existingMobiles = new Set(existingCustomers.map((c) => normalizeIndianMobile(c.mobile)));
  const seenInBatch = new Set<string>();

  const validCustomers: Array<{ name: string; mobile: string; address?: string; notes?: string }> = [];
  let duplicateCount = 0;
  let invalidPhoneCount = 0;
  const errors: string[] = [];

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 1;
    const name = (row.name || "").trim();
    const rawMobile = (row.mobile || "").trim();

    if (!name) {
      errors.push(`Row ${rowNum}: Name is missing.`);
      return;
    }

    if (!rawMobile || !isValidIndianMobile(rawMobile)) {
      invalidPhoneCount++;
      errors.push(`Row ${rowNum} (${name}): Invalid phone number "${rawMobile}".`);
      return;
    }

    const normalized = normalizeIndianMobile(rawMobile);
    if (existingMobiles.has(normalized) || seenInBatch.has(normalized)) {
      duplicateCount++;
      errors.push(`Row ${rowNum} (${name}): Duplicate mobile ${normalized} already exists.`);
      return;
    }

    seenInBatch.add(normalized);
    validCustomers.push({
      name,
      mobile: normalized,
      address: row.address?.trim(),
      notes: row.notes?.trim(),
    });
  });

  return {
    totalRows: rawRows.length,
    validCustomers,
    duplicateCount,
    invalidPhoneCount,
    errors,
  };
}
