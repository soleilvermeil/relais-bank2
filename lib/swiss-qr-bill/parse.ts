import { isValidIban, normalizeIban } from "@/lib/iban";
import {
  type SwissAddress,
  type SwissQrBillParseResult,
  paymentReferenceFromQr,
} from "@/lib/swiss-qr-bill/types";

const SUPPORTED_VERSIONS = new Set(["0100", "0200"]);
const SUPPORTED_ADDRESS_TYPES = new Set(["S", "K", "F", ""]);
const SUPPORTED_REFERENCE_TYPES = new Set(["QRR", "SCOR", "NON"]);

function cleanLines(input: string) {
  return input.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim());
}

function readAddressBlock(lines: string[], startIndex: number) {
  if (startIndex + 7 > lines.length) {
    return null;
  }
  const block = lines.slice(startIndex, startIndex + 7);
  if (!SUPPORTED_ADDRESS_TYPES.has(block[0] ?? "")) {
    return null;
  }
  return { block, nextIndex: startIndex + 7 };
}

function creditorAddressFromBlock(block: string[]): SwissAddress {
  const type = block[0] ?? "";
  const countryRaw = ((block[6] ?? "").trim() || "CH").toUpperCase();
  const country = countryRaw.length >= 2 ? countryRaw.slice(0, 2) : "CH";

  if (type === "S") {
    return {
      street: (block[2] ?? "").trim(),
      buildingNumber: (block[3] ?? "").trim(),
      postalCode: (block[4] ?? "").trim(),
      town: (block[5] ?? "").trim(),
      country,
    };
  }

  if (type === "K" || type === "F") {
    const line1 = (block[2] ?? "").trim();
    const line2 = (block[3] ?? "").trim();
    const street = [line1, line2].filter(Boolean).join(", ");
    return {
      street,
      buildingNumber: "",
      postalCode: (block[4] ?? "").trim(),
      town: (block[5] ?? "").trim(),
      country,
    };
  }

  return {
    street: "",
    buildingNumber: "",
    postalCode: "",
    town: "",
    country,
  };
}

function normalizeAmount(rawAmount: string) {
  const normalized = rawAmount.replace(",", ".").trim();
  if (!normalized) {
    return "";
  }
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  return value.toFixed(2);
}

export function parseSwissQrBillPayload(rawPayload: string): SwissQrBillParseResult | null {
  const lines = cleanLines(rawPayload);
  if (
    lines[0] !== "SPC" ||
    !SUPPORTED_VERSIONS.has(lines[1] ?? "") ||
    lines[2] !== "1"
  ) {
    return null;
  }

  const beneficiaryIban = normalizeIban(lines[3] ?? "");
  if (
    !beneficiaryIban ||
    !isValidIban(beneficiaryIban) ||
    (!beneficiaryIban.startsWith("CH") && !beneficiaryIban.startsWith("LI"))
  ) {
    return null;
  }

  let index = 4;
  const creditorAddress = readAddressBlock(lines, index);
  if (!creditorAddress) {
    return null;
  }
  index = creditorAddress.nextIndex;

  const reservedAddress = readAddressBlock(lines, index);
  if (!reservedAddress) {
    return null;
  }
  index = reservedAddress.nextIndex;

  const amount = normalizeAmount(lines[index] ?? "");
  const currencyRaw = (lines[index + 1] ?? "").toUpperCase();
  if (currencyRaw !== "CHF" && currencyRaw !== "EUR") {
    return null;
  }
  const currency = currencyRaw as "CHF" | "EUR";
  index += 2;

  const debtorAddress = readAddressBlock(lines, index);
  if (!debtorAddress) {
    return null;
  }
  index = debtorAddress.nextIndex;

  const referenceType = (lines[index] ?? "").toUpperCase();
  if (!SUPPORTED_REFERENCE_TYPES.has(referenceType)) {
    return null;
  }
  const reference = paymentReferenceFromQr(referenceType, lines[index + 1] ?? "");
  index += 2;

  const unstructuredMessage = (lines[index] ?? "").trim();
  index += 1;

  const trailer = (lines[index] ?? "").toUpperCase();
  if (trailer !== "EPD") {
    return null;
  }

  const recipientName = (creditorAddress.block[1] ?? "").trim();
  if (!recipientName) {
    return null;
  }

  const creditorAddr = creditorAddressFromBlock(creditorAddress.block);

  return {
    recipientName,
    creditorAddress: creditorAddr,
    beneficiaryIban,
    reference,
    amount,
    currency,
    shouldGoToPreview: currency === "CHF" && Boolean(amount),
    paymentType: "domestic",
    beneficiaryBic: "",
    unstructuredMessage,
  };
}
