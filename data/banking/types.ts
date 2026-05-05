import type { PaymentReferenceType, SwissAddress } from "@/lib/swiss-qr-bill/types";

export type { PaymentReferenceType, SwissAddress };

export type StandingFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "semiAnnual"
  | "yearly";

export type HolidayShift = "before" | "after";

export type StandingOrderSchedule = {
  firstExecutionDate: string;
  nextExecutionDate: string;
  frequency: StandingFrequency;
  holidayShift: HolidayShift;
  /** Omitted or empty string means unlimited period. */
  endDate?: string;
};

export type UltimateDebtor = {
  name: string;
  address: SwissAddress;
};

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

export type DetailSourceType = "account" | "card";
export type ExternalEntityType =
  | "external_organization"
  | "external_person"
  | "merchant";
export type EntityType = DetailSourceType | ExternalEntityType;

export type EntityRef = {
  entityType: EntityType;
  entityId: string;
};

export type ExternalEntity = {
  id: string;
  type: ExternalEntityType;
  name: string;
  iban?: string;
  address?: SwissAddress;
};

export type MoneyMovementBase = {
  id: string;
  amount: number;
  sourceRef: EntityRef;
  destinationRef: EntityRef;
  label?: string;
  reference?: string;
  referenceType?: PaymentReferenceType;
  notice?: string;
  accountingEntry?: string;
  destinationIban?: string;
  beneficiaryAddress?: SwissAddress;
  holidayShift?: HolidayShift;
  ultimateDebtor?: UltimateDebtor;
  debitCardMaskedNumber?: string;
};

export type PendingOrderRecord = MoneyMovementBase & {
  executionDate: string;
};

export type StandingOrderRecord = MoneyMovementBase & StandingOrderSchedule;

export type PostedTransactionRecord = MoneyMovementBase & {
  bookingDate: string;
  /** Set for immediate pay (fee shown in UI). */
  immediateFeeChf?: number;
};

export type TransactionDirection = "incoming" | "outgoing";
export type TransactionIconKind = "account_transfer" | "default";

export type PendingOrder = {
  id: string;
  label: string;
  executionDate: string;
  amount: number;
  sourceRef: EntityRef;
  destinationRef: EntityRef;
  reference?: string;
  referenceType?: PaymentReferenceType;
  destinationIban?: string;
};

export type StandingOrder = {
  id: string;
  label: string;
  frequency: StandingFrequency;
  firstExecutionDate: string;
  nextExecutionDate: string;
  holidayShift: HolidayShift;
  endDate?: string;
  amount: number;
  sourceRef: EntityRef;
  destinationRef: EntityRef;
  reference?: string;
  referenceType?: PaymentReferenceType;
  destinationIban?: string;
};

export type PaymentDetail =
  | {
      id: string;
      paymentType: "pending";
      amount: number;
      sourceRef: EntityRef;
      destinationRef: EntityRef;
      sourceLabel: string;
      destinationLabel: string;
      executionDate: string;
      reference?: string;
      referenceType?: PaymentReferenceType;
      notice?: string;
      accountingEntry?: string;
      destinationIban?: string;
      beneficiaryAddress?: SwissAddress;
      ultimateDebtor?: UltimateDebtor;
    }
  | {
      id: string;
      paymentType: "standing";
      amount: number;
      sourceRef: EntityRef;
      destinationRef: EntityRef;
      sourceLabel: string;
      destinationLabel: string;
      frequency: StandingFrequency;
      holidayShift: HolidayShift;
      firstExecutionDate: string;
      nextExecutionDate: string;
      endDate?: string;
      reference?: string;
      referenceType?: PaymentReferenceType;
      notice?: string;
      accountingEntry?: string;
      destinationIban?: string;
      beneficiaryAddress?: SwissAddress;
      ultimateDebtor?: UltimateDebtor;
    }
  | {
      id: string;
      paymentType: "posted";
      amount: number;
      sourceRef: EntityRef;
      destinationRef: EntityRef;
      sourceLabel: string;
      destinationLabel: string;
      bookingDate: string;
      reference?: string;
      referenceType?: PaymentReferenceType;
      notice?: string;
      accountingEntry?: string;
      destinationIban?: string;
      beneficiaryAddress?: SwissAddress;
      ultimateDebtor?: UltimateDebtor;
      debitCardMaskedNumber?: string;
      /** Included in amount; shown separately in details when present. */
      immediateExecutionFeeChf?: number;
    };

export type ConfirmedOperation = {
  id: string;
  type: "pay" | "transfer";
  createdAtIso: string;
  sourceRef: EntityRef;
  destinationRef: EntityRef;
  amount: number;
  currency: "CHF";
  executionDate: string;
  reference: string;
  referenceType?: PaymentReferenceType;
  notice?: string;
  accountingEntry?: string;
  paymentSchedule?: "one_time" | "standing";
  standing?: StandingOrderSchedule;
  ultimateDebtor?: UltimateDebtor;
  paymentDetails?: {
    beneficiaryIban: string;
    beneficiaryBic?: string;
    beneficiaryAddress?: SwissAddress;
  };
  transactionDetails?: {
    destinationIban?: string;
    debitCardMaskedNumber?: string;
  };
  immediateExecution?: boolean;
  immediateFeeChf?: number;
};

export type PastTransaction = {
  id: string;
  bookingDate: string;
  label: string;
  amount: number;
  direction: TransactionDirection;
  iconKind: TransactionIconKind;
  sourceRef: EntityRef;
  destinationRef: EntityRef;
  reference?: string;
  referenceType?: PaymentReferenceType;
  notice?: string;
  accountingEntry?: string;
  destinationIban?: string;
  beneficiaryAddress?: SwissAddress;
  debitCardMaskedNumber?: string;
  href?: string;
  immediateFeeChf?: number;
};
