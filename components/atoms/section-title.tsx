import type { ReactNode } from "react";

type Props = {
  as?: "h1" | "h2";
  children: ReactNode;
  id?: string;
  className?: string;
};

export function SectionTitle({
  as: Tag = "h2",
  children,
  id,
  className: extra,
}: Props) {
  const base =
    Tag === "h1"
      ? "text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
      : "text-xl font-semibold tracking-tight text-foreground sm:text-2xl";
  const className = extra ? `${base} ${extra}` : base;
  return (
    <Tag className={className} id={id}>
      {children}
    </Tag>
  );
}
