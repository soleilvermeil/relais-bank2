import {
  isExecutionDateStrictlyBeforeToday,
  isExecutionDateTodayOrLater,
  parseExecutionDate,
} from "@/lib/payment-execution-date";
import {
  readPaymentOperationDeltas,
  type PaymentOperationDelta,
} from "@/lib/payment-cookies";
import {
  normalizeQrrDigits,
  normalizeScorReference,
  type PaymentReferenceType,
  type SwissAddress,
} from "@/lib/swiss-qr-bill/types";

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

type ExternalEntity = {
  id: string;
  type: ExternalEntityType;
  name: string;
  iban?: string;
  address?: SwissAddress;
};

type MoneyMovementBase = {
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
  debitCardMaskedNumber?: string;
};

export type PendingOrderRecord = MoneyMovementBase & {
  executionDate: string;
};

export type StandingOrderRecord = MoneyMovementBase & {
  cadence: string;
  nextExecutionDate: string;
};

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
  cadence: string;
  nextExecutionDate: string;
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
    }
  | {
      id: string;
      paymentType: "standing";
      amount: number;
      sourceRef: EntityRef;
      destinationRef: EntityRef;
      sourceLabel: string;
      destinationLabel: string;
      cadence: string;
      nextExecutionDate: string;
      reference?: string;
      referenceType?: PaymentReferenceType;
      notice?: string;
      accountingEntry?: string;
      destinationIban?: string;
      beneficiaryAddress?: SwissAddress;
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
  paymentDetails?: {
    paymentType: "domestic" | "international";
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

function inferReferenceType(
  reference: string | undefined,
  explicit?: PaymentReferenceType,
): PaymentReferenceType | undefined {
  if (explicit) {
    return explicit;
  }
  const r = (reference ?? "").trim();
  if (!r) {
    return undefined;
  }
  if (normalizeScorReference(r).startsWith("RF")) {
    return "SCOR";
  }
  if (normalizeQrrDigits(r).length === 27) {
    return "QRR";
  }
  return undefined;
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

const externalEntities: ExternalEntity[] = [
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

const basePendingOrderRecords: PendingOrderRecord[] = [
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

const baseStandingOrderRecords: StandingOrderRecord[] = [
  {
    id: "standing-1",
    amount: 500,
    cadence: "Monthly",
    nextExecutionDate: "30.04.2026",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "savings" },
  },
  {
    id: "standing-2",
    amount: 300,
    cadence: "Monthly",
    nextExecutionDate: "01.05.2026",
    sourceRef: { entityType: "account", entityId: "checking" },
    destinationRef: { entityType: "account", entityId: "retirement-3a" },
  },
];

const basePostedTransactionRecords: PostedTransactionRecord[] = [
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

function toConfirmedOperation(
  delta: PaymentOperationDelta,
): ConfirmedOperation {
  return {
    id: delta.id,
    type: delta.type,
    createdAtIso: delta.createdAtIso,
    sourceRef: delta.sourceRef,
    destinationRef: delta.destinationRef,
    amount: delta.amount,
    currency: delta.currency,
    executionDate: delta.executionDate,
    reference: delta.reference,
    referenceType: delta.referenceType,
    notice: delta.notice,
    accountingEntry: delta.accountingEntry,
    paymentDetails: delta.paymentDetails,
    transactionDetails: delta.transactionDetails,
    immediateExecution: delta.immediateExecution === true,
    immediateFeeChf: delta.immediateFeeChf,
  };
}

function toPendingRecordFromOperation(
  operation: ConfirmedOperation,
): PendingOrderRecord {
  return {
    id: `pending-${operation.id}`,
    amount: operation.amount,
    executionDate: operation.executionDate,
    sourceRef: operation.sourceRef,
    destinationRef: operation.destinationRef,
    reference: operation.reference,
    referenceType: operation.referenceType,
    notice: operation.notice,
    accountingEntry: operation.accountingEntry,
    destinationIban:
      operation.transactionDetails?.destinationIban ??
      operation.paymentDetails?.beneficiaryIban,
    beneficiaryAddress: operation.paymentDetails?.beneficiaryAddress,
  };
}

function toPostedRecordFromOperation(
  operation: ConfirmedOperation,
): PostedTransactionRecord {
  const fee = operation.immediateFeeChf ?? 0;
  return {
    id: `posted-${operation.id}`,
    bookingDate: operation.executionDate,
    amount: operation.amount + fee,
    sourceRef: operation.sourceRef,
    destinationRef: operation.destinationRef,
    reference: operation.reference,
    referenceType: operation.referenceType,
    notice: operation.notice,
    accountingEntry: operation.accountingEntry,
    destinationIban:
      operation.transactionDetails?.destinationIban ??
      operation.paymentDetails?.beneficiaryIban,
    beneficiaryAddress: operation.paymentDetails?.beneficiaryAddress,
    debitCardMaskedNumber: operation.transactionDetails?.debitCardMaskedNumber,
    immediateFeeChf: operation.immediateFeeChf,
  };
}

async function getConfirmedOperationState() {
  const deltas = await readPaymentOperationDeltas();
  return deltas.map(toConfirmedOperation);
}

function userOperationsPending(operations: ConfirmedOperation[]) {
  return operations.filter(
    (op) =>
      !op.immediateExecution &&
      isExecutionDateTodayOrLater(op.executionDate),
  );
}

function userOperationsPosted(operations: ConfirmedOperation[]) {
  return operations.filter(
    (op) =>
      op.immediateExecution === true ||
      isExecutionDateStrictlyBeforeToday(op.executionDate),
  );
}

function getEndOfNextMonth(reference: Date) {
  return new Date(reference.getFullYear(), reference.getMonth() + 2, 0);
}

function refsEqual(a: EntityRef, b: EntityRef) {
  return a.entityType === b.entityType && a.entityId === b.entityId;
}

function getEntityLabel(ref: EntityRef) {
  if (ref.entityType === "account") {
    return accounts.find((a) => a.id === ref.entityId)?.name ?? ref.entityId;
  }
  if (ref.entityType === "card") {
    return creditCards.find((c) => c.id === ref.entityId)?.name ?? ref.entityId;
  }
  return (
    externalEntities.find(
      (entity) => entity.id === ref.entityId && entity.type === ref.entityType,
    )?.name ?? ref.entityId
  );
}

function getEntityIban(ref: EntityRef) {
  if (ref.entityType === "account") {
    return accounts.find((a) => a.id === ref.entityId)?.iban;
  }
  if (ref.entityType === "external_organization") {
    return externalEntities.find(
      (entity) => entity.id === ref.entityId && entity.type === ref.entityType,
    )?.iban;
  }
  return undefined;
}

function getEntityBeneficiaryAddress(ref: EntityRef): SwissAddress | undefined {
  return externalEntities.find(
    (entity) => entity.id === ref.entityId && entity.type === ref.entityType,
  )?.address;
}

function getCounterpartyLabel(
  perspectiveRef: EntityRef,
  sourceRef: EntityRef,
  destinationRef: EntityRef,
) {
  if (refsEqual(perspectiveRef, sourceRef)) {
    return getEntityLabel(destinationRef);
  }
  if (refsEqual(perspectiveRef, destinationRef)) {
    return getEntityLabel(sourceRef);
  }
  return getEntityLabel(destinationRef);
}

function getDirection(
  perspectiveRef: EntityRef,
  sourceRef: EntityRef,
  destinationRef: EntityRef,
): TransactionDirection {
  if (refsEqual(perspectiveRef, destinationRef)) {
    return "incoming";
  }
  return "outgoing";
}

function getTransactionIconKind(
  sourceRef: EntityRef,
  destinationRef: EntityRef,
): TransactionIconKind {
  if (sourceRef.entityType === "account" && destinationRef.entityType === "account") {
    return "account_transfer";
  }
  return "default";
}

function toPendingOrder(
  record: PendingOrderRecord,
  perspectiveRef: EntityRef | null = null,
): PendingOrder {
  return {
    id: record.id,
    label: perspectiveRef
      ? getCounterpartyLabel(perspectiveRef, record.sourceRef, record.destinationRef)
      : getEntityLabel(record.destinationRef),
    executionDate: record.executionDate,
    amount: record.amount,
    sourceRef: record.sourceRef,
    destinationRef: record.destinationRef,
    reference: record.reference,
    referenceType: inferReferenceType(record.reference, record.referenceType),
    destinationIban: record.destinationIban ?? getEntityIban(record.destinationRef),
  };
}

function toStandingOrder(
  record: StandingOrderRecord,
  perspectiveRef: EntityRef | null = null,
): StandingOrder {
  return {
    id: record.id,
    label: perspectiveRef
      ? getCounterpartyLabel(perspectiveRef, record.sourceRef, record.destinationRef)
      : getEntityLabel(record.destinationRef),
    cadence: record.cadence,
    nextExecutionDate: record.nextExecutionDate,
    amount: record.amount,
    sourceRef: record.sourceRef,
    destinationRef: record.destinationRef,
    reference: record.reference,
    referenceType: inferReferenceType(record.reference, record.referenceType),
    destinationIban: record.destinationIban ?? getEntityIban(record.destinationRef),
  };
}

export async function getPendingOrders(): Promise<PendingOrder[]> {
  const operations = await getConfirmedOperationState();
  const operationPending = userOperationsPending(operations).map(
    toPendingRecordFromOperation,
  );
  return [...operationPending, ...basePendingOrderRecords].map((record) =>
    toPendingOrder(record),
  );
}

export async function getStandingOrders(): Promise<StandingOrder[]> {
  return baseStandingOrderRecords.map((record) => toStandingOrder(record));
}

export async function getPaymentDetail(
  paymentType: "pending" | "standing" | "posted",
  paymentId: string,
): Promise<PaymentDetail | null> {
  if (paymentType === "pending") {
    const operations = await getConfirmedOperationState();
    const mergedPending = [
      ...userOperationsPending(operations).map(toPendingRecordFromOperation),
      ...basePendingOrderRecords,
    ];
    const payment = mergedPending.find((item) => item.id === paymentId);
    if (!payment) {
      return null;
    }
    return {
      id: payment.id,
      paymentType: "pending",
      amount: payment.amount,
      sourceRef: payment.sourceRef,
      destinationRef: payment.destinationRef,
      sourceLabel: getEntityLabel(payment.sourceRef),
      destinationLabel: getEntityLabel(payment.destinationRef),
      executionDate: payment.executionDate,
      reference: payment.reference,
      referenceType: inferReferenceType(payment.reference, payment.referenceType),
      notice: payment.notice,
      accountingEntry: payment.accountingEntry,
      destinationIban: payment.destinationIban ?? getEntityIban(payment.destinationRef),
      beneficiaryAddress:
        payment.beneficiaryAddress ?? getEntityBeneficiaryAddress(payment.destinationRef),
    };
  }

  if (paymentType === "standing") {
    const standing = baseStandingOrderRecords.find((item) => item.id === paymentId);
    if (!standing) {
      return null;
    }
    return {
      id: standing.id,
      paymentType: "standing",
      amount: standing.amount,
      sourceRef: standing.sourceRef,
      destinationRef: standing.destinationRef,
      sourceLabel: getEntityLabel(standing.sourceRef),
      destinationLabel: getEntityLabel(standing.destinationRef),
      cadence: standing.cadence,
      nextExecutionDate: standing.nextExecutionDate,
      reference: standing.reference,
      referenceType: inferReferenceType(standing.reference, standing.referenceType),
      notice: standing.notice,
      accountingEntry: standing.accountingEntry,
      destinationIban: standing.destinationIban ?? getEntityIban(standing.destinationRef),
      beneficiaryAddress:
        standing.beneficiaryAddress ??
        getEntityBeneficiaryAddress(standing.destinationRef),
    };
  }

  const operations = await getConfirmedOperationState();
  const mergedPosted = [
    ...userOperationsPosted(operations).map(toPostedRecordFromOperation),
    ...basePostedTransactionRecords,
  ];
  const posted = mergedPosted.find((item) => item.id === paymentId);
  if (!posted) {
    return null;
  }
  return {
    id: posted.id,
    paymentType: "posted",
    amount: posted.amount,
    sourceRef: posted.sourceRef,
    destinationRef: posted.destinationRef,
    sourceLabel: getEntityLabel(posted.sourceRef),
    destinationLabel: getEntityLabel(posted.destinationRef),
    bookingDate: posted.bookingDate,
    reference: posted.reference,
    referenceType: inferReferenceType(posted.reference, posted.referenceType),
    notice: posted.notice,
    accountingEntry: posted.accountingEntry,
    destinationIban: posted.destinationIban ?? getEntityIban(posted.destinationRef),
    beneficiaryAddress:
      posted.beneficiaryAddress ?? getEntityBeneficiaryAddress(posted.destinationRef),
    debitCardMaskedNumber: posted.debitCardMaskedNumber,
    immediateExecutionFeeChf: posted.immediateFeeChf,
  };
}

export async function getPendingOrdersUntilNextMonth(
  sourceType: DetailSourceType,
  sourceId: string,
  referenceDate: Date = new Date(),
) {
  const operations = await getConfirmedOperationState();
  const mergedPending = [
    ...userOperationsPending(operations).map(toPendingRecordFromOperation),
    ...basePendingOrderRecords,
  ];
  const perspectiveRef: EntityRef = { entityType: sourceType, entityId: sourceId };
  const cutoffDate = getEndOfNextMonth(referenceDate);
  return mergedPending
    .filter((order) => {
      const isRelated =
        refsEqual(order.sourceRef, perspectiveRef) ||
        refsEqual(order.destinationRef, perspectiveRef);
      const exec = parseExecutionDate(order.executionDate);
      return isRelated && exec !== null && exec <= cutoffDate;
    })
    .map((order) => toPendingOrder(order, perspectiveRef));
}

export async function getPastTransactionsForSource(
  sourceType: DetailSourceType,
  sourceId: string,
): Promise<PastTransaction[]> {
  const operations = await getConfirmedOperationState();
  const mergedPosted = [
    ...userOperationsPosted(operations).map(toPostedRecordFromOperation),
    ...basePostedTransactionRecords,
  ];
  const perspectiveRef: EntityRef = { entityType: sourceType, entityId: sourceId };
  return mergedPosted
    .filter(
      (record) =>
        refsEqual(record.sourceRef, perspectiveRef) ||
        refsEqual(record.destinationRef, perspectiveRef),
    )
    .map((record) => ({
      id: record.id,
      bookingDate: record.bookingDate,
      label: getCounterpartyLabel(
        perspectiveRef,
        record.sourceRef,
        record.destinationRef,
      ),
      amount: record.amount,
      direction: getDirection(
        perspectiveRef,
        record.sourceRef,
        record.destinationRef,
      ),
      iconKind: getTransactionIconKind(record.sourceRef, record.destinationRef),
      sourceRef: record.sourceRef,
      destinationRef: record.destinationRef,
      reference: record.reference,
      referenceType: inferReferenceType(record.reference, record.referenceType),
      notice: record.notice,
      accountingEntry: record.accountingEntry,
      destinationIban: record.destinationIban ?? getEntityIban(record.destinationRef),
      beneficiaryAddress:
        record.beneficiaryAddress ?? getEntityBeneficiaryAddress(record.destinationRef),
      debitCardMaskedNumber: record.debitCardMaskedNumber,
      immediateFeeChf: record.immediateFeeChf,
      href: `/payments/posted/${encodeURIComponent(record.id)}`,
    }));
}

export async function getAccountsWithLiveBalances(): Promise<Account[]> {
  const operations = await getConfirmedOperationState();
  const postedOperations = userOperationsPosted(operations);
  const deltasByAccount = new Map<string, number>();

  for (const operation of postedOperations) {
    const totalAmount = operation.amount + (operation.immediateFeeChf ?? 0);
    if (operation.sourceRef.entityType === "account") {
      const current = deltasByAccount.get(operation.sourceRef.entityId) ?? 0;
      deltasByAccount.set(operation.sourceRef.entityId, current - totalAmount);
    }
    if (operation.destinationRef.entityType === "account") {
      const current = deltasByAccount.get(operation.destinationRef.entityId) ?? 0;
      deltasByAccount.set(operation.destinationRef.entityId, current + operation.amount);
    }
  }

  return accounts.map((account) => ({
    ...account,
    balance: account.balance + (deltasByAccount.get(account.id) ?? 0),
  }));
}

export async function getConfirmedOperations() {
  return getConfirmedOperationState();
}
