import {
  formatSwissLocalDate,
  isExecutionDateStrictlyBeforeToday,
  isExecutionDateTodayOrLater,
  parseExecutionDate,
  startOfLocalDay,
} from "@/lib/payment-execution-date";
import {
  readPaymentOperationDeltas,
  type PaymentOperationDelta,
} from "@/lib/payment-cookies";
import {
  basePendingOrderRecords,
  basePostedTransactionRecords,
  baseStandingOrderRecords,
  accounts,
  creditCards,
  externalEntities,
} from "@/data/banking/seed";
import type {
  ConfirmedOperation,
  DetailSourceType,
  EntityRef,
  PastTransaction,
  PaymentDetail,
  PendingOrder,
  PendingOrderRecord,
  PostedTransactionRecord,
  StandingOrder,
  StandingOrderRecord,
  SwissAddress,
  TransactionDirection,
  TransactionIconKind,
} from "@/data/banking/types";
import type { PaymentReferenceType } from "@/lib/swiss-qr-bill/types";
import { normalizeQrrDigits, normalizeScorReference } from "@/lib/swiss-qr-bill/types";

export type {
  Account,
  ConfirmedOperation,
  CreditCard,
  DetailSourceType,
  EntityRef,
  EntityType,
  ExternalEntity,
  ExternalEntityType,
  PastTransaction,
  PaymentDetail,
  PendingOrder,
  PostedTransactionRecord,
  StandingFrequency,
  StandingOrder,
  StandingOrderRecord,
  StandingOrderSchedule,
  TransactionDirection,
  TransactionIconKind,
  UltimateDebtor,
} from "@/data/banking/types";

export { accounts, creditCards } from "@/data/banking/seed";

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

function isStandingOperation(op: ConfirmedOperation): boolean {
  return op.paymentSchedule === "standing";
}

function toConfirmedOperation(delta: PaymentOperationDelta): ConfirmedOperation {
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
    paymentSchedule: delta.paymentSchedule ?? "one_time",
    standing: delta.standing,
    ultimateDebtor: delta.ultimateDebtor,
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
    ultimateDebtor: operation.ultimateDebtor,
  };
}

function toStandingRecordFromOperation(
  operation: ConfirmedOperation,
): StandingOrderRecord {
  const standing = operation.standing;
  if (!standing) {
    throw new Error("Standing operation missing schedule");
  }
  return {
    id: `standing-${operation.id}`,
    amount: operation.amount,
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
    holidayShift: standing.holidayShift,
    ultimateDebtor: operation.ultimateDebtor,
    firstExecutionDate: standing.firstExecutionDate,
    nextExecutionDate: standing.nextExecutionDate,
    frequency: standing.frequency,
    endDate: standing.endDate,
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
    holidayShift: operation.standing?.holidayShift,
    ultimateDebtor: operation.ultimateDebtor,
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
      !isStandingOperation(op) &&
      !op.immediateExecution &&
      isExecutionDateTodayOrLater(op.executionDate),
  );
}

function userOperationsPosted(operations: ConfirmedOperation[]) {
  return operations.filter(
    (op) =>
      !isStandingOperation(op) &&
      (op.immediateExecution === true ||
        isExecutionDateStrictlyBeforeToday(op.executionDate)),
  );
}

function userOperationsStanding(operations: ConfirmedOperation[]) {
  return operations.filter((op) => isStandingOperation(op));
}

function getSameDayNextMonth(reference: Date) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const day = reference.getDate();
  const lastDayOfNextMonth = new Date(year, month + 2, 0).getDate();
  const clampedDay = Math.min(day, lastDayOfNextMonth);
  return new Date(year, month + 1, clampedDay);
}

function addFrequencyStep(date: Date, frequency: StandingOrder["frequency"]) {
  const next = new Date(date.getTime());
  if (frequency === "weekly") {
    next.setDate(next.getDate() + 7);
    return next;
  }
  if (frequency === "monthly") {
    next.setMonth(next.getMonth() + 1);
    return next;
  }
  if (frequency === "quarterly") {
    next.setMonth(next.getMonth() + 3);
    return next;
  }
  if (frequency === "semiAnnual") {
    next.setMonth(next.getMonth() + 6);
    return next;
  }
  next.setFullYear(next.getFullYear() + 1);
  return next;
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
    frequency: record.frequency,
    firstExecutionDate: record.firstExecutionDate,
    nextExecutionDate: record.nextExecutionDate,
    holidayShift: record.holidayShift,
    endDate: record.endDate,
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
  const operations = await getConfirmedOperationState();
  const fromOps = userOperationsStanding(operations).map(toStandingRecordFromOperation);
  return [...fromOps, ...baseStandingOrderRecords].map((record) => toStandingOrder(record));
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
      ultimateDebtor: payment.ultimateDebtor,
    };
  }

  if (paymentType === "standing") {
    const operations = await getConfirmedOperationState();
    const mergedStanding = [
      ...userOperationsStanding(operations).map(toStandingRecordFromOperation),
      ...baseStandingOrderRecords,
    ];
    const standing = mergedStanding.find((item) => item.id === paymentId);
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
      frequency: standing.frequency,
      holidayShift: standing.holidayShift,
      firstExecutionDate: standing.firstExecutionDate,
      nextExecutionDate: standing.nextExecutionDate,
      endDate: standing.endDate,
      reference: standing.reference,
      referenceType: inferReferenceType(standing.reference, standing.referenceType),
      notice: standing.notice,
      accountingEntry: standing.accountingEntry,
      destinationIban: standing.destinationIban ?? getEntityIban(standing.destinationRef),
      beneficiaryAddress:
        standing.beneficiaryAddress ??
        getEntityBeneficiaryAddress(standing.destinationRef),
      ultimateDebtor: standing.ultimateDebtor,
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
    ultimateDebtor: posted.ultimateDebtor,
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
  const mergedStanding = [
    ...userOperationsStanding(operations).map(toStandingRecordFromOperation),
    ...baseStandingOrderRecords,
  ];
  const perspectiveRef: EntityRef = { entityType: sourceType, entityId: sourceId };
  const startDate = startOfLocalDay(referenceDate);
  const cutoffDate = getSameDayNextMonth(referenceDate);

  const pendingItems = mergedPending
    .filter((order) => {
      const isRelated =
        refsEqual(order.sourceRef, perspectiveRef) ||
        refsEqual(order.destinationRef, perspectiveRef);
      const exec = parseExecutionDate(order.executionDate);
      return isRelated && exec !== null && exec >= startDate && exec <= cutoffDate;
    })
    .map((order) => {
      const pending = toPendingOrder(order, perspectiveRef);
      const exec = parseExecutionDate(pending.executionDate);
      return {
        ...pending,
        id: pending.id,
        href: `/payments/pending/${encodeURIComponent(pending.id)}`,
        executionDate: exec ? formatSwissLocalDate(exec) : pending.executionDate,
        scheduleType: "pending" as const,
      };
    });

  const standingItems = mergedStanding.flatMap((order) => {
    const isRelated =
      refsEqual(order.sourceRef, perspectiveRef) ||
      refsEqual(order.destinationRef, perspectiveRef);
    if (!isRelated) {
      return [];
    }

    const start = parseExecutionDate(order.nextExecutionDate);
    if (!start) {
      return [];
    }
    const endDate = order.endDate ? parseExecutionDate(order.endDate) : null;
    const results: Array<{
      id: string;
      label: string;
      amount: number;
      sourceRef: EntityRef;
      destinationRef: EntityRef;
      executionDate: string;
      destinationIban?: string;
      reference?: string;
      referenceType?: PaymentReferenceType;
      href: string;
      scheduleType: "standing";
      frequency: StandingOrder["frequency"];
    }> = [];

    let cursor = new Date(start.getTime());
    while (cursor < startDate) {
      cursor = addFrequencyStep(cursor, order.frequency);
    }
    while (cursor <= cutoffDate && (!endDate || cursor <= endDate)) {
      const standing = toStandingOrder(order, perspectiveRef);
      results.push({
        id: `${standing.id}-${formatSwissLocalDate(cursor)}`,
        label: standing.label,
        amount: standing.amount,
        sourceRef: standing.sourceRef,
        destinationRef: standing.destinationRef,
        executionDate: formatSwissLocalDate(cursor),
        destinationIban: standing.destinationIban,
        reference: standing.reference,
        referenceType: standing.referenceType,
        href: `/payments/standing/${encodeURIComponent(standing.id)}`,
        scheduleType: "standing",
        frequency: standing.frequency,
      });
      cursor = addFrequencyStep(cursor, order.frequency);
    }
    return results;
  });

  return [...pendingItems, ...standingItems].sort((a, b) => {
    const d1 = parseExecutionDate(a.executionDate);
    const d2 = parseExecutionDate(b.executionDate);
    if (!d1 || !d2) return 0;
    return d1.getTime() - d2.getTime();
  });
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

export async function getAccountsWithLiveBalances(): Promise<
  import("@/data/banking/types").Account[]
> {
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
