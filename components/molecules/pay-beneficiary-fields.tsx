"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/atoms/label";
import { formatIbanForDisplay, isValidIban, normalizeIban } from "@/lib/iban";

type Props = {
  defaultPaymentType?: "domestic" | "international";
  defaultBeneficiaryIban?: string;
  defaultBeneficiaryBic?: string;
};

function normalizeBic(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function isValidBic(bic: string) {
  return /^[A-Z]{6}[A-Z2-9][A-NP-Z0-9]([A-Z0-9]{3})?$/.test(bic);
}

export function PayBeneficiaryFields({
  defaultPaymentType = "domestic",
  defaultBeneficiaryIban = "",
  defaultBeneficiaryBic = "",
}: Props) {
  const { t } = useTranslation();
  const [paymentType, setPaymentType] = useState<"domestic" | "international">(
    defaultPaymentType,
  );
  const [beneficiaryIban, setBeneficiaryIban] = useState(
    formatIbanForDisplay(defaultBeneficiaryIban),
  );
  const [beneficiaryBic, setBeneficiaryBic] = useState(
    normalizeBic(defaultBeneficiaryBic),
  );
  const [ibanError, setIbanError] = useState("");
  const [bicError, setBicError] = useState("");
  const ibanInputRef = useRef<HTMLInputElement>(null);
  const bicInputRef = useRef<HTMLInputElement>(null);

  const getIbanError = useCallback((value: string) => {
    const iban = normalizeIban(value);
    if (!iban) {
      return t("payBeneficiary.ibanRequired");
    }
    if (!isValidIban(iban)) {
      return t("payBeneficiary.ibanInvalid");
    }
    return "";
  }, [t]);

  const getBicError = useCallback((value: string, isInternational: boolean) => {
    const bic = normalizeBic(value);
    if (!isInternational) {
      return "";
    }
    if (!bic) {
      return t("payBeneficiary.bicRequired");
    }
    if (!isValidBic(bic)) {
      return t("payBeneficiary.bicInvalid");
    }
    return "";
  }, [t]);

  const validateFields = useCallback(() => {
    const nextIbanError = getIbanError(beneficiaryIban);
    const nextBicError = getBicError(
      beneficiaryBic,
      paymentType === "international",
    );
    setIbanError(nextIbanError);
    setBicError(nextBicError);
    return !nextIbanError && !nextBicError;
  }, [beneficiaryBic, beneficiaryIban, getBicError, getIbanError, paymentType]);

  useEffect(() => {
    const form = ibanInputRef.current?.form;
    if (!form) {
      return;
    }

    const handleSubmit = (event: Event) => {
      if (!validateFields()) {
        event.preventDefault();
        if (getIbanError(beneficiaryIban)) {
          ibanInputRef.current?.focus();
        } else {
          bicInputRef.current?.focus();
        }
      }
    };

    form.addEventListener("submit", handleSubmit);
    return () => form.removeEventListener("submit", handleSubmit);
  }, [beneficiaryBic, beneficiaryIban, getIbanError, validateFields, paymentType]);

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{t("payBeneficiary.paymentType")}</legend>
        <p className="text-sm text-muted-foreground">
          {t("payBeneficiary.hint")}
        </p>
        <div className="inline-grid min-h-11 w-full grid-cols-2 rounded-full border border-card-border bg-card p-1 sm:w-auto">
          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
              paymentType === "domestic"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <input
              type="radio"
              name="paymentType"
              value="domestic"
              checked={paymentType === "domestic"}
              onChange={() => setPaymentType("domestic")}
              required
              className="sr-only"
            />
            {t("payBeneficiary.domestic")}
          </label>
          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
              paymentType === "international"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <input
              type="radio"
              name="paymentType"
              value="international"
              checked={paymentType === "international"}
              onChange={() => setPaymentType("international")}
              required
              className="sr-only"
            />
            {t("payBeneficiary.international")}
          </label>
        </div>
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="beneficiaryIban">{t("payBeneficiary.iban")}</Label>
        <input
          ref={ibanInputRef}
          id="beneficiaryIban"
          name="beneficiaryIban"
          required
          value={beneficiaryIban}
          onChange={(event) => {
            setBeneficiaryIban(formatIbanForDisplay(event.target.value));
            if (ibanError) {
              setIbanError(getIbanError(event.target.value));
            }
          }}
          onBlur={() => setIbanError(getIbanError(beneficiaryIban))}
          aria-invalid={ibanError ? "true" : "false"}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500"
        />
        {ibanError ? <p className="text-sm text-red-600">{ibanError}</p> : null}
        <p className="text-sm text-muted-foreground">
          {t("payBeneficiary.ibanExample")}
        </p>
      </div>

      {paymentType === "international" ? (
        <div className="space-y-2">
          <Label htmlFor="beneficiaryBic">{t("payBeneficiary.bic")}</Label>
          <input
            ref={bicInputRef}
            id="beneficiaryBic"
            name="beneficiaryBic"
            required
            value={beneficiaryBic}
            onChange={(event) => {
              setBeneficiaryBic(normalizeBic(event.target.value));
              if (bicError) {
                setBicError(
                  getBicError(event.target.value, paymentType === "international"),
                );
              }
            }}
            onBlur={() =>
              setBicError(getBicError(beneficiaryBic, paymentType === "international"))
            }
            aria-invalid={bicError ? "true" : "false"}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500"
          />
          {bicError ? <p className="text-sm text-red-600">{bicError}</p> : null}
          <p className="text-sm text-muted-foreground">{t("payBeneficiary.bicExample")}</p>
        </div>
      ) : null}
    </div>
  );
}
