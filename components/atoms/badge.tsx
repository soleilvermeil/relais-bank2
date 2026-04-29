import type { ReactNode } from "react";

type Props = { children: ReactNode; variant?: "default" | "accent" };

export function Badge({ children, variant = "default" }: Props) {
  const className =
    variant === "accent"
      ? "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
      : "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground";
  return <span className={className}>{children}</span>;
}
