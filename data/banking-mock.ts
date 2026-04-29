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
