"use client";

import { Check, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  label: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  menuAlign?: "left" | "right";
  menuWidthClassName?: string;
  disabled?: boolean;
  leadingIcon?: LucideIcon;
};

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder = "Seleccionar",
  menuAlign = "right",
  menuWidthClassName = "min-w-[10rem]",
  disabled = false,
  leadingIcon: LeadingIcon,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selected = options.find((option) => option.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function select(optionValue: string) {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  function handleButtonKeyDown(event: React.KeyboardEvent) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setIsOpen(true);
    }
  }

  function handleOptionKeyDown(event: React.KeyboardEvent, optionValue: string) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(optionValue);
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = containerRef.current?.querySelector<HTMLElement>(
        `[data-option="${optionValue}"] ~ [data-option]`,
      );
      next?.focus();
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const allOptions = Array.from(
        containerRef.current?.querySelectorAll<HTMLElement>("[data-option]") ?? [],
      );
      const idx = allOptions.findIndex((el) => el.dataset.option === optionValue);
      allOptions[idx - 1]?.focus();
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <span id={`${listboxId}-label`} className="sr-only">
        {label}
      </span>

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={`${listboxId}-label`}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={handleButtonKeyDown}
        className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 outline-none transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 aria-expanded:border-emerald-300 aria-expanded:bg-emerald-50 aria-expanded:text-emerald-900 aria-expanded:ring-4 aria-expanded:ring-emerald-100"
      >
        {LeadingIcon ? <LeadingIcon size={16} aria-hidden="true" /> : null}
        <span>{displayLabel}</span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={[
            "text-slate-400 transition-transform duration-150",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={[
            "absolute top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-2xl border border-slate-200 bg-white py-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.12)]",
            menuWidthClassName,
            menuAlign === "left" ? "left-0" : "right-0",
          ].join(" ")}
        >
          {options.map((option) => {
            const isSelected = option.value === value;

            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                data-option={option.value}
                tabIndex={0}
                onClick={() => select(option.value)}
                onKeyDown={(event) => handleOptionKeyDown(event, option.value)}
                className={[
                  "flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-sm font-semibold outline-none transition",
                  isSelected
                    ? "bg-emerald-50 text-emerald-900"
                    : "text-slate-700 hover:bg-slate-50 focus:bg-slate-50",
                ].join(" ")}
              >
                <span>{option.label}</span>
                {isSelected ? (
                  <Check size={15} className="text-emerald-700" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
