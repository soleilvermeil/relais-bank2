import { isValidIban, normalizeIban } from "@/lib/iban";

type ParseResult = {
  recipientName: string;
  beneficiaryIban: string;
  reference: string;
  amount: string;
  currency: "CHF" | "EUR";
  shouldGoToPreview: boolean;
  paymentType: "domestic";
  beneficiaryBic: "";
};

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

function normalizeReference(referenceType: string, rawReference: string) {
  if (referenceType === "NON") {
    return "";
  }
  return rawReference.replace(/\s+/g, "");
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

export function parseSwissQrBillPayload(rawPayload: string): ParseResult | null {
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
  const reference = normalizeReference(referenceType, lines[index + 1] ?? "");
  index += 2;

  index += 1;
  const trailer = (lines[index] ?? "").toUpperCase();
  if (trailer !== "EPD") {
    return null;
  }

  const recipientName = (creditorAddress.block[1] ?? "").trim();
  if (!recipientName) {
    return null;
  }

  return {
    recipientName,
    beneficiaryIban,
    reference,
    amount,
    currency,
    shouldGoToPreview: currency === "CHF" && Boolean(amount),
    paymentType: "domestic",
    beneficiaryBic: "",
  };
}
