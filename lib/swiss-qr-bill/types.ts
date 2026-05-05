/** Swiss QR-bill structured address (type "S"). */
export type SwissAddress = {
  street: string;
  buildingNumber: string;
  postalCode: string;
  town: string;
  country: string;
};

export type PaymentReferenceType = "QRR" | "SCOR" | "NON";

export type PaymentReference = {
  type: PaymentReferenceType;
  value: string;
};

export function formatSwissAddressOneLine(addr: SwissAddress): string {
  const streetPart = [addr.street, addr.buildingNumber].filter(Boolean).join(" ").trim();
  const locality = [addr.postalCode, addr.town].filter(Boolean).join(" ").trim();
  const parts = [streetPart, locality, addr.country.trim()].filter(Boolean);
  return parts.join(", ");
}

export function formatSwissAddressLines(addr: SwissAddress): string[] {
  const line1 = [addr.street, addr.buildingNumber].filter(Boolean).join(" ").trim();
  const line2 = [addr.postalCode, addr.town].filter(Boolean).join(" ").trim();
  return [line1, line2, addr.country.trim()].filter((line) => line.length > 0);
}

/** Digits only for QRR (27 digits including check digit). */
export function normalizeQrrDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** SIX “Modulo 10 recursive” lookup row (Annex B, QR-bill). */
const SWISS_QR_MOD10_TABLE = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5] as const;

/** Check digit (0–9) for the first 26 digits of a QR reference. */
export function swissQrMod10RecursiveChecksum(digits26: string): number {
  let carry = 0;
  for (const ch of digits26) {
    carry = SWISS_QR_MOD10_TABLE[(carry + Number(ch)) % 10];
  }
  return (10 - carry) % 10;
}

/**
 * Swiss QR reference (QRR): 27 digits, last digit = Modulo 10 recursive.
 * @see SIX Swiss Implementation Guidelines QR-bill, Annex B
 */
export function isValidQrrReference(digits: string): boolean {
  const d = normalizeQrrDigits(digits);
  if (!/^\d{27}$/.test(d)) {
    return false;
  }
  const expected = swissQrMod10RecursiveChecksum(d.slice(0, 26));
  return expected === Number(d[26]);
}

/** ISO 11649 creditor reference (RF + check digits + up to 21 chars). */
export function normalizeScorReference(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidScorReference(raw: string): boolean {
  const ref = normalizeScorReference(raw);
  if (!ref.startsWith("RF")) {
    return false;
  }
  if (ref.length < 5 || ref.length > 25) {
    return false;
  }
  if (!/^RF\d{2}[A-Z0-9]+$/.test(ref)) {
    return false;
  }
  const rearranged = ref.slice(4) + ref.slice(0, 4);
  let remainder = 0;
  for (const char of rearranged) {
    const piece =
      char >= "0" && char <= "9"
        ? char
        : String(char.charCodeAt(0) - 55);
    for (const digit of piece) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }
  return remainder === 1;
}

export function paymentReferenceFromQr(
  referenceType: string,
  rawReference: string,
): PaymentReference {
  const upper = referenceType.toUpperCase();
  if (upper === "NON") {
    return { type: "NON", value: "" };
  }
  const normalized = rawReference.replace(/\s+/g, "");
  if (upper === "QRR") {
    const digits = normalizeQrrDigits(normalized);
    return { type: "QRR", value: digits };
  }
  if (upper === "SCOR") {
    return { type: "SCOR", value: normalizeScorReference(normalized) };
  }
  return { type: "NON", value: "" };
}

/** Result of parsing a Swiss QR-bill (Swiss Payments Code) payload. */
export type SwissQrBillParseResult = {
  recipientName: string;
  creditorAddress: SwissAddress;
  beneficiaryIban: string;
  reference: PaymentReference;
  amount: string;
  currency: "CHF" | "EUR";
  shouldGoToPreview: boolean;
  paymentType: "domestic";
  beneficiaryBic: "";
  unstructuredMessage: string;
};
