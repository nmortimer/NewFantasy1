import { useState } from "react";
import Modal from "./Modal";
import ColorPicker from "./ColorPicker";

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
  roomy = true
}: {
  team: Team;
  onUpdate: (patch: Partial<Team>) => void;
  onGenerate: () => Promise<void>;
  roomy?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function doGenerate() {
    try { setBusy(true); await onGenerate(); }
    finally { setBusy(false); }
  }

  function copyUrl() {
    if (team.logoUrl) navigator.clipboard?.writeText(team.logoUrl).catch(() => {});
  }

  return (
    <section className="card overflow-hidden">
      {/* header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold">{team.name}</h3>
          <p className="truncate text-xs text-muted">Owner: {team.owner || "Unknown"}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn text-xs" onClick={() => onUpdate({ seed: Math.floor(Math.random() * 1_000_000_000) })}>New Seed</button>
          <button className="btn" onClick={doGenerate} disabled={busy}>{busy ? "Generating…" : "Generate"}</button>
        </div>
      </header>

      {/* body */}
      <div className={`grid gap-4 p-4 ${roomy ? "md:grid-cols-[1.6fr_1fr]" : "md:grid-cols-[1.3fr_1fr]"}`}>
        {/* preview */}
        <div
          className={`relative grid place-items-center rounded-2xl border border-dashed border-border bg-[#111820] ${roomy ? "min-h-[340px]" : "min-h-[300px]"} cursor-${team.logoUrl ? "zoom-in" : "default"}`}
          onClick={() => team.logoUrl && setOpen(true)}
          title={team.logoUrl ? "Open full-size" : "Click Generate"}
        >
          {team.logoUrl ? (
            <img src={team.logoUrl} alt={`${team.name} logo`} className="max-h-full max-w-full object-contain" />
          ) : (
            <p className="text-muted">No logo yet. Click Generate.</p>
          )}

          {/* color pills */}
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <span className="h-4 w-4 rounded border border-white/20" style={{ background: team.primary }} />
            <span className="h-4 w-4 rounded border border-white/20" style={{ background: team.secondary }} />
            <span className="h-4 w-4 rounded border border-white/20 bg-white" />
          </div>
        </div>

        {/* controls */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Mascot (auto from team name; editable)</label>
            <input
              className="input w-full"
              value={team.mascot}
              onChange={(e) => onUpdate({ mascot: e.target.value })}
              placeholder="e.g., Wolves, Knights, Sharks"
            />
          </div>

          <ColorPicker label="Primary Color" value={team.primary} onChange={(hex) => onUpdate({ primary: hex })} />
          <ColorPicker label="Secondary Color" value={team.secondary} onChange={(hex) => onUpdate({ secondary: hex })} />

          <div className="flex items-center gap-2">
            <label className="w-12 text-xs text-muted">Seed</label>
            <input
              className="input w-40"
              type="number"
              value={team.seed}
              onChange={(e) => onUpdate({ seed: parseInt(e.target.value || "0", 10) })}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <button className="btn" onClick={() => team.logoUrl && setOpen(true)} disabled={!team.logoUrl}>Open</button>
            <a
              className={`btn ${team.logoUrl ? "" : "pointer-events-none opacity-60"}`}
              href={team.logoUrl || "#"}
              download={team.name.replace(/\s+/g, "_") + "_logo.png"}
            >
              Download
            </a>
            <button className="btn" onClick={copyUrl} disabled={!team.logoUrl}>Copy URL</button>
          </div>
        </div>
      </div>

      {/* modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={team.name}>
        {team.logoUrl && (
          <img src={team.logoUrl} alt={`${team.name} full`} className="mx-auto max-h-[75vh] w-auto max-w-full" />
        )}
      </Modal>
    </section>
  );
}
