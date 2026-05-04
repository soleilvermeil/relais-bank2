export function normalizeIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function formatIbanForDisplay(raw: string) {
  const compact = normalizeIban(raw);
  return compact.replace(/(.{4})/g, "$1 ").trim();
}

export function isValidIban(ibanInput: string) {
  const iban = normalizeIban(ibanInput);
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
