import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:scale-[0.98]",
  secondary:
    "bg-muted text-foreground border border-card-border hover:bg-card-border/40 active:scale-[0.98]",
  ghost:
    "text-primary underline-offset-4 hover:underline bg-transparent active:opacity-80",
};

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & {
  variant?: ButtonVariant;
  children: ReactNode;
  wide?: boolean;
  className?: string;
};

export function Button({
  variant = "primary",
  children,
  type = "button",
  wide = false,
  className,
  ...rest
}: Props) {
  const width = wide ? "w-full sm:w-auto" : "";
  const sizing = variant === "ghost" ? "text-sm" : "min-h-11 text-base";
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-medium transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizing} ${width} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </button>
  );
}
