import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  focusColor?: string;
};

export function CustomSelect({ value, onChange, options, placeholder = "Tất cả", focusColor = "focus:border-red-400 focus:ring-red-100" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  const current = options.find((o) => o.value === value);
  const label = current?.label || placeholder;

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`min-h-12 w-full flex items-center justify-between rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-3 text-sm font-semibold text-slate-700 shadow-sm outline-none transition ${focusColor} focus:ring-4`}
      >
        <span className={current ? "text-slate-700" : "text-slate-400"}>{label}</span>
        <ChevronDown size={18} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-4 py-3 text-left text-sm font-semibold transition hover:bg-slate-50 ${opt.value === value ? "bg-red-50 text-red-600" : "text-slate-700"}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
