import { useState } from 'react';
import Modal from './Modal';
import ColorPicker from './ColorPicker';

export type Team = {
  id: string;
  name: string;
  owner?: string;
  mascot: string;
  primary: string;
  secondary: string;
  seed: number;
  logoUrl?: string | null;
};

type Props = {
  team: Team;
  onUpdate: (patch: Partial<Team>) => void;
  onGenerate: () => Promise<void>;
  roomy?: boolean; // when true, larger preview area
};

/** Modern, contained card UI with a large preview and simple controls. */
export default function TeamCard({ team, onUpdate, onGenerate, roomy = true }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doGenerate() {
    try {
      setBusy(true);
      await onGenerate();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: '#0f141a',
        border: '1px solid #22303d',
        borderRadius: 14,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid #22303d',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          alignItems: 'center',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {team.name}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Owner: {team.owner || 'Unknown'}</div>
        </div>
        <button
          style={{
            border: '1px solid #22303d',
            background: '#151b22',
            color: '#e9eef5',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
          }}
          onClick={() => onUpdate({ seed: Math.floor(Math.random() * 1_000_000_000) })}
        >
          New Seed
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: roomy ? '1.6fr 1fr' : '1.2fr 1fr',
          gap: 12,
          padding: 12,
        }}
      >
        {/* Large preview */}
        <div
          onClick={() => team.logoUrl && setOpen(true)}
          title={team.logoUrl ? 'Open full-size' : 'Click Generate'}
          style={{
            background: '#121821',
            border: '1px dashed #314252',
            borderRadius: 12,
            minHeight: roomy ? 320 : 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
            cursor: team.logoUrl ? 'zoom-in' : 'default',
          }}
        >
          {team.logoUrl ? (
            <img
              src={team.logoUrl}
              alt={`${team.name} logo`}
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
            />
          ) : (
            <div style={{ color: '#9fb0c3', fontSize: 14 }}>No logo yet. Generate one!</div>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Mascot (auto from team name; editable)</label>
            <input
              type="text"
              value={team.mascot}
              onChange={(e) => onUpdate({ mascot: e.target.value })}
              style={{
                width: '100%',
                border: '1px solid #22303d',
                background: '#151b22',
                color: '#e9eef5',
                borderRadius: 10,
                padding: '10px 12px',
                outline: 'none',
              }}
            />
          </div>

          <ColorPicker label="Primary" value={team.primary} onChange={(hex) => onUpdate({ primary: hex })} />
          <ColorPicker label="Secondary" value={team.secondary} onChange={(hex) => onUpdate({ secondary: hex })} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, opacity: 0.8, minWidth: 40 }}>Seed</label>
            <input
              type="number"
              value={team.seed}
              onChange={(e) => onUpdate({ seed: parseInt(e.target.value || '0', 10) })}
              style={{
                maxWidth: 160,
                border: '1px solid #22303d',
                background: '#151b22',
                color: '#e9eef5',
                borderRadius: 10,
                padding: '10px 12px',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <button
              onClick={doGenerate}
              disabled={busy}
              style={{
                border: '1px solid #1e7e59',
                background: '#2fb47d',
                color: '#0b1210',
                borderRadius: 10,
                padding: '10px 12px',
                cursor: 'pointer',
                fontWeight: 700,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Generating…' : 'Generate Logo (Free)'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={team.name}>
        {team.logoUrl && <img src={team.logoUrl} alt={`${team.name} logo full`} style={{ maxWidth: '100%' }} />}
      </Modal>
    </div>
  );
}
