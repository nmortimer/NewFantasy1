'use client';
import { useMemo, useState } from 'react';
import TeamCard, { Team } from '../components/TeamCard';

type Provider = 'sleeper' | 'mfl' | 'espn';

/** Known mascot words (plural/singular) */
const KNOWN_MASCOTS = [
  'Foxes','Fox','Wolves','Wolf','Tigers','Tiger','Bears','Bear','Hawks','Hawk','Eagles','Eagle',
  'Falcons','Falcon','Sharks','Shark','Dragons','Dragon','Knights','Knight','Buccaneers','Buccaneer',
  'Runners','Runner','Raiders','Raider','Warriors','Warrior','Raptors','Raptor','Vikings','Viking',
  'Titans','Titan','Gators','Gator','Bulls','Bull','Spartans','Spartan','Panthers','Panther','Pirates','Pirate',
];

function deriveMascot(teamName: string, ownerName?: string): string {
  const tokens = teamName.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const lower = tokens.map((t) => t.toLowerCase());
  for (const m of KNOWN_MASCOTS) {
    const mLow = m.toLowerCase();
    if (lower.includes(mLow)) {
      const plural = KNOWN_MASCOTS.find((x) => x !== m && x.toLowerCase() === (mLow.endsWith('s') ? mLow : mLow + 's'));
      return plural || m;
    }
  }
  const pool = ['Foxes','Wolves','Tigers','Bears','Hawks','Eagles','Falcons','Sharks','Dragons','Knights','Raiders','Warriors','Raptors','Vikings','Titans','Gators','Bulls','Spartans','Panthers','Pirates'];
  const basis = (ownerName || teamName || 'Team').toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < basis.length; i++) { h ^= basis.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
  return pool[(h >>> 0) % pool.length];
}
function randomSeed(): number { return Math.floor(Math.random() * 1_000_000_000); }

/** NFL-style color pairs */
const NFL_PALETTE: Array<{primary: string; secondary: string; label: string}> = [
  { label:'Navy / Silver',           primary: '#002244', secondary: '#A5ACAF' },
  { label:'Green / Gold',            primary: '#203731', secondary: '#FFB612' },
  { label:'Aqua / Orange',           primary: '#008E97', secondary: '#F36F21' },
  { label:'Black / Gold',            primary: '#101820', secondary: '#D3BC8D' },
  { label:'Royal / Red',             primary: '#003594', secondary: '#C8102E' },
  { label:'Purple / Gold',           primary: '#4F2683', secondary: '#FFC62F' },
  { label:'Red / Gold',              primary: '#AA0000', secondary: '#B3995D' },
  { label:'Teal / Black',            primary: '#006778', secondary: '#101820' },
  { label:'Blue / Orange',           primary: '#0B2265', secondary: '#FF3C00' },
  { label:'Cardinal / Black',        primary: '#97233F', secondary: '#000000' },
  { label:'Honolulu / Silver',       primary: '#0076B6', secondary: '#B0B7BC' },
  { label:'Navy / Orange',           primary: '#0B162A', secondary: '#C83803' },
  { label:'Scarlet / Gray',          primary: '#D50A0A', secondary: '#5A615E' },
  { label:'Blue / Yellow',           primary: '#0038A8', secondary: '#FFD100' },
  { label:'Purple / Black',          primary: '#2A0845', secondary: '#111111' },
  { label:'Forest / Cream',          primary: '#0B4F3D', secondary: '#E1C699' },
  { label:'Navy / Lime',             primary: '#002244', secondary: '#69BE28' },
  { label:'Red / Navy',              primary: '#A71930', secondary: '#0B2265' },
  { label:'Steel / Yellow',          primary: '#1C1C1C', secondary: '#FFB612' },
  { label:'Royal / Silver',          primary: '#1D428A', secondary: '#A2AAAD' },
];

function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const out = arr.slice(); let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function Home() {
  const [provider, setProvider] = useState<Provider>('sleeper');
  const [leagueId, setLeagueId] = useState('');
  const [season, setSeason] = useState('2025');
  const [swid, setSwid] = useState('');
  const [s2, setS2] = useState('');
  const [mode, setMode] = useState<'commissioner' | 'manager'>('commissioner');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const hasTeams = teams.length > 0;

  const remixSeed = useMemo(
    () => Number(String(leagueId).replace(/\D/g, '')) || 2025,
    [leagueId]
  );

  function applyLeaguePalette(remixBump = 0) {
    const palette = shuffleDeterministic(NFL_PALETTE, remixSeed + remixBump);
    setTeams((prev) =>
      prev.map((t, i) => ({
        ...t,
        primary: palette[i % palette.length].primary,
        secondary: palette[i % palette.length].secondary,
      }))
    );
  }

  async function loadLeague() {
    if (!leagueId) return;
    try {
      setLoading(true);
      const qs = new URLSearchParams({
        provider,
        leagueId,
        ...(provider !== 'sleeper' ? { season } : {}),
        ...(provider === 'espn' ? { swid, s2 } : {}),
      });
      const res = await fetch(`/api/league?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed league load');

      const palette = shuffleDeterministic(NFL_PALETTE, remixSeed);
      const mapped: Team[] = (data.teams as any[]).map((t, i) => {
        const name = (t.name || `Team ${i + 1}`).trim();
        const owner = (t.owner || 'Unknown').trim();
        const colors = palette[i % palette.length];
        return {
          id: String(t.id ?? i),
          name,
          owner,
          mascot: deriveMascot(name, owner),
          primary: colors.primary,
          secondary: colors.secondary,
          seed: randomSeed(),
          logoUrl: null,
        };
      });
      setTeams(mapped);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  function patch(id: string, patchObj: Partial<Team>) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patchObj } : t)));
  }

  async function generate(team: Team) {
    const res = await fetch('/api/generate-logo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'gen failed');
    patch(team.id, { logoUrl: data.url });
  }

  async function generateAll() {
    for (const t of teams) { try { await generate(t); } catch {} }
  }

  // Track a simple count to create new remixes
  const [remixCount, setRemixCount] = useState(0);
  function remixLeagueColors() {
    const bump = remixCount + 1;
    setRemixCount(bump);
    applyLeaguePalette(bump);
  }

  return (
    <>
      {/* Sticky Toolbar */}
      <div className="toolbar">
        <div className="toolbar-inner">
          <div className="brand">
            <div className="logo" />
            <div>
              <div className="title">Fantasy Logo Studio</div>
              <div className="subtitle">AI-powered league logos (free)</div>
            </div>
          </div>

          <div className="controls">
            <select className="select" value={provider} onChange={(e) => setProvider(e.target.value as Provider)}>
              <option value="sleeper">Sleeper</option>
              <option value="mfl">MFL</option>
              <option value="espn">ESPN</option>
            </select>
            <input className="input" placeholder="League ID" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} />
            {provider !== 'sleeper' && (
              <input className="input" placeholder="Season (e.g., 2025)" value={season} onChange={(e) => setSeason(e.target.value)} />
            )}
            {provider === 'espn' && (
              <>
                <input className="input" placeholder="SWID (private)" value={swid} onChange={(e) => setSwid(e.target.value)} />
                <input className="input" placeholder="ESPN_S2 (private)" value={s2} onChange={(e) => setS2(e.target.value)} />
              </>
            )}
            <button className="btn primary" onClick={loadLeague} disabled={loading}>
              {loading ? 'Loading…' : 'Load League'}
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="container">
        <div className="page">
          {/* Sidebar: league actions & palette */}
          <aside className="sidebar">
            <div className="section">
              <h4>League</h4>
              <div className="row">
                <span className="helper">Mode:</span>
                <button className={`btn small ${mode === 'commissioner' ? 'primary' : ''}`} onClick={() => setMode('commissioner')}>Commissioner</button>
                <button className={`btn small ${mode === 'manager' ? 'primary' : ''}`} onClick={() => setMode('manager')}>Manager</button>
              </div>
              <div className="row">
                <button className="btn small" onClick={generateAll} disabled={!hasTeams}>Generate All</button>
                <button className="btn small" onClick={() => setTeams([])} disabled={!hasTeams}>Clear</button>
              </div>
            </div>

            <div className="divider" />

            <div className="section">
              <h4>Colors</h4>
              <div className="row">
                <button className="btn small" onClick={() => applyLeaguePalette(0)} disabled={!hasTeams}>Apply NFL Palette</button>
                <button className="btn small" onClick={remixLeagueColors} disabled={!hasTeams}>Remix Palette</button>
              </div>
              <div className="helper">Sets distinct, NFL-style colors across all teams. Users can still edit per team.</div>
            </div>

            <div className="divider" />

            <div className="section">
              <h4>Status</h4>
              <div className="helper">
                Teams: <b>{teams.length || 0}</b>
              </div>
            </div>
          </aside>

          {/* Grid */}
          <main>
            {teams.length === 0 ? (
              <div className="empty">
                Load your league above, then use <b>Generate</b> on any team or <b>Generate All</b>.
                Logos are generated free (no keys). Click a logo to view or download.
              </div>
            ) : (
              <div className="grid">
                {teams.map((t) => (
                  <TeamCard
                    key={t.id}
                    team={t}
                    onUpdate={(p) => setTeams((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...p } : x)))}
                    onGenerate={() => generate(t)}
                    roomy={mode === 'manager'}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
