"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";

export type UltimateDebtorDefaults = {
  name?: string;
  country?: string;
  town?: string;
  postalCode?: string;
  street?: string;
  buildingNumber?: string;
};

type Props = {
  defaults?: UltimateDebtorDefaults;
  /** When restoring from query string after preview validation. */
  forceOpen?: boolean;
};

const COUNTRY_CODES = ["CH", "FR", "DE", "IT", "AT", "LI"] as const;

export function UltimateDebtorFields({ defaults = {}, forceOpen = false }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(
    forceOpen ||
      Boolean(
        (defaults.name ?? "").trim() ||
          (defaults.town ?? "").trim() ||
          (defaults.postalCode ?? "").trim(),
      ),
  );
  const [name, setName] = useState(defaults.name ?? "");
  const [country, setCountry] = useState(
    (defaults.country ?? "CH").toUpperCase().slice(0, 2),
  );
  const [town, setTown] = useState(defaults.town ?? "");
  const [postalCode, setPostalCode] = useState(defaults.postalCode ?? "");
  const [street, setStreet] = useState(defaults.street ?? "");
  const [buildingNumber, setBuildingNumber] = useState(defaults.buildingNumber ?? "");
  const [nameError, setNameError] = useState("");
  const [postalError, setPostalError] = useState("");
  const [townError, setTownError] = useState("");
  const [countryError, setCountryError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(() => {
    if (!open) {
      return true;
    }
    const n = name.trim();
    const pc = postalCode.trim();
    const tw = town.trim();
    const c = country.trim().toUpperCase();
    const nextName = !n ? t("payForm.debtor.nameRequired") : "";
    const nextPostal = !pc ? t("payForm.address.postalRequired") : "";
    const nextTown = !tw ? t("payForm.address.townRequired") : "";
    const nextCountry = !COUNTRY_CODES.includes(c as (typeof COUNTRY_CODES)[number])
      ? t("payForm.address.countryInvalid")
      : "";
    setNameError(nextName);
    setPostalError(nextPostal);
    setTownError(nextTown);
    setCountryError(nextCountry);
    return !nextName && !nextPostal && !nextTown && !nextCountry;
  }, [country, name, open, postalCode, town, t]);

  useEffect(() => {
    const form = nameRef.current?.form;
    if (!form) {
      return;
    }
    const onSubmit = (event: Event) => {
      if (!validate()) {
        event.preventDefault();
        nameRef.current?.focus();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [validate]);

  return (
    <fieldset className="space-y-4 rounded-xl border border-dashed border-card-border p-4">
      <legend className="text-sm font-medium text-foreground">{t("payForm.debtor.legend")}</legend>
      <p className="text-sm text-muted-foreground">{t("payForm.debtor.hint")}</p>
      <input type="hidden" name="hasUltimateDebtor" value={open ? "1" : "0"} />

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("payForm.debtor.addToggle")}
        </button>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setNameError("");
              setPostalError("");
              setTownError("");
              setCountryError("");
            }}
            className="text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("payForm.debtor.removeToggle")}
          </button>

          <div className="space-y-2">
            <Label htmlFor="debtorName">{t("payForm.debtor.name")}</Label>
            <Input
              ref={nameRef}
              id="debtorName"
              name="debtorName"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) {
                  setNameError("");
                }
              }}
              onBlur={() => setNameError(!name.trim() && open ? t("payForm.debtor.nameRequired") : "")}
              aria-invalid={nameError ? "true" : "false"}
            />
            {nameError ? <p className="text-sm text-red-600">{nameError}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="debtorCountry">{t("payForm.debtor.country")}</Label>
            <select
              id="debtorCountry"
              name="debtorCountry"
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
              className="box-border min-h-11 w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}`)}
                </option>
              ))}
            </select>
            {countryError ? <p className="text-sm text-red-600">{countryError}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="debtorTown">{t("payForm.debtor.town")}</Label>
              <Input
                id="debtorTown"
                name="debtorTown"
                value={town}
                onChange={(e) => {
                  setTown(e.target.value);
                  if (townError) {
                    setTownError("");
                  }
                }}
                onBlur={() => setTownError(!town.trim() ? t("payForm.address.townRequired") : "")}
                aria-invalid={townError ? "true" : "false"}
              />
              {townError ? <p className="text-sm text-red-600">{townError}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtorPostalCode">{t("payForm.address.postalCode")}</Label>
              <Input
                id="debtorPostalCode"
                name="debtorPostalCode"
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
              />
              {postalError ? <p className="text-sm text-red-600">{postalError}</p> : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="debtorStreet">{t("payForm.debtor.street")}</Label>
              <Input
                id="debtorStreet"
                name="debtorStreet"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="debtorBuildingNumber">{t("payForm.debtor.buildingNumber")}</Label>
              <Input
                id="debtorBuildingNumber"
                name="debtorBuildingNumber"
                value={buildingNumber}
                onChange={(e) => setBuildingNumber(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </fieldset>
  );
}
