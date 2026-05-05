"use server";

import { redirect } from "next/navigation";
import type {
  HolidayShift,
  StandingFrequency,
  StandingOrderSchedule,
  UltimateDebtor,
} from "@/data/banking/types";
import {
  assertExecutionDateAtLeastTomorrow,
  formatSwissLocalDate,
  isExecutionDateAtLeastTomorrow,
  parseExecutionDate,
} from "@/lib/payment-execution-date";
import { PAY_IMMEDIATE_FEE_CHF } from "@/lib/payment-immediate";
import {
  appendPaymentOperationDelta,
  resetPaymentOperationDeltas,
  type PaymentOperationDelta,
} from "@/lib/payment-cookies";
import {
  isValidQrrReference,
  isValidScorReference,
  normalizeQrrDigits,
  normalizeScorReference,
  type PaymentReferenceType,
  type SwissAddress,
} from "@/lib/swiss-qr-bill/types";

type SourceRef = PaymentOperationDelta["sourceRef"];

const STANDING_FREQUENCIES: StandingFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "semiAnnual",
  "yearly",
];

function normalizeIban(value: FormDataEntryValue | null) {
  return (typeof value === "string" ? value : "").replace(/\s+/g, "").toUpperCase();
}

function isValidIban(iban: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(iban)) {
    return false;
  }

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;
  for (const char of rearranged) {
    const piece =
      char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of piece) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

function parseAndValidateIban(value: FormDataEntryValue | null) {
  const iban = normalizeIban(value);
  if (!isValidIban(iban)) {
    throw new Error("Invalid IBAN");
  }
  return iban;
}

function parseAndValidateBicOptional(value: FormDataEntryValue | null) {
  const bic = (typeof value === "string" ? value : "")
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!bic) {
    return undefined;
  }
  if (!/^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?$/.test(bic)) {
    throw new Error("Invalid BIC");
  }
  return bic;
}

function parseSourceRef(value: string): SourceRef {
  const [entityType, entityId] = value.split(":");
  if (
    (entityType !== "account" && entityType !== "card") ||
    !entityId
  ) {
    throw new Error("Invalid source reference");
  }
  return { entityType, entityId };
}

function parseAmount(value: FormDataEntryValue | null): number {
  const raw = typeof value === "string" ? value : "";
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid amount");
  }
  return parsed;
}

function parseImmediateExecution(formData: FormData): boolean {
  return String(formData.get("immediateExecution") ?? "0").trim() === "1";
}

function trimStr(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSwissAddress(formData: FormData): SwissAddress {
  const street = trimStr(formData.get("beneficiaryStreet"));
  const buildingNumber = trimStr(formData.get("beneficiaryBuildingNumber"));
  const postalCode = trimStr(formData.get("beneficiaryPostalCode"));
  const town = trimStr(formData.get("beneficiaryTown"));
  const countryRaw = trimStr(formData.get("beneficiaryCountry")).toUpperCase() || "CH";
  const country = countryRaw.length >= 2 ? countryRaw.slice(0, 2) : "";
  if (!postalCode || !town || !/^[A-Z]{2}$/.test(country)) {
    throw new Error("Invalid beneficiary address");
  }
  return { street, buildingNumber, postalCode, town, country };
}

function parseReferenceType(formData: FormData): PaymentReferenceType {
  const raw = trimStr(formData.get("referenceType")).toUpperCase();
  if (raw === "QRR" || raw === "SCOR" || raw === "NON") {
    return raw;
  }
  throw new Error("Invalid reference type");
}

function parseAndValidatePaymentReference(
  referenceType: PaymentReferenceType,
  rawReference: string,
): string {
  if (referenceType === "NON") {
    if (rawReference.trim()) {
      throw new Error("Reference must be empty for NON");
    }
    return "";
  }
  if (referenceType === "QRR") {
    const digits = normalizeQrrDigits(rawReference);
    if (!isValidQrrReference(digits)) {
      throw new Error("Invalid QR reference");
    }
    return digits;
  }
  const scor = normalizeScorReference(rawReference);
  if (!isValidScorReference(scor)) {
    throw new Error("Invalid creditor reference");
  }
  return scor;
}

function parsePaymentSchedule(formData: FormData): "one_time" | "standing" {
  const raw = trimStr(formData.get("paymentSchedule")).toLowerCase();
  return raw === "standing" ? "standing" : "one_time";
}

function parseStandingSchedule(formData: FormData): StandingOrderSchedule {
  const firstExecutionDate = trimStr(formData.get("standingFirstExecutionDate"));
  if (!firstExecutionDate || !isExecutionDateAtLeastTomorrow(firstExecutionDate)) {
    throw new Error("Invalid first execution date");
  }
  const frequencyRaw = trimStr(formData.get("standingFrequency")).toLowerCase();
  if (!STANDING_FREQUENCIES.includes(frequencyRaw as StandingFrequency)) {
    throw new Error("Invalid standing frequency");
  }
  const frequency = frequencyRaw as StandingFrequency;
  const shiftRaw = trimStr(formData.get("standingHolidayShift")).toLowerCase();
  if (shiftRaw !== "before" && shiftRaw !== "after") {
    throw new Error("Invalid holiday shift");
  }
  const holidayShift: HolidayShift = shiftRaw;
  const hasEnd = trimStr(formData.get("standingHasEnd")) === "1";
  let endDate: string | undefined;
  if (hasEnd) {
    endDate = trimStr(formData.get("standingEndDate"));
    if (!endDate) {
      throw new Error("End date required");
    }
    const first = parseExecutionDate(firstExecutionDate);
    const end = parseExecutionDate(endDate);
    if (!first || !end || end.getTime() < first.getTime()) {
      throw new Error("Invalid end date");
    }
  }
  return {
    firstExecutionDate,
    nextExecutionDate: firstExecutionDate,
    frequency,
    holidayShift,
    endDate: endDate || undefined,
  };
}

function parseUltimateDebtor(formData: FormData): UltimateDebtor | undefined {
  if (trimStr(formData.get("hasUltimateDebtor")) !== "1") {
    return undefined;
  }
  const name = trimStr(formData.get("debtorName"));
  const countryRaw = trimStr(formData.get("debtorCountry")).toUpperCase() || "CH";
  const country = countryRaw.length >= 2 ? countryRaw.slice(0, 2) : "";
  const town = trimStr(formData.get("debtorTown"));
  const postalCode = trimStr(formData.get("debtorPostalCode"));
  const street = trimStr(formData.get("debtorStreet"));
  const buildingNumber = trimStr(formData.get("debtorBuildingNumber"));
  if (!name || !town || !postalCode || !/^[A-Z]{2}$/.test(country)) {
    throw new Error("Invalid ultimate debtor");
  }
  return {
    name,
    address: { street, buildingNumber, postalCode, town, country },
  };
}

export async function confirmPayOperation(formData: FormData) {
  const sourceRef = parseSourceRef(String(formData.get("sourceRef") ?? ""));
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const paymentSchedule = parsePaymentSchedule(formData);
  const beneficiaryIban = parseAndValidateIban(formData.get("beneficiaryIban"));
  const beneficiaryBic = parseAndValidateBicOptional(formData.get("beneficiaryBic"));
  const referenceType = parseReferenceType(formData);
  const referenceRaw = String(formData.get("reference") ?? "");
  const reference = parseAndValidatePaymentReference(referenceType, referenceRaw);
  const amount = parseAmount(formData.get("amount"));
  const beneficiaryAddress = parseSwissAddress(formData);
  const notice = trimStr(formData.get("notice"));
  const accountingEntry = trimStr(formData.get("accountingEntry"));
  const ultimateDebtor = parseUltimateDebtor(formData);

  let executionDate: string;
  let immediateExecution: boolean;
  let immediateFeeChf: number | undefined;
  let standing: StandingOrderSchedule | undefined;

  if (paymentSchedule === "standing") {
    standing = parseStandingSchedule(formData);
    executionDate = standing.firstExecutionDate;
    immediateExecution = false;
    immediateFeeChf = undefined;
  } else {
    immediateExecution = parseImmediateExecution(formData);
    executionDate = String(formData.get("executionDate") ?? "").trim();
    if (immediateExecution) {
      executionDate = formatSwissLocalDate(new Date());
    } else {
      assertExecutionDateAtLeastTomorrow(executionDate);
    }
    immediateFeeChf = immediateExecution ? PAY_IMMEDIATE_FEE_CHF : undefined;
  }

  const operation: PaymentOperationDelta = {
    id: `op-pay-${Date.now()}`,
    type: "pay",
    createdAtIso: new Date().toISOString(),
    sourceRef,
    destinationRef: {
      entityType: "external_organization",
      entityId: recipientName || "recipient",
    },
    amount,
    currency: "CHF",
    executionDate,
    immediateExecution,
    immediateFeeChf,
    reference,
    referenceType,
    notice: notice || undefined,
    accountingEntry: accountingEntry || undefined,
    paymentSchedule,
    standing,
    ultimateDebtor,
    paymentDetails: {
      beneficiaryIban,
      beneficiaryBic,
      beneficiaryAddress,
    },
    transactionDetails: {
      destinationIban: beneficiaryIban,
    },
  };

  await appendPaymentOperationDelta(operation);
  redirect("/payments");
}

export async function confirmTransferOperation(formData: FormData) {
  const sourceRef = parseSourceRef(String(formData.get("sourceRef") ?? ""));
  const destinationAccountId = String(formData.get("destinationAccountId") ?? "").trim();
  const paymentSchedule = parsePaymentSchedule(formData);
  const accountingEntry = trimStr(formData.get("accountingEntry"));
  const amount = parseAmount(formData.get("amount"));

  let executionDate: string;
  let immediateExecution: boolean;
  let standing: StandingOrderSchedule | undefined;

  if (paymentSchedule === "standing") {
    standing = parseStandingSchedule(formData);
    executionDate = standing.firstExecutionDate;
    immediateExecution = false;
  } else {
    immediateExecution = parseImmediateExecution(formData);
    executionDate = String(formData.get("executionDate") ?? "").trim();
    if (immediateExecution) {
      executionDate = formatSwissLocalDate(new Date());
    } else {
      assertExecutionDateAtLeastTomorrow(executionDate);
    }
  }

  const operation: PaymentOperationDelta = {
    id: `op-transfer-${Date.now()}`,
    type: "transfer",
    createdAtIso: new Date().toISOString(),
    sourceRef,
    destinationRef: {
      entityType: "account",
      entityId: destinationAccountId,
    },
    amount,
    currency: "CHF",
    executionDate,
    immediateExecution,
    paymentSchedule,
    standing,
    reference: "",
    referenceType: "NON",
    accountingEntry: accountingEntry || undefined,
  };

  await appendPaymentOperationDelta(operation);
  redirect("/payments");
}

export async function resetPaymentCookies() {
  await resetPaymentOperationDeltas();
  redirect("/payments");
}
