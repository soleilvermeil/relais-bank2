"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

export type BeneficiaryAddressDefaults = {
  street?: string;
  buildingNumber?: string;
  postalCode?: string;
  town?: string;
  country?: string;
};

type Props = {
  defaults?: BeneficiaryAddressDefaults;
};

const COUNTRY_CODES = ["CH", "FR", "DE", "IT", "AT", "LI"] as const;

export function BeneficiaryAddressFields({ defaults = {} }: Props) {
  const { t } = useTranslation();
  const [street, setStreet] = useState(defaults.street ?? "");
  const [buildingNumber, setBuildingNumber] = useState(defaults.buildingNumber ?? "");
  const [postalCode, setPostalCode] = useState(defaults.postalCode ?? "");
  const [town, setTown] = useState(defaults.town ?? "");
  const [country, setCountry] = useState(
    (defaults.country ?? "CH").toUpperCase().slice(0, 2),
  );
  const [postalError, setPostalError] = useState("");
  const [townError, setTownError] = useState("");
  const [countryError, setCountryError] = useState("");
  const townRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(() => {
    const pc = postalCode.trim();
    const tw = town.trim();
    const c = country.trim().toUpperCase();
    const nextPostal = !pc ? t("payForm.address.postalRequired") : "";
    const nextTown = !tw ? t("payForm.address.townRequired") : "";
    const nextCountry = !COUNTRY_CODES.includes(c as (typeof COUNTRY_CODES)[number])
      ? t("payForm.address.countryInvalid")
      : "";
    setPostalError(nextPostal);
    setTownError(nextTown);
    setCountryError(nextCountry);
    return !nextPostal && !nextTown && !nextCountry;
  }, [country, postalCode, town, t]);

  useEffect(() => {
    const form = townRef.current?.form;
    if (!form) {
      return;
    }
    const onSubmit = (event: Event) => {
      if (!validate()) {
        event.preventDefault();
        townRef.current?.focus();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [validate]);

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-medium text-foreground">
        {t("payForm.address.legend")}
      </legend>
      <p className="text-sm text-muted-foreground">{t("payForm.address.hint")}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="beneficiaryCountry">{t("payForm.address.country")}</Label>
          <select
            id="beneficiaryCountry"
            name="beneficiaryCountry"
            required
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              if (countryError) {
                setCountryError("");
              }
            }}
            onBlur={() =>
              setCountryError(
                !COUNTRY_CODES.includes(country.trim().toUpperCase() as (typeof COUNTRY_CODES)[number])
                  ? t("payForm.address.countryInvalid")
                  : "",
              )
            }
            aria-invalid={countryError ? "true" : "false"}
            autoComplete="country"
            className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            {COUNTRY_CODES.map((code) => (
              <option key={code} value={code}>
                {t(`countries.${code}`)}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{t("payForm.address.countryHint")}</p>
          {countryError ? <p className="text-sm text-red-600">{countryError}</p> : null}
        </div>

        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem] sm:items-start">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="beneficiaryTown">{t("payForm.address.town")}</Label>
              <Input
                ref={townRef}
                id="beneficiaryTown"
                name="beneficiaryTown"
                required
                value={town}
                onChange={(e) => {
                  setTown(e.target.value);
                  if (townError) {
                    setTownError("");
                  }
                }}
                onBlur={() => setTownError(!town.trim() ? t("payForm.address.townRequired") : "")}
                aria-invalid={townError ? "true" : "false"}
                autoComplete="address-level2"
              />
              {townError ? <p className="text-sm text-red-600">{townError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryPostalCode">
                {t("payForm.address.postalCode")}
              </Label>
              <Input
                id="beneficiaryPostalCode"
                name="beneficiaryPostalCode"
                required
                value={postalCode}
                onChange={(e) => {
                  setPostalCode(e.target.value);
                  if (postalError) {
                    setPostalError("");
                  }
                }}
                onBlur={() =>
                  setPostalError(!postalCode.trim() ? t("payForm.address.postalRequired") : "")
                }
                aria-invalid={postalError ? "true" : "false"}
                autoComplete="postal-code"
              />
              {postalError ? <p className="text-sm text-red-600">{postalError}</p> : null}
            </div>
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="grid gap-4 sm:grid-cols-[3fr_1fr]">
            <div className="space-y-2">
              <Label htmlFor="beneficiaryStreet">{t("payForm.address.streetOptional")}</Label>
              <Input
                id="beneficiaryStreet"
                name="beneficiaryStreet"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                autoComplete="address-line1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="beneficiaryBuildingNumber">
                {t("payForm.address.buildingNumberOptional")}
              </Label>
              <Input
                id="beneficiaryBuildingNumber"
                name="beneficiaryBuildingNumber"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
                autoComplete="address-line2"
              />
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
