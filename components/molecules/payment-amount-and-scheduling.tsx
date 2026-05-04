"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { PAY_IMMEDIATE_FEE_CHF } from "@/lib/payment-immediate";

type Props = {
  mode: "pay" | "transfer";
  amountDefaultValue: string;
  tomorrowIso: string;
  executionDefaultValue: string;
  defaultImmediate: boolean;
};

export function PaymentAmountAndScheduling({
  mode,
  amountDefaultValue,
  tomorrowIso,
  executionDefaultValue,
  defaultImmediate,
}: Props) {
  const { t } = useTranslation();
  const [immediate, setImmediate] = useState(defaultImmediate);

  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const showPayFee = mode === "pay" && immediate;
  const amountLabel = mode === "pay" ? t("payForm.amount") : t("transferForm.amount");

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-card-border bg-muted/40 px-4 py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1">
            <Label htmlFor="immediate-exec-toggle">{t("paymentScheduling.immediateExecution")}</Label>
            <p className="text-sm text-muted-foreground">
              {mode === "pay"
                ? t("paymentScheduling.immediateHintPay")
                : t("paymentScheduling.immediateHintTransfer")}
            </p>
            {showPayFee ? (
              <p className="text-sm font-medium text-foreground">
                {t("paymentScheduling.immediateFeePay", {
                  fee: PAY_IMMEDIATE_FEE_CHF.toFixed(2),
                })}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            id="immediate-exec-toggle"
            role="switch"
            aria-checked={immediate}
            onClick={() => setImmediate((v) => !v)}
            className={`relative inline-flex h-9 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              immediate ? "bg-primary" : "bg-muted"
            }`}
          >
            <span
              className={`pointer-events-none block h-8 w-8 rounded-full bg-background shadow transition-transform ${
                immediate ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <input type="hidden" name="immediateExecution" value={immediate ? "1" : "0"} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="scheduling-amount">{amountLabel}</Label>
          <Input
            id="scheduling-amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            defaultValue={amountDefaultValue}
            required
          />
        </div>
        {immediate ? (
          <>
            <input type="hidden" name="executionDate" value={todayIso} />
            <div className="flex flex-col justify-end space-y-2">
              <Label>{t("common.executionDate")}</Label>
              <p className="pb-0.5 text-sm font-medium">{t("paymentScheduling.executedToday")}</p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="executionDate">{t("common.executionDate")}</Label>
            <Input
              id="executionDate"
              name="executionDate"
              type="date"
              min={tomorrowIso}
              defaultValue={executionDefaultValue}
              required
            />
          </div>
        )}
      </div>
    </div>
  );
}
