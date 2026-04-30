import { cookies } from "next/headers";

export const PAYMENT_OPERATIONS_COOKIE = "ebanking_operations";

export type PaymentOperationDelta = {
  id: string;
  type: "pay" | "transfer";
  createdAtIso: string;
  sourceRef: {
    entityType: "account" | "card";
    entityId: string;
  };
  destinationRef: {
    entityType: "account" | "external_organization";
    entityId: string;
  };
  amount: number;
  currency: "CHF";
  executionDate: string;
  reference: string;
  paymentDetails?: {
    paymentType: "domestic" | "international";
    beneficiaryIban: string;
    beneficiaryBic?: string;
  };
  transactionDetails?: {
    destinationIban?: string;
    shopAddress?: string;
    debitCardMaskedNumber?: string;
  };
};

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
};

export async function readCookieState<T>(key: string): Promise<T | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(key)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function writeCookieState<T>(key: string, value: T) {
  const cookieStore = await cookies();
  cookieStore.set(key, JSON.stringify(value), cookieOptions);
}

export async function readOrInitializeCookieState<T>(
  key: string,
  seedFactory: () => T,
): Promise<T> {
  const existing = await readCookieState<T>(key);
  if (existing) return existing;
  return seedFactory();
}

export async function readPaymentOperationDeltas() {
  const existing = await readCookieState<PaymentOperationDelta[]>(
    PAYMENT_OPERATIONS_COOKIE,
  );
  if (!existing || !Array.isArray(existing)) return [];
  return existing;
}

export async function appendPaymentOperationDelta(
  operation: PaymentOperationDelta,
) {
  const existing = await readPaymentOperationDeltas();
  await writeCookieState(PAYMENT_OPERATIONS_COOKIE, [operation, ...existing]);
}

export async function resetPaymentOperationDeltas() {
  await writeCookieState(PAYMENT_OPERATIONS_COOKIE, []);
}
