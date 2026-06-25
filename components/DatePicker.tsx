"use client";

import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "Choisir une date",
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full rounded-xl border border-accent-light bg-soft px-4 py-3 text-left text-sm text-ink outline-none focus:border-accent"
      >
        {value ? formatDate(value) : <span className="text-ink/40">{placeholder}</span>}
      </button>

      {open && (
        <div className="absolute z-10 mt-2 rounded-xl bg-white p-2 shadow-lg">
          <DayPicker
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null);
              setOpen(false);
            }}
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  );
}
