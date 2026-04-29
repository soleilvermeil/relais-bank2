export type Account = {
  id: string;
  name: string;
  balanceChf: string;
  iban?: string;
};

export type CreditCard = {
  id: string;
  name: string;
  amountChf: string;
  last4: string;
};

export type PendingOrder = {
  id: string;
  label: string;
  executionDate: string;
  amountChf: string;
};

export type StandingOrder = {
  id: string;
  label: string;
  cadence: string;
  nextExecutionDate: string;
  amountChf: string;
};

export const accounts: Account[] = [
  {
    id: "checking",
    name: "Checking account",
    balanceChf: "CHF 7'845.20",
    iban: "CH93 0076 2011 6238 5295 7",
  },
  {
    id: "savings",
    name: "Savings account",
    balanceChf: "CHF 24'190.00",
    iban: "CH44 0076 2011 0000 9876 5",
  },
  {
    id: "retirement-3a",
    name: "3a retirement savings account",
    balanceChf: "CHF 58'430.55",
  },
];

export const creditCards: CreditCard[] = [
  {
    id: "visa-gold",
    name: "Visa Gold",
    amountChf: "CHF 1'240.35",
    last4: "4821",
  },
  {
    id: "mastercard-silver",
    name: "Mastercard Silver",
    amountChf: "CHF 430.10",
    last4: "9073",
  },
];

export const pendingOrders: PendingOrder[] = [
  {
    id: "order-1",
    label: "Regie du Lac",
    executionDate: "03.05.2026",
    amountChf: "CHF 1'750.00",
  },
  {
    id: "order-2",
    label: "Helsana",
    executionDate: "07.05.2026",
    amountChf: "CHF 420.40",
  },
  {
    id: "order-3",
    label: "Swisscom",
    executionDate: "10.05.2026",
    amountChf: "CHF 79.90",
  },
];

export const standingOrders: StandingOrder[] = [
  {
    id: "standing-1",
    label: "Savings account",
    cadence: "Monthly",
    nextExecutionDate: "30.04.2026",
    amountChf: "CHF 500.00",
  },
  {
    id: "standing-2",
    label: "3a retirement account",
    cadence: "Monthly",
    nextExecutionDate: "01.05.2026",
    amountChf: "CHF 300.00",
  },
];
