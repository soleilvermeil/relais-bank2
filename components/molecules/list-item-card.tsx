import Link from "next/link";

type Props = {
  name: string;
  metaLabel: string;
  metaValue: string;
  amount: number;
  href: string;
  sign?: "positive" | "negative";
};

const chfFormatter = new Intl.NumberFormat("de-CH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatChf(amount: number, sign?: "positive" | "negative") {
  const prefix = sign === "positive" ? "+ " : sign === "negative" ? "- " : "";
  return `${prefix}CHF ${chfFormatter.format(amount)}`;
}

export function ListItemCard({
  name,
  metaLabel,
  metaValue,
  amount,
  href,
  sign,
}: Props) {
  return (
    <Link
      href={href}
      className="block cursor-pointer rounded-xl border border-card-border bg-background p-4 hover:bg-muted"
    >
      <article>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2">
          <h3 className="min-w-0 text-base font-semibold text-foreground break-words">
            {name}
          </h3>
          <p className="whitespace-nowrap text-right text-base font-semibold tabular-nums">
            {formatChf(amount, sign)}
          </p>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {metaLabel}:{" "}
          <span className="font-medium text-foreground tabular-nums">{metaValue}</span>
        </p>
      </article>
    </Link>
  );
}
