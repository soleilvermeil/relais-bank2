import type { LabelHTMLAttributes, ReactNode } from "react";

type Props = Omit<LabelHTMLAttributes<HTMLLabelElement>, "className"> & {
  children: ReactNode;
};

export function Label({ children, ...rest }: Props) {
  return (
    <label className="text-sm font-medium text-foreground" {...rest}>
      {children}
    </label>
  );
}
