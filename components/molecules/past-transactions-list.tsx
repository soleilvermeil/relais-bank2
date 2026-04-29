import type { PastTransaction } from "@/data/banking-mock";

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

export function PastTransactionsList({ transactions }: Props) {
  const groups = groupByDate(transactions);

  if (groups.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No past transactions available.
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
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {transaction.label}
                  </p>
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
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
