"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Label } from "@/components/atoms/label";
import { formatIbanForDisplay, isValidIban, normalizeIban } from "@/lib/iban";

type Props = {
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
  defaultBeneficiaryIban = "",
  defaultBeneficiaryBic = "",
}: Props) {
  const { t } = useTranslation();
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

  const getBicError = useCallback((value: string) => {
    const bic = normalizeBic(value);
    if (!bic) {
      return "";
    }
    if (!isValidBic(bic)) {
      return t("payBeneficiary.bicInvalid");
    }
    return "";
  }, [t]);

  const validateFields = useCallback(() => {
    const nextIbanError = getIbanError(beneficiaryIban);
    const nextBicError = getBicError(beneficiaryBic);
    setIbanError(nextIbanError);
    setBicError(nextBicError);
    return !nextIbanError && !nextBicError;
  }, [beneficiaryBic, beneficiaryIban, getBicError, getIbanError]);

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
  }, [beneficiaryBic, beneficiaryIban, getIbanError, validateFields]);

  return (
    <div className="space-y-5">
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

      <div className="space-y-2">
        <Label htmlFor="beneficiaryBic">{t("payBeneficiary.bicOptional")}</Label>
        <input
          ref={bicInputRef}
          id="beneficiaryBic"
          name="beneficiaryBic"
          value={beneficiaryBic}
          onChange={(event) => {
            setBeneficiaryBic(normalizeBic(event.target.value));
            if (bicError) {
              setBicError(getBicError(event.target.value));
            }
          }}
          onBlur={() => setBicError(getBicError(beneficiaryBic))}
          aria-invalid={bicError ? "true" : "false"}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-red-500 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-500"
        />
        {bicError ? <p className="text-sm text-red-600">{bicError}</p> : null}
        <p className="text-sm text-muted-foreground">{t("payBeneficiary.bicExample")}</p>
      </div>
    </div>
  );
}
