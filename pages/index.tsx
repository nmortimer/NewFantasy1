'use client';
import { useState } from 'react';
import TeamCard, { Team } from '../components/TeamCard';

type Provider = 'sleeper' | 'mfl' | 'espn';

/** Known mascot words (plural/singular) to preserve if already in the name */
const KNOWN_MASCOTS = [
  'Foxes','Fox','Wolves','Wolf','Tigers','Tiger','Bears','Bear','Hawks','Hawk','Eagles','Eagle',
  'Falcons','Falcon','Sharks','Shark','Dragons','Dragon','Knights','Knight','Buccaneers','Buccaneer',
  'Runners','Runner','Raiders','Raider','Warriors','Warrior','Raptors','Raptor','Vikings','Viking',
  'Titans','Titan','Gators','Gator','Bulls','Bull','Spartans','Spartan','Panthers','Panther','Pirates','Pirate',
];

/** Derive mascot from team name; keep if already present; otherwise hash owner/name. */
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

/** NFL-style palette (primary/secondary). */
const NFL_PALETTE: Array<{primary: string; secondary: string}> = [
  { primary: '#002244', secondary: '#A5ACAF' },
  { primary: '#203731', secondary: '#FFB612' },
  { primary: '#008E97', secondary: '#F36F21' },
  { primary: '#101820', secondary: '#D3BC8D' },
  { primary: '#003594', secondary: '#C8102E' },
  { primary: '#4F2683', secondary: '#FFC62F' },
  { primary: '#AA0000', secondary: '#B3995D' },
  { primary: '#006778', secondary: '#101820' },
  { primary: '#0B2265', secondary: '#FF3C00' },
  { primary: '#97233F', secondary: '#000000' },
  { primary: '#0076B6', secondary: '#B0B7BC' },
  { primary: '#0B162A', secondary: '#C83803' },
  { primary: '#D50A0A', secondary: '#5A615E' },
  { primary: '#0038A8', secondary: '#FFD100' },
  { primary: '#2A0845', secondary: '#111111' },
  { primary: '#0B4F3D', secondary: '#E1C699' },
  { primary: '#002244', secondary: '#69BE28' },
  { primary: '#A71930', secondary: '#0B2265' },
  { primary: '#1C1C1C', secondary: '#FFB612' },
  { primary: '#1D428A', secondary: '#A2AAAD' },
];

/** Deterministic shuffle per league */
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

      // Color rotation seeded by leagueId
      const seed = Number(String(leagueId).replace(/\D/g, '')) || Date.now();
      const palette = shuffleDeterministic(NFL_PALETTE, seed);

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

  function patch(id: string, patch: Partial<Team>) {
    setTeams((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
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

  return (
    <>
      {/* Sticky toolbar */}
      <div className="toolbar">
        <div className="toolbar-inner">
          <div className="brand">Fantasy Logo Studio</div>
          <div className="flex">
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
                <input className="input" placeholder="SWID (private leagues only)" value={swid} onChange={(e) => setSwid(e.target.value)} />
                <input className="input" placeholder="ESPN_S2 (private leagues only)" value={s2} onChange={(e) => setS2(e.target.value)} />
              </>
            )}
            <button className="btn primary" onClick={loadLeague} disabled={loading}>
              {loading ? 'Loading…' : 'Load League'}
            </button>
          </div>

          <div className="flex" style={{ marginLeft: 'auto' }}>
            <span className="helper">Mode:</span>
            <button className={`btn ${mode === 'commissioner' ? 'primary' : ''}`} onClick={() => setMode('commissioner')}>
              Commissioner
            </button>
            <button className={`btn ${mode === 'manager' ? 'primary' : ''}`} onClick={() => setMode('manager')}>
              Manager
            </button>
            {teams.length > 0 && (
              <button className="btn" onClick={generateAll} title="Generate logos for all teams">Generate All</button>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {teams.length === 0 ? (
          <div className="empty">
            Load your league, then click <b>Generate</b> on a team, or <b>Generate All</b>.  
            Logos are free (no keys). Click a logo to view full size.
          </div>
        ) : (
          <div className="grid">
            {teams.map((t) => (
              <TeamCard
                key={t.id}
                team={t}
                onUpdate={(p) => patch(t.id, p)}
                onGenerate={() => generate(t)}
                roomy={mode === 'manager'}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
