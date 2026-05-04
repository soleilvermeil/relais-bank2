import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  SquareArrowRightExit,
  SquareArrowRightEnter,
} from "lucide-react";
import Link from "next/link";
import type { TFunction } from "i18next";
import type { PastTransaction } from "@/data/banking-mock";
import { getServerT } from "@/lib/i18n/server";

type Props = {
  transactions: PastTransaction[];
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatSignedChf(amount: number, direction: "incoming" | "outgoing") {
  const sign = direction === "incoming" ? "+" : "-";
  return `${sign} CHF ${chfFormatter.format(amount)}`;
}

function getIconForTransaction(transaction: PastTransaction) {
  if (transaction.iconKind === "account_transfer") {
    return transaction.direction === "incoming"
      ? SquareArrowRightEnter
      : SquareArrowRightExit;
  }
  return transaction.direction === "incoming"
    ? BanknoteArrowDown
    : BanknoteArrowUp;
}

function groupByDate(transactions: PastTransaction[]) {
  const groups: Record<string, PastTransaction[]> = {};
  for (const transaction of transactions) {
    if (!groups[transaction.bookingDate]) {
      groups[transaction.bookingDate] = [];
    }
    groups[transaction.bookingDate].push(transaction);
  }
  return Object.entries(groups);
}

function getTransactionMeta(transaction: PastTransaction, t: TFunction) {
  const parts: string[] = [];
  if (transaction.destinationIban) {
    parts.push(t("pastTransactions.iban", { value: transaction.destinationIban }));
  }
  if (transaction.reference) {
    parts.push(t("pastTransactions.reference", { value: transaction.reference }));
  }
  if (transaction.shopAddress) {
    parts.push(transaction.shopAddress);
  }
  if (transaction.debitCardMaskedNumber) {
    parts.push(t("pastTransactions.card", { value: transaction.debitCardMaskedNumber }));
  }
  if (transaction.immediateFeeChf && transaction.immediateFeeChf > 0) {
    parts.push(
      t("pastTransactions.immediateFee", {
        value: chfFormatter.format(transaction.immediateFeeChf),
      }),
    );
  }
  return parts.join(" - ");
}

const accountNameKeyById: Record<string, string> = {
  checking: "accountNames.checking",
  savings: "accountNames.savings",
  "retirement-3a": "accountNames.retirement3a",
};

function getLocalizedTransactionLabel(transaction: PastTransaction, t: TFunction) {
  const counterpartyRef =
    transaction.direction === "incoming" ? transaction.sourceRef : transaction.destinationRef;

  if (counterpartyRef.entityType !== "account") {
    return transaction.label;
  }

  const key = accountNameKeyById[counterpartyRef.entityId];
  return key ? t(key) : transaction.label;
}

export async function PastTransactionsList({ transactions }: Props) {
  const { t } = await getServerT();
  const groups = groupByDate(transactions);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("pastTransactions.none")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map(([date, items]) => (
        <section key={date} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-black/30">
            {date}
          </h3>
          <div className="space-y-2">
            {items.map((transaction) => (
              <article key={transaction.id} className="py-1">
                {(() => {
                  const meta = getTransactionMeta(transaction, t);
                  const label = getLocalizedTransactionLabel(transaction, t);
                  return transaction.href ? (
                    <Link href={transaction.href} className="block rounded-xl hover:bg-muted/50 px-2 py-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex min-w-0 items-start gap-2">
                          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                            {(() => {
                              const Icon = getIconForTransaction(transaction);
                              return <Icon className="h-4 w-4" aria-hidden />;
                            })()}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">
                              {label}
                            </p>
                            {meta ? (
                              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                {meta}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <p
                          className={`text-sm font-semibold tabular-nums mr-2 ${
                            transaction.direction === "incoming"
                              ? "text-green-600"
                              : "text-foreground"
                          }`}
                        >
                          {formatSignedChf(transaction.amount, transaction.direction)}
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-1">
                      <div className="flex min-w-0 items-start gap-2">
                        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                          {(() => {
                            const Icon = getIconForTransaction(transaction);
                            return <Icon className="h-4 w-4" aria-hidden />;
                          })()}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {label}
                          </p>
                          {meta ? (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {meta}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          transaction.direction === "incoming"
                            ? "text-green-600"
                            : "text-foreground"
                        }`}
                      >
                        {formatSignedChf(transaction.amount, transaction.direction)}
                      </p>
                    </div>
                  );
                })()}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
