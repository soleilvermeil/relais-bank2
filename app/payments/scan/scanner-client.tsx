"use client";

import dynamic from "next/dynamic";

type Props = {
  defaultSourceRef: string;
};

const PaymentQrScanner = dynamic(
  () =>
    import("@/components/organisms/payment-qr-scanner").then((module) => ({
      default: module.PaymentQrScanner,
    })),
  { ssr: false },
);

export function ScanPaymentClient({ defaultSourceRef }: Props) {
  return <PaymentQrScanner defaultSourceRef={defaultSourceRef} />;
}
