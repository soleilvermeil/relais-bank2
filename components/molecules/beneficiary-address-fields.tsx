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

export function BeneficiaryAddressFields({ defaults = {} }: Props) {
  const { t } = useTranslation();
  const [street, setStreet] = useState(defaults.street ?? "");
  const [buildingNumber, setBuildingNumber] = useState(defaults.buildingNumber ?? "");
  const [postalCode, setPostalCode] = useState(defaults.postalCode ?? "");
  const [town, setTown] = useState(defaults.town ?? "");
  const [country, setCountry] = useState(
    (defaults.country ?? "CH").toUpperCase().slice(0, 2),
  );
  const [streetError, setStreetError] = useState("");
  const [postalError, setPostalError] = useState("");
  const [townError, setTownError] = useState("");
  const [countryError, setCountryError] = useState("");
  const streetRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(() => {
    const s = street.trim();
    const pc = postalCode.trim();
    const tw = town.trim();
    const c = country.trim().toUpperCase();
    const nextStreet = !s ? t("payForm.address.streetRequired") : "";
    const nextPostal = !pc ? t("payForm.address.postalRequired") : "";
    const nextTown = !tw ? t("payForm.address.townRequired") : "";
    const nextCountry = !/^[A-Z]{2}$/.test(c)
      ? t("payForm.address.countryInvalid")
      : "";
    setStreetError(nextStreet);
    setPostalError(nextPostal);
    setTownError(nextTown);
    setCountryError(nextCountry);
    return !nextStreet && !nextPostal && !nextTown && !nextCountry;
  }, [country, postalCode, street, town, t]);

  useEffect(() => {
    const form = streetRef.current?.form;
    if (!form) {
      return;
    }
    const onSubmit = (event: Event) => {
      if (!validate()) {
        event.preventDefault();
        streetRef.current?.focus();
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="beneficiaryStreet">{t("payForm.address.street")}</Label>
          <Input
            ref={streetRef}
            id="beneficiaryStreet"
            name="beneficiaryStreet"
            required
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);
              if (streetError) {
                setStreetError("");
              }
            }}
            onBlur={() => setStreetError(!street.trim() ? t("payForm.address.streetRequired") : "")}
            aria-invalid={streetError ? "true" : "false"}
            autoComplete="address-line1"
          />
          {streetError ? <p className="text-sm text-red-600">{streetError}</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="beneficiaryBuildingNumber">
            {t("payForm.address.buildingNumber")}
          </Label>
          <Input
            id="beneficiaryBuildingNumber"
            name="beneficiaryBuildingNumber"
            value={buildingNumber}
            onChange={(e) => setBuildingNumber(e.target.value)}
            autoComplete="address-line2"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="beneficiaryPostalCode">{t("payForm.address.postalCode")}</Label>
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="beneficiaryTown">{t("payForm.address.town")}</Label>
          <Input
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
          <Label htmlFor="beneficiaryCountry">{t("payForm.address.country")}</Label>
          <Input
            id="beneficiaryCountry"
            name="beneficiaryCountry"
            required
            maxLength={2}
            value={country}
            onChange={(e) => {
              setCountry(e.target.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2));
              if (countryError) {
                setCountryError("");
              }
            }}
            onBlur={() =>
              setCountryError(
                !/^[A-Z]{2}$/.test(country.trim().toUpperCase())
                  ? t("payForm.address.countryInvalid")
                  : "",
              )
            }
            aria-invalid={countryError ? "true" : "false"}
            autoComplete="country"
          />
          <p className="text-xs text-muted-foreground">{t("payForm.address.countryHint")}</p>
          {countryError ? <p className="text-sm text-red-600">{countryError}</p> : null}
        </div>
      </div>
    </fieldset>
  );
}
