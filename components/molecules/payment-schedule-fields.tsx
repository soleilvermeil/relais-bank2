"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import type { HolidayShift, StandingFrequency } from "@/data/banking/types";
import { PaymentAmountAndScheduling } from "@/components/molecules/payment-amount-and-scheduling";

const FREQUENCIES: StandingFrequency[] = [
  "weekly",
  "monthly",
  "quarterly",
  "semiAnnual",
  "yearly",
];

export type PaymentScheduleDefaults = {
  paymentSchedule?: "one_time" | "standing";
  executionDate?: string;
  immediateExecution?: boolean;
  standingFirstExecutionDate?: string;
  standingFrequency?: StandingFrequency;
  standingHolidayShift?: HolidayShift;
  standingHasEnd?: boolean;
  standingEndDate?: string;
};

type Props = {
  mode: "pay" | "transfer";
  tomorrowIso: string;
  executionDefaultValue: string;
  defaultImmediate: boolean;
  defaults?: PaymentScheduleDefaults;
};

export function PaymentScheduleFields({
  mode,
  tomorrowIso,
  executionDefaultValue,
  defaultImmediate,
  defaults = {},
}: Props) {
  const { t } = useTranslation();
  const initialSchedule = defaults.paymentSchedule ?? "one_time";
  const [schedule, setSchedule] = useState<"one_time" | "standing">(initialSchedule);
  const [hasEnd, setHasEnd] = useState(defaults.standingHasEnd === true);

  const defaultFirstStanding =
    defaults.standingFirstExecutionDate &&
    defaults.standingFirstExecutionDate >= tomorrowIso
      ? defaults.standingFirstExecutionDate
      : tomorrowIso;

  const freqDefault = defaults.standingFrequency ?? "monthly";
  const shiftDefault = defaults.standingHolidayShift ?? "before";

  const freqLabel = useMemo(
    () =>
      FREQUENCIES.reduce(
        (acc, f) => {
          acc[f] = t(`cadence.${f}`);
          return acc;
        },
        {} as Record<StandingFrequency, string>,
      ),
    [t],
  );

  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">
          {t("payForm.paymentSchedule.label")}
        </legend>
        <div className="inline-grid min-h-11 w-full grid-cols-2 rounded-full border border-card-border bg-card p-1 sm:w-auto">
          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
              schedule === "one_time"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <input
              type="radio"
              name="paymentSchedule"
              value="one_time"
              checked={schedule === "one_time"}
              onChange={() => setSchedule("one_time")}
              className="sr-only"
            />
            {t("payForm.paymentSchedule.oneTime")}
          </label>
          <label
            className={`inline-flex cursor-pointer items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition ${
              schedule === "standing"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-foreground hover:bg-muted/60"
            }`}
          >
            <input
              type="radio"
              name="paymentSchedule"
              value="standing"
              checked={schedule === "standing"}
              onChange={() => setSchedule("standing")}
              className="sr-only"
            />
            {t("payForm.paymentSchedule.standing")}
          </label>
        </div>
      </fieldset>

      {schedule === "one_time" ? (
        <PaymentAmountAndScheduling
          mode={mode}
          tomorrowIso={tomorrowIso}
          executionDefaultValue={executionDefaultValue}
          defaultImmediate={defaultImmediate}
        />
      ) : (
        <div className="space-y-4">
          <input type="hidden" name="immediateExecution" value="0" />
          <div className="space-y-2">
            <Label htmlFor="standingFirstExecutionDate">
              {t("payForm.paymentSchedule.firstExecutionDate")}
            </Label>
            <Input
              id="standingFirstExecutionDate"
              name="standingFirstExecutionDate"
              type="date"
              min={tomorrowIso}
              defaultValue={defaultFirstStanding}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="standingFrequency">{t("payForm.paymentSchedule.frequency")}</Label>
            <select
              id="standingFrequency"
              name="standingFrequency"
              className="box-border min-h-11 w-full max-w-md rounded-xl border border-card-border bg-card px-3 py-2.5 text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
              defaultValue={freqDefault}
              required
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {freqLabel[f]}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-foreground">
              {t("payForm.paymentSchedule.holidayShift")}
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="standingHolidayShift"
                  value="before"
                  defaultChecked={shiftDefault === "before"}
                />
                {t("payForm.paymentSchedule.holidayShiftBefore")}
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="standingHolidayShift"
                  value="after"
                  defaultChecked={shiftDefault === "after"}
                />
                {t("payForm.paymentSchedule.holidayShiftAfter")}
              </label>
            </div>
          </fieldset>
          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-foreground">
              {t("payForm.paymentSchedule.period")}
            </legend>
            <div className="flex flex-wrap gap-4">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="standingHasEnd"
                  value="0"
                  checked={!hasEnd}
                  onChange={() => setHasEnd(false)}
                />
                {t("payForm.paymentSchedule.unlimited")}
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="standingHasEnd"
                  value="1"
                  checked={hasEnd}
                  onChange={() => setHasEnd(true)}
                />
                {t("payForm.paymentSchedule.endDate")}
              </label>
            </div>
            {hasEnd ? (
              <div className="space-y-2">
                <Label htmlFor="standingEndDate">{t("payForm.paymentSchedule.endDatePicker")}</Label>
                <Input
                  id="standingEndDate"
                  name="standingEndDate"
                  type="date"
                  min={defaultFirstStanding}
                  defaultValue={defaults.standingEndDate ?? ""}
                  required={hasEnd}
                />
              </div>
            ) : null}
          </fieldset>
        </div>
      )}
    </div>
  );
}
