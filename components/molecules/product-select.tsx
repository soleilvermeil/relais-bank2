"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type ProductSelectOption = {
  value: string;
  label: string;
  detail: string;
  amountLabel: string;
};

type Props = {
  id: string;
  name: string;
  options: ProductSelectOption[];
  placeholder: string;
  defaultValue?: string;
  required?: boolean;
};

export function ProductSelect({
  id,
  name,
  options,
  placeholder,
  defaultValue = "",
  required = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  function onSelect(nextValue: string) {
    setValue(nextValue);
    setIsOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        onChange={(event) => setValue(event.target.value)}
        className="sr-only"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={`${id}-listbox`}
        onClick={() => setIsOpen((current) => !current)}
        className="box-border min-h-[72px] w-full rounded-xl border border-card-border bg-card px-3 py-2.5 text-left text-base text-foreground shadow-inner focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring"
      >
        {selectedOption ? (
          <span className="block">
            <span className="flex items-center justify-between gap-3">
              <span className="font-medium">{selectedOption.label}</span>
              <span className="font-medium tabular-nums">{selectedOption.amountLabel}</span>
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">{selectedOption.detail}</span>
          </span>
        ) : (
          <span className="block">
            <span className="block font-medium text-muted-foreground">{placeholder}</span>
            <span className="mt-0.5 block text-sm text-transparent select-none">placeholder</span>
          </span>
        )}
      </button>

      {isOpen ? (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label={name}
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-card-border bg-card p-1 shadow-lg"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => onSelect(option.value)}
                  className={`w-full rounded-lg px-3 py-2 text-left ${
                    isSelected ? "bg-muted" : "hover:bg-muted/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-medium text-foreground">{option.label}</span>
                    <span className="font-medium tabular-nums text-foreground">{option.amountLabel}</span>
                  </span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{option.detail}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
