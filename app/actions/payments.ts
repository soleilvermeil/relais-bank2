"use server";

import { redirect } from "next/navigation";
import {
  appendPaymentOperationDelta,
  resetPaymentOperationDeltas,
  type PaymentOperationDelta,
} from "@/lib/payment-cookies";

type SourceRef = PaymentOperationDelta["sourceRef"];

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
  const recipientName = String(formData.get("recipientName") ?? "").trim();
  const executionDate = String(formData.get("executionDate") ?? "").trim();
  const reference = String(formData.get("reference") ?? "").trim();
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
    reference,
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
