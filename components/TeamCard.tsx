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
  roomy?: boolean; // optional: when true, even bigger preview
};

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
    <div className="card">
      <div className="cardHeader" style={{ padding: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0 }}>
          <div className="cardTitle" style={{ fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {team.name}
          </div>
          <div className="cardSub" style={{ fontSize: 12, opacity: 0.7 }}>
            Owner: {team.owner || 'Unknown'}
          </div>
        </div>
        <button className="input" onClick={() => onUpdate({ seed: Math.floor(Math.random() * 1_000_000_000) })}>
          New Seed
        </button>
      </div>

      <div className="cardBody" style={{ display: 'grid', gridTemplateColumns: roomy ? '1.6fr 1fr' : '1.2fr 1fr', gap: 12, padding: 12 }}>
        {/* Large preview */}
        <div
          className="previewWrap"
          onClick={() => team.logoUrl && setOpen(true)}
          title={team.logoUrl ? 'Open full-size' : 'Click Generate'}
          style={{
            background: 'var(--card)',
            border: '1px dashed #2a3948',
            borderRadius: 12,
            minHeight: roomy ? 320 : 240,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={`${team.name} logo`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }} />
          ) : (
            <div className="help" style={{ opacity: 0.7 }}>No logo yet. Generate one!</div>
          )}
        </div>

        {/* Controls */}
        <div className="controls" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={{ fontSize: 12, opacity: 0.8 }}>Mascot (auto from team name; editable)</label>
            <input className="input" type="text" value={team.mascot} onChange={(e) => onUpdate({ mascot: e.target.value })} />
          </div>

          <ColorPicker label="Primary" value={team.primary} onChange={(hex) => onUpdate({ primary: hex })} />
          <ColorPicker label="Secondary" value={team.secondary} onChange={(hex) => onUpdate({ secondary: hex })} />

          <div className="row" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ fontSize: 12, opacity: 0.8, minWidth: 40 }}>Seed</label>
            <input
              className="input"
              type="number"
              value={team.seed}
              onChange={(e) => onUpdate({ seed: parseInt(e.target.value || '0', 10) })}
              style={{ maxWidth: 160 }}
            />
          </div>

          <div className="actions" style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <button className="primary" onClick={doGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate Logo (Free)'}
            </button>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={team.name}>
        {team.logoUrl && <img src={team.logoUrl} alt={`${team.name} logo full`} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />}
      </Modal>
    </div>
  );
}
