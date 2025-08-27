import { useState, useEffect } from 'react';

type Props = {
  label: string;
  value: string;
  onChange: (hex: string) => void;
};

function sanitizeHex(input: string) {
  const x = input.trim().replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
  return `#${x.padEnd(6, '0')}`;
}

/** Single, clear control: swatch is the selector; value is shown next to it. */
export default function ColorPicker({ label, value, onChange }: Props) {
  const [hex, setHex] = useState(sanitizeHex(value));

  useEffect(() => setHex(sanitizeHex(value)), [value]);

  function set(v: string) {
    const clean = sanitizeHex(v);
    setHex(clean);
    onChange(clean);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label className="small">{label}</label>
      <div className="row">
        <input
          type="color"
          aria-label={label}
          value={hex}
          onChange={(e) => set(e.target.value)}
          style={{
            width: 42,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: 0,
          }}
        />
        <code className="badge">{hex.toUpperCase()}</code>
      </div>
    </div>
  );
}
