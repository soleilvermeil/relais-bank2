import type { ReactNode } from "react";

type Props = { children: ReactNode };

export function Container({ children }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-6">
      {children}
    </div>
  );
}
