"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getTomorrowLocalIso } from "@/lib/payment-execution-date";
import { parseSwissQrBillPayload } from "@/lib/swiss-qr-bill/parse";

type Html5QrcodeInstance = import("html5-qrcode").Html5Qrcode;

type Props = {
  defaultSourceRef: string;
};

export function PaymentQrScanner({ defaultSourceRef }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const scannerId = `qr-scanner-${useId().replace(/:/g, "-")}`;
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [lastDecodedPayload, setLastDecodedPayload] = useState("");
  const isHandledRef = useRef(false);

  useEffect(() => {
    let disposed = false;
    let scanner: Html5QrcodeInstance | null = null;

    const handleDecodedText = (decodedText: string) => {
      if (isHandledRef.current) {
        return;
      }
      setLastDecodedPayload(decodedText);
      const parsed = parseSwissQrBillPayload(decodedText);
      if (!parsed) {
        // Useful when troubleshooting parser mismatches with supposedly valid Swiss QR-bills.
        console.info("Decoded QR payload:", decodedText);
        setError(t("scanPage.invalidQrBill"));
        return;
      }

      isHandledRef.current = true;
      setError("");

      const executionDate = getTomorrowLocalIso();
      const addr = parsed.creditorAddress;
      const ref = parsed.reference;
      const sharedParams = new URLSearchParams({
        source: defaultSourceRef,
        sourceRef: defaultSourceRef,
        recipientName: parsed.recipientName,
        paymentType: parsed.paymentType,
        beneficiaryIban: parsed.beneficiaryIban,
        beneficiaryBic: parsed.beneficiaryBic,
        referenceType: ref.type,
        reference: ref.value,
        beneficiaryStreet: addr.street,
        beneficiaryBuildingNumber: addr.buildingNumber,
        beneficiaryPostalCode: addr.postalCode,
        beneficiaryTown: addr.town,
        beneficiaryCountry: addr.country,
        notice: parsed.unstructuredMessage,
        amount: parsed.amount,
        executionDate,
      });

      if (parsed.shouldGoToPreview) {
        router.push(`/payments/pay/preview?${sharedParams.toString()}`);
        return;
      }

      router.push(`/payments/pay?${sharedParams.toString()}`);
    };

    const startScanner = async () => {
      try {
        const qrModule = await import("html5-qrcode");
        if (disposed) {
          return;
        }

        const Html5Qrcode = qrModule.Html5Qrcode;
        const Html5QrcodeSupportedFormats = qrModule.Html5QrcodeSupportedFormats;

        const scannerHost = document.getElementById(scannerId);
        if (!scannerHost) {
          return;
        }
        // Prevent duplicate camera views when effects re-run (e.g. React strict/dev lifecycle).
        scannerHost.innerHTML = "";

        scanner = new Html5Qrcode(scannerId);
        const scanConfig = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        };

        let started = false;

        try {
          await scanner.start(
            { facingMode: "environment" },
            scanConfig,
            handleDecodedText,
            () => undefined,
          );
          started = true;
        } catch {
          if (disposed) {
            return;
          }
          const cameras = await Html5Qrcode.getCameras();
          const preferredCamera = cameras.find((camera) =>
            /(back|rear|environment|arriere|arrière)/i.test(camera.label),
          );
          const fallbackCamera = preferredCamera ?? cameras[0];

          if (!fallbackCamera) {
            throw new Error("No camera device available.");
          }

          await scanner.start(
            fallbackCamera.id,
            scanConfig,
            handleDecodedText,
            () => undefined,
          );
          started = true;
        }

        if (disposed) {
          await scanner.stop().catch(() => undefined);
          scanner.clear();
          return;
        }

        if (!started) {
          throw new Error("Unable to start camera.");
        }

        if (!disposed) {
          setIsReady(true);
        }
      } catch {
        if (!disposed) {
          setError(t("scanPage.permissionDenied"));
        }
      }
    };

    void startScanner();

    return () => {
      disposed = true;
      if (!scanner) {
        return;
      }
      void scanner
        .stop()
        .catch(() => undefined)
        .finally(() => {
          scanner?.clear();
        });
    };
  }, [defaultSourceRef, router, scannerId, t]);

  return (
    <section className="rounded-2xl border border-card-border bg-card p-5 shadow-sm sm:p-6">
      <p className="mb-4 text-sm text-muted-foreground">{t("scanPage.instructions")}</p>
      <div id={scannerId} className="overflow-hidden rounded-xl border border-card-border" />
      {!isReady && !error ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("scanPage.initializing")}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      {lastDecodedPayload ? (
        <div className="mt-3 rounded-xl border border-card-border bg-muted/40 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Debug - decoded payload
          </p>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs text-foreground">
            {lastDecodedPayload}
          </pre>
        </div>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/payments"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-card-border bg-muted px-5 py-2.5 text-base font-medium text-foreground"
        >
          {t("scanPage.cancel")}
        </Link>
      </div>
    </section>
  );
}
