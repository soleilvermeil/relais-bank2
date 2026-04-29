type Props = {
  name: string;
  metaLabel: string;
  metaValue: string;
  amount: number;
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatChf(amount: number) {
  return `CHF ${chfFormatter.format(amount)}`;
}

export function ListItemCard({ name, metaLabel, metaValue, amount }: Props) {
  return (
    <article className="rounded-xl border border-card-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">{name}</h3>
        <p className="text-base font-semibold tabular-nums">{formatChf(amount)}</p>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {metaLabel}:{" "}
        <span className="font-medium text-foreground tabular-nums">{metaValue}</span>
      </p>
    </article>
  );
}
