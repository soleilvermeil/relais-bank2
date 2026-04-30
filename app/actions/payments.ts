"use server";

import { redirect } from "next/navigation";
import {
  appendPaymentOperationDelta,
  resetPaymentOperationDeltas,
  type PaymentOperationDelta,
} from "@/lib/payment-cookies";

type SourceRef = PaymentOperationDelta["sourceRef"];

function parsePaymentType(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw !== "domestic" && raw !== "international") {
    throw new Error("Invalid payment type");
  }
  return raw;
}

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

function parseAndValidateBic(value: FormDataEntryValue | null) {
  const bic = (typeof value === "string" ? value : "")
    .replace(/\s+/g, "")
    .toUpperCase();
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

export async function confirmPayOperation(formData: FormData) {
  const sourceRef = parseSourceRef(String(formData.get("sourceRef") ?? ""));
  const paymentType = parsePaymentType(formData.get("paymentType"));
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const executionDate = String(formData.get("executionDate") ?? "").trim();
  const beneficiaryIban = parseAndValidateIban(formData.get("beneficiaryIban"));
  const beneficiaryBicRaw = String(formData.get("beneficiaryBic") ?? "").trim();
  const beneficiaryBic =
    paymentType === "international"
      ? parseAndValidateBic(beneficiaryBicRaw)
      : undefined;
  if (paymentType === "domestic" && beneficiaryBicRaw) {
    throw new Error("BIC must be empty for domestic payments");
  }
  const amount = parseAmount(formData.get("amount"));

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
    reference: beneficiaryIban,
    paymentDetails: {
      paymentType,
      beneficiaryIban,
      beneficiaryBic,
    },
  };

  await appendPaymentOperationDelta(operation);
  redirect("/payments");
}

export async function confirmTransferOperation(formData: FormData) {
  const sourceRef = parseSourceRef(String(formData.get("sourceRef") ?? ""));
  const destinationAccountId = String(formData.get("destinationAccountId") ?? "").trim();
  const executionDate = String(formData.get("executionDate") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
  const amount = parseAmount(formData.get("amount"));

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
    reference,
  };

  await appendPaymentOperationDelta(operation);
  redirect("/payments");
}

export async function resetPaymentCookies() {
  await resetPaymentOperationDeltas();
  redirect("/payments");
}
