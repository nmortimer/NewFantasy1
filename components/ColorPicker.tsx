import { useEffect, useState } from "react";

type Props = { label: string; value: string; onChange: (hex: string) => void; };

function clean(hex: string) {
  const x = hex.trim().replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return `#${x.padEnd(6, "0")}`;
}

export default function ColorPicker({ label, value, onChange }: Props) {
  const [hex, setHex] = useState(clean(value));
  useEffect(() => setHex(clean(value)), [value]);

  function set(val: string) {
    const c = clean(val);
    setHex(c);
    onChange(c);
  }

  return (
    <div className="space-y-1">
      <label className="block text-xs text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={hex}
          onChange={(e) => set(e.target.value)}
          className="h-9 w-12 cursor-pointer rounded-lg border border-border bg-transparent p-0"
        />
        <span className="badge">{hex.toUpperCase()}</span>
      </div>
    </div>
  );
}
