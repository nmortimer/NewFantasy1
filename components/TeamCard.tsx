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

export default function TeamCard({
  team,
  onUpdate,
  onGenerate,
  roomy = true,
}: {
  team: Team;
  onUpdate: (patch: Partial<Team>) => void;
  onGenerate: () => Promise<void>;
  roomy?: boolean;
}) {
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
      {/* Head */}
      <div className="card-head">
        <div style={{ minWidth: 0 }}>
          <div className="card-title">{team.name}</div>
          <div className="card-sub">Owner: {team.owner || 'Unknown'}</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => onUpdate({ seed: Math.floor(Math.random() * 1_000_000_000) })}>
            New Seed
          </button>
          <button className="btn primary" onClick={doGenerate} disabled={busy}>
            {busy ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        className="card-body"
        style={{ gridTemplateColumns: roomy ? '1.6fr 1fr' : '1.3fr 1fr' }}
      >
        {/* Preview */}
        <div
          className="preview"
          onClick={() => team.logoUrl && setOpen(true)}
          title={team.logoUrl ? 'Open full-size' : 'Click Generate'}
          style={{ minHeight: roomy ? 320 : 280, cursor: team.logoUrl ? 'zoom-in' : 'default' }}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={`${team.name} logo`} />
          ) : (
            <div className="helper">No logo yet. Click Generate.</div>
          )}
        </div>

        {/* Controls */}
        <div className="controls">
          <div>
            <label className="small">Mascot (auto from team name; editable)</label>
            <input
              className="input"
              value={team.mascot}
              onChange={(e) => onUpdate({ mascot: e.target.value })}
              placeholder="e.g., Wolves, Knights, Sharks"
            />
          </div>

          <ColorPicker label="Primary" value={team.primary} onChange={(hex) => onUpdate({ primary: hex })} />
          <ColorPicker label="Secondary" value={team.secondary} onChange={(hex) => onUpdate({ secondary: hex })} />

          <div className="row">
            <label className="small" style={{ minWidth: 40 }}>Seed</label>
            <input
              className="input"
              type="number"
              value={team.seed}
              onChange={(e) => onUpdate({ seed: parseInt(e.target.value || '0', 10) })}
              style={{ maxWidth: 160 }}
            />
          </div>

          <div className="row" style={{ justifyContent: 'flex-end', marginTop: 4 }}>
            <button className="btn" onClick={() => team.logoUrl && setOpen(true)} disabled={!team.logoUrl}>
              Open
            </button>
            <button className="btn primary" onClick={doGenerate} disabled={busy}>
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={team.name}>
        {team.logoUrl && <img src={team.logoUrl} alt={`${team.name} full`} style={{ maxWidth: '100%' }} />}
      </Modal>
    </div>
  );
}
