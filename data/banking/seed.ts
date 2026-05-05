import type {
  Account,
  CreditCard,
  ExternalEntity,
  PendingOrderRecord,
  PostedTransactionRecord,
  StandingOrderRecord,
  SwissAddress,
} from "@/data/banking/types";

function mockAddressFromOneLine(line: string): SwissAddress {
  const commaIdx = line.lastIndexOf(",");
  if (commaIdx === -1) {
    return { street: line, buildingNumber: "", postalCode: "", town: "", country: "CH" };
  }
  const streetPart = line.slice(0, commaIdx).trim();
  const locality = line.slice(commaIdx + 1).trim();
  const locMatch = locality.match(/^(\d{4})\s+(.+)$/);
  const postalCode = locMatch?.[1] ?? "";
  const town = locMatch?.[2] ?? locality;
  const endNum = streetPart.match(/^(.+?)\s+(\d+[a-zA-Z]?)$/);
  if (endNum) {
    return {
      street: endNum[1].trim(),
      buildingNumber: endNum[2],
      postalCode,
      town,
      country: "CH",
    };
  }
  return { street: streetPart, buildingNumber: "", postalCode, town, country: "CH" };
}

export const accounts: Account[] = [
  { id: "checking", name: "Checking account", balance: 7845.2, iban: "CH93 0076 2011 6238 5295 7" },
  { id: "savings", name: "Savings account", balance: 24190, iban: "CH44 0076 2011 0000 9876 5" },
  { id: "retirement-3a", name: "3a retirement savings account", balance: 58430.55 },
];

export const creditCards: CreditCard[] = [
  { id: "visa-gold", name: "Visa Gold", amount: 1240.35, last4: "4821" },
  { id: "mastercard-silver", name: "Mastercard Silver", amount: 430.1, last4: "9073" },
];

export const externalEntities: ExternalEntity[] = [
  {
    id: "regie-du-lac",
    type: "external_organization",
    name: "Regie du Lac",
    iban: "CH56 0900 0000 1234 5678 9",
    address: mockAddressFromOneLine("Rue du Lac 12, 1007 Lausanne"),
  },
  {
    id: "helsana",
    type: "external_organization",
    name: "Helsana",
    iban: "CH20 0076 2011 0000 1122 3",
    address: mockAddressFromOneLine("Avenue de la Gare 14, 1003 Lausanne"),
  },
  {
    id: "swisscom",
    type: "external_organization",
    name: "Swisscom",
    iban: "CH38 0900 0000 8765 4321 0",
    address: mockAddressFromOneLine("Chemin du Signal 8, 1012 Lausanne"),
  },
  { id: "employer", type: "external_organization", name: "Employer SA" },
  {
    id: "migros",
    type: "merchant",
    name: "Migros",
    address: mockAddressFromOneLine("Rue Centrale 5, 1003 Lausanne"),
  },
  {
    id: "coop-city",
    type: "merchant",
    name: "Coop City",
    address: mockAddressFromOneLine("Place Saint-Francois 9, 1003 Lausanne"),
  },
  {
    id: "cff",
    type: "merchant",
    name: "CFF",
    address: mockAddressFromOneLine("Place de la Gare 1, 1003 Lausanne"),
  },
  {
    id: "manor",
    type: "merchant",
    name: "Manor",
    address: mockAddressFromOneLine("Rue Saint-Laurent 6, 1003 Lausanne"),
  },
  {
    id: "hotel-lac",
    type: "merchant",
    name: "Hotel du Lac",
    address: mockAddressFromOneLine("Quai du Lac 3, 1006 Lausanne"),
  },
];

export const basePendingOrderRecords: PendingOrderRecord[] = [
  {
    id: "pending-1",
    amount: 1750,
    executionDate: "03.05.2026",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "external_organization", entityId: "regie-du-lac" },
  },
  {
    id: "pending-2",
    amount: 420.4,
    executionDate: "07.05.2026",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "external_organization", entityId: "helsana" },
  },
  {
    id: "pending-3",
    amount: 79.9,
    executionDate: "10.05.2026",
    sourceRef: { entityType: "card", entityId: "visa-gold" },
    destinationRef: { entityType: "external_organization", entityId: "swisscom" },
  },
];

export const baseStandingOrderRecords: StandingOrderRecord[] = [
  {
    id: "standing-1",
    amount: 500,
    firstExecutionDate: "2026-04-30",
    nextExecutionDate: "2026-04-30",
    frequency: "monthly",
    holidayShift: "before",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "savings" },
  },
  {
    id: "standing-2",
    amount: 300,
    firstExecutionDate: "2026-05-01",
    nextExecutionDate: "2026-05-01",
    frequency: "monthly",
    holidayShift: "after",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "retirement-3a" },
  },
];

export const basePostedTransactionRecords: PostedTransactionRecord[] = [
  {
    id: "tx-1",
    bookingDate: "27.04.2026",
    amount: 6200,
    sourceRef: { entityType: "external_organization", entityId: "employer" },
    destinationRef: { entityType: "account", entityId: "checking" },
    destinationIban: "CH93 0076 2011 6238 5295 7",
  },
  {
    id: "tx-2",
    bookingDate: "25.04.2026",
    amount: 148.2,
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "merchant", entityId: "coop-city" },
  },
  {
    id: "tx-3",
    bookingDate: "15.04.2026",
    amount: 500,
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "savings" },
    destinationIban: "CH44 0076 2011 0000 9876 5",
  },
  {
    id: "tx-4",
    bookingDate: "01.04.2026",
    amount: 300,
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "retirement-3a" },
  },
  {
    id: "tx-5",
    bookingDate: "28.04.2026",
    amount: 92.7,
    sourceRef: { entityType: "card", entityId: "visa-gold" },
    destinationRef: { entityType: "merchant", entityId: "migros" },
    beneficiaryAddress: mockAddressFromOneLine("Rue Centrale 5, 1003 Lausanne"),
    debitCardMaskedNumber: "**** **** **** 4821",
  },
  {
    id: "tx-6",
    bookingDate: "22.04.2026",
    amount: 180,
    sourceRef: { entityType: "merchant", entityId: "hotel-lac" },
    destinationRef: { entityType: "card", entityId: "visa-gold" },
  },
  {
    id: "tx-7",
    bookingDate: "24.04.2026",
    amount: 68.3,
    sourceRef: { entityType: "card", entityId: "mastercard-silver" },
    destinationRef: { entityType: "merchant", entityId: "manor" },
    beneficiaryAddress: mockAddressFromOneLine("Rue Saint-Laurent 6, 1003 Lausanne"),
    debitCardMaskedNumber: "**** **** **** 9073",
  },
  {
    id: "tx-8",
    bookingDate: "21.04.2026",
    amount: 122.5,
    sourceRef: { entityType: "card", entityId: "mastercard-silver" },
    destinationRef: { entityType: "merchant", entityId: "cff" },
    beneficiaryAddress: mockAddressFromOneLine("Place de la Gare 1, 1003 Lausanne"),
    debitCardMaskedNumber: "**** **** **** 9073",
  },
];
