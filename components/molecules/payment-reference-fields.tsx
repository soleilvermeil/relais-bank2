"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/atoms/label";
import {
  isValidQrrReference,
  isValidScorReference,
  normalizeQrrDigits,
  normalizeScorReference,
  type PaymentReferenceType,
} from "@/lib/swiss-qr-bill/types";

type RefMode = "none" | "QRR" | "SCOR";

type Props = {
  defaultReferenceType?: PaymentReferenceType | "";
  defaultReference?: string;
};

function modeFromDefaults(
  refType: PaymentReferenceType | "" | undefined,
  refValue: string | undefined,
): RefMode {
  const t = (refType ?? "").toUpperCase();
  const v = (refValue ?? "").trim();
  if (t === "QRR" && v) {
    return "QRR";
  }
  if (t === "SCOR" && v) {
    return "SCOR";
  }
  if (!t || t === "NON") {
    const digits = normalizeQrrDigits(v);
    if (digits.length === 27) {
      return "QRR";
    }
    if (normalizeScorReference(v).startsWith("RF")) {
      return "SCOR";
    }
    return "none";
  }
  return "none";
}

export function PaymentReferenceFields({
  defaultReferenceType = "",
  defaultReference = "",
}: Props) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<RefMode>(() =>
    modeFromDefaults(defaultReferenceType, defaultReference),
  );
  const [qrrInput, setQrrInput] = useState(() =>
    modeFromDefaults(defaultReferenceType, defaultReference) === "QRR"
      ? normalizeQrrDigits(defaultReference)
      : "",
  );
  const [scorInput, setScorInput] = useState(() =>
    modeFromDefaults(defaultReferenceType, defaultReference) === "SCOR"
      ? normalizeScorReference(defaultReference)
      : "",
  );
  const [error, setError] = useState("");
  const qrrRef = useRef<HTMLInputElement>(null);
  const scorRef = useRef<HTMLInputElement>(null);

  const referenceTypeValue: PaymentReferenceType =
    mode === "QRR" ? "QRR" : mode === "SCOR" ? "SCOR" : "NON";
  const referenceValue =
    mode === "QRR"
      ? normalizeQrrDigits(qrrInput)
      : mode === "SCOR"
        ? normalizeScorReference(scorInput)
        : "";

  const validate = useCallback(() => {
    if (mode === "none") {
      setError("");
      return true;
    }
    if (mode === "QRR") {
      const digits = normalizeQrrDigits(qrrInput);
      if (!isValidQrrReference(digits)) {
        setError(t("paymentReference.qrrInvalid"));
        return false;
      }
      setError("");
      return true;
    }
    const scor = normalizeScorReference(scorInput);
    if (!isValidScorReference(scor)) {
      setError(t("paymentReference.scorInvalid"));
      return false;
    }
    setError("");
    return true;
  }, [mode, qrrInput, scorInput, t]);

  useEffect(() => {
    const form = qrrRef.current?.form ?? scorRef.current?.form;
    if (!form) {
      return;
    }
    const onSubmit = (event: Event) => {
      if (!validate()) {
        event.preventDefault();
        if (mode === "QRR") {
          qrrRef.current?.focus();
        } else if (mode === "SCOR") {
          scorRef.current?.focus();
        }
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [mode, validate]);

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-foreground">
        {t("paymentReference.legend")}
      </legend>
      <p className="text-sm text-muted-foreground">{t("paymentReference.hintExclusive")}</p>

      <input type="hidden" name="referenceType" value={referenceTypeValue} readOnly />
      <input type="hidden" name="reference" value={referenceValue} readOnly />

      <div className="inline-grid min-h-11 w-full grid-cols-3 rounded-full border border-card-border bg-card p-1 sm:w-auto">
        {(["none", "QRR", "SCOR"] as const).map((m) => (
          <label
            key={m}
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-3 py-2 text-xs font-medium transition sm:px-4 sm:text-sm ${
              mode === m
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <input
              type="radio"
              checked={mode === m}
              onChange={() => {
                setMode(m);
                setError("");
                if (m !== "QRR") {
                  setQrrInput("");
                }
                if (m !== "SCOR") {
                  setScorInput("");
                }
              }}
              className="sr-only"
            />
            {m === "none"
              ? t("paymentReference.none")
              : m === "QRR"
                ? t("paymentReference.qrr")
                : t("paymentReference.scor")}
          </label>
        ))}
      </div>

      {mode === "QRR" ? (
        <div className="space-y-2">
          <Label htmlFor="paymentReferenceQrr">{t("paymentReference.qrrLabel")}</Label>
          <input
            ref={qrrRef}
            id="paymentReferenceQrr"
            type="text"
            inputMode="numeric"
            value={qrrInput}
            onChange={(e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 27);
              setQrrInput(next);
              if (error) {
                setError("");
              }
            }}
            onBlur={() => {
              if (qrrInput && !isValidQrrReference(normalizeQrrDigits(qrrInput))) {
                setError(t("paymentReference.qrrInvalid"));
              }
            }}
            placeholder={t("paymentReference.placeholderQrr")}
            aria-invalid={error && mode === "QRR" ? "true" : "false"}
            className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-sm text-muted-foreground">{t("paymentReference.qrrHelp")}</p>
        </div>
      ) : null}

      {mode === "SCOR" ? (
        <div className="space-y-2">
          <Label htmlFor="paymentReferenceScor">{t("paymentReference.scorLabel")}</Label>
          <input
            ref={scorRef}
            id="paymentReferenceScor"
            type="text"
            value={scorInput}
            onChange={(e) => {
              setScorInput(normalizeScorReference(e.target.value));
              if (error) {
                setError("");
              }
            }}
            onBlur={() => {
              const s = normalizeScorReference(scorInput);
              if (s && !isValidScorReference(s)) {
                setError(t("paymentReference.scorInvalid"));
              }
            }}
            placeholder={t("paymentReference.placeholderScor")}
            aria-invalid={error && mode === "SCOR" ? "true" : "false"}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-sm text-muted-foreground">{t("paymentReference.scorHelp")}</p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </fieldset>
  );
}
