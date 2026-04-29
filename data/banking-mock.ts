export type Account = {
  id: string;
  name: string;
  balance: number;
  iban?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  amount: number;
  last4: string;
};

export type PendingOrder = {
  id: string;
  label: string;
  executionDate: string;
  amount: number;
};

export type StandingOrder = {
  id: string;
  label: string;
  cadence: string;
  nextExecutionDate: string;
  amount: number;
};

export type DetailSourceType = "account" | "card";

export type DetailPendingOrder = {
  id: string;
  sourceType: DetailSourceType;
  sourceId: string;
  label: string;
  executionDate: string;
  amount: number;
};

export type TransactionDirection = "incoming" | "outgoing";

export type PastTransaction = {
  id: string;
  sourceType: DetailSourceType;
  sourceId: string;
  bookingDate: string;
  label: string;
  amount: number;
  direction: TransactionDirection;
};

export const accounts: Account[] = [
  {
    id: "checking",
    name: "Checking account",
    balance: 7845.2,
    iban: "CH93 0076 2011 6238 5295 7",
  },
  {
    id: "savings",
    name: "Savings account",
    balance: 24190,
    iban: "CH44 0076 2011 0000 9876 5",
  },
  {
    id: "retirement-3a",
    name: "3a retirement savings account",
    balance: 58430.55,
  },
];

export const creditCards: CreditCard[] = [
  {
    id: "visa-gold",
    name: "Visa Gold",
    amount: 1240.35,
    last4: "4821",
  },
  {
    id: "mastercard-silver",
    name: "Mastercard Silver",
    amount: 430.1,
    last4: "9073",
  },
];

export const pendingOrders: PendingOrder[] = [
  {
    id: "order-1",
    label: "Regie du Lac",
    executionDate: "03.05.2026",
    amount: 1750,
  },
  {
    id: "order-2",
    label: "Helsana",
    executionDate: "07.05.2026",
    amount: 420.4,
  },
  {
    id: "order-3",
    label: "Swisscom",
    executionDate: "10.05.2026",
    amount: 79.9,
  },
];

export const standingOrders: StandingOrder[] = [
  {
    id: "standing-1",
    label: "Savings account",
    cadence: "Monthly",
    nextExecutionDate: "30.04.2026",
    amount: 500,
  },
  {
    id: "standing-2",
    label: "3a retirement account",
    cadence: "Monthly",
    nextExecutionDate: "01.05.2026",
    amount: 300,
  },
];

export const detailPendingOrders: DetailPendingOrder[] = [
  {
    id: "dp-1",
    sourceType: "account",
    sourceId: "checking",
    label: "Regie du Lac",
    executionDate: "03.05.2026",
    amount: 1750,
  },
  {
    id: "dp-2",
    sourceType: "account",
    sourceId: "checking",
    label: "Helsana",
    executionDate: "07.05.2026",
    amount: 420.4,
  },
  {
    id: "dp-3",
    sourceType: "account",
    sourceId: "savings",
    label: "Savings account",
    executionDate: "20.05.2026",
    amount: 500,
  },
  {
    id: "dp-4",
    sourceType: "account",
    sourceId: "retirement-3a",
    label: "3a retirement account",
    executionDate: "01.05.2026",
    amount: 300,
  },
  {
    id: "dp-5",
    sourceType: "card",
    sourceId: "visa-gold",
    label: "Swisscom",
    executionDate: "10.05.2026",
    amount: 79.9,
  },
  {
    id: "dp-6",
    sourceType: "card",
    sourceId: "mastercard-silver",
    label: "CFF",
    executionDate: "18.05.2026",
    amount: 122.5,
  },
];

export const pastTransactions: PastTransaction[] = [
  {
    id: "tx-1",
    sourceType: "account",
    sourceId: "checking",
    bookingDate: "27.04.2026",
    label: "Employer salary",
    amount: 6200,
    direction: "incoming",
  },
  {
    id: "tx-2",
    sourceType: "account",
    sourceId: "checking",
    bookingDate: "25.04.2026",
    label: "Coop City",
    amount: 148.2,
    direction: "outgoing",
  },
  {
    id: "tx-3",
    sourceType: "account",
    sourceId: "savings",
    bookingDate: "15.04.2026",
    label: "Interest payment",
    amount: 12.4,
    direction: "incoming",
  },
  {
    id: "tx-4",
    sourceType: "account",
    sourceId: "retirement-3a",
    bookingDate: "01.04.2026",
    label: "Monthly contribution",
    amount: 300,
    direction: "incoming",
  },
  {
    id: "tx-5",
    sourceType: "card",
    sourceId: "visa-gold",
    bookingDate: "28.04.2026",
    label: "Migros",
    amount: 92.7,
    direction: "outgoing",
  },
  {
    id: "tx-6",
    sourceType: "card",
    sourceId: "visa-gold",
    bookingDate: "22.04.2026",
    label: "Hotel refund",
    amount: 180,
    direction: "incoming",
  },
  {
    id: "tx-7",
    sourceType: "card",
    sourceId: "mastercard-silver",
    bookingDate: "24.04.2026",
    label: "Manor",
    amount: 68.3,
    direction: "outgoing",
  },
];

function parseSwissDate(value: string) {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, month - 1, day);
}

function getEndOfNextMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth() + 2, 0);
}

export function getPendingOrdersUntilNextMonth(
  sourceType: DetailSourceType,
  sourceId: string,
  referenceDate: Date = new Date(),
) {
  const cutoffDate = getEndOfNextMonth(referenceDate);
  return detailPendingOrders.filter((order) => {
    if (order.sourceType !== sourceType || order.sourceId !== sourceId) {
      return false;
    }
    return parseSwissDate(order.executionDate) <= cutoffDate;
  });
}

export function getPastTransactionsForSource(
  sourceType: DetailSourceType,
  sourceId: string,
) {
  return pastTransactions.filter(
    (transaction) =>
      transaction.sourceType === sourceType &&
      transaction.sourceId === sourceId,
  );
}
