import { useState, useEffect } from 'react';
import { sanitizeHex } from '@/lib/utils';

/** Single visible selector that also displays the value. */
export default function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [hex, setHex] = useState(sanitizeHex(value));

  useEffect(() => setHex(sanitizeHex(value)), [value]);

  function set(v: string) {
    const clean = sanitizeHex(v);
    setHex(clean);
    onChange(clean);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, opacity: 0.8 }}>{label}</label>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="color"
          aria-label={label}
          value={hex}
          onChange={(e) => set(e.target.value)}
          style={{
            width: 40,
            height: 32,
            borderRadius: 8,
            border: '1px solid var(--border)',
            background: 'transparent',
            padding: 0,
          }}
        />
        <code style={{ fontSize: 12, opacity: 0.8 }}>{hex.toUpperCase()}</code>
      </div>
    </div>
  );
}
