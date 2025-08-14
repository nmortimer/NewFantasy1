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

/** Derive mascot from team name; if name contains a known mascot, keep it; otherwise use owner/name hash. */
function deriveMascot(teamName: string, ownerName?: string): string {
  const tokens = teamName.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const lower = tokens.map((t) => t.toLowerCase());
  for (const m of KNOWN_MASCOTS) {
    const mLow = m.toLowerCase();
    if (lower.includes(mLow)) {
      const plural = KNOWN_MASCOTS.find(
        (x) => x !== m && x.toLowerCase() === (mLow.endsWith('s') ? mLow : mLow + 's')
      );
      return plural || m;
    }
  }
  const pool = [
    'Foxes','Wolves','Tigers','Bears','Hawks','Eagles','Falcons','Sharks','Dragons','Knights',
    'Raiders','Warriors','Raptors','Vikings','Titans','Gators','Bulls','Spartans','Panthers','Pirates'
  ];
  const basis = (ownerName || teamName || 'Team').toLowerCase();
  let h = 2166136261;
  for (let i = 0; i < basis.length; i++) {
    h ^= basis.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return pool[(h >>> 0) % pool.length];
}
function randomSeed(): number { return Math.floor(Math.random() * 1_000_000_000); }

/** NFL‑style color pairs (primary/secondary). Not copying teams; just inspired by the league. */
const NFL_PALETTE: Array<{primary: string; secondary: string; name: string}> = [
  { name: 'Navy / Silver',        primary: '#002244', secondary: '#A5ACAF' },
  { name: 'Green / Gold',         primary: '#203731', secondary: '#FFB612' },
  { name: 'Aqua / Orange',        primary: '#008E97', secondary: '#F36F21' },
  { name: 'Black / Gold',         primary: '#101820', secondary: '#D3BC8D' },
  { name: 'Royal / Red',          primary: '#003594', secondary: '#C8102E' },
  { name: 'Purple / Gold',        primary: '#4F2683', secondary: '#FFC62F' },
  { name: 'Red / Gold',           primary: '#AA0000', secondary: '#B3995D' },
  { name: 'Teal / Black',         primary: '#006778', secondary: '#101820' },
  { name: 'Blue / Orange',        primary: '#0B2265', secondary: '#FF3C00' },
  { name: 'Cardinal / Black',     primary: '#97233F', secondary: '#000000' },
  { name: 'Honolulu Blue / Silver',primary: '#0076B6', secondary: '#B0B7BC' },
  { name: 'Navy / Orange',        primary: '#0B162A', secondary: '#C83803' },
  { name: 'Scarlet / Gray',       primary: '#D50A0A', secondary: '#5A615E' },
  { name: 'Blue / Yellow',        primary: '#0038A8', secondary: '#FFD100' },
  { name: 'Purple / Black',       primary: '#2A0845', secondary: '#111111' },
  { name: 'Forest / Cream',       primary: '#0B4F3D', secondary: '#E1C699' },
  { name: 'Navy / Kelly',         primary: '#001F3F', secondary: '#2ECC71' },
  { name: 'Red / Black',          primary: '#B11226', secondary: '#101820' },
  { name: 'Steel / Yellow',       primary: '#1C1C1C', secondary: '#FFB612' },
  { name: 'Royal / Silver',       primary: '#1D428A', secondary: '#A2AAAD' },
  { name: 'Teal / Gold',          primary: '#007F7F', secondary: '#C8A951' },
  { name: 'Navy / Lime',          primary: '#002244', secondary: '#69BE28' },
  { name: 'Red / Navy',           primary: '#A71930', secondary: '#0B2265' },
  { name: 'Midnight / Green',     primary: '#004C54', secondary: '#000000' },
];

/** Deterministic shuffle so each league gets a consistent palette rotation */
function shuffleDeterministic<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;  // LCG
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

      // Build palette once per league, seeded by numeric portion of leagueId
      const numericSeed = Number(String(leagueId).replace(/\D/g, '')) || Date.now();
      const rotated = shuffleDeterministic(NFL_PALETTE, numericSeed);

      const mapped: Team[] = (data.teams as any[]).map((t, i) => {
        const name = (t.name || `Team ${i + 1}`).trim();
        const owner = (t.owner || 'Unknown').trim();
        const pair = rotated[i % rotated.length];
        return {
          id: String(t.id ?? i),
          name,
          owner,
          mascot: deriveMascot(name, owner),
          primary: pair.primary,
          secondary: pair.secondary,
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
    for (const t of teams) {
      try { await generate(t); } catch {}
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px', color: '#e9eef5', fontFamily: 'ui-sans-serif, system-ui, Segoe UI, Inter, Roboto, Arial' }}>
      {/* Header */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Fantasy Logo Studio — Free</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            style={{ background: '#151b22', border: '1px solid #22303d', color: '#e9eef5', borderRadius: 10, padding: '10px 12px' }}
          >
            <option value="sleeper">Sleeper</option>
            <option value="mfl">MFL</option>
            <option value="espn">ESPN</option>
          </select>
          <input
            placeholder="League ID"
            value={leagueId}
            onChange={(e) => setLeagueId(e.target.value)}
            style={{ background: '#151b22', border: '1px solid #22303d', color: '#e9eef5', borderRadius: 10, padding: '10px 12px' }}
          />
          {provider !== 'sleeper' && (
            <input
              placeholder="Season (e.g., 2025)"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              style={{ background: '#151b22', border: '1px solid #22303d', color: '#e9eef5', borderRadius: 10, padding: '10px 12px' }}
            />
          )}
          {provider === 'espn' && (
            <>
              <input
                placeholder="SWID (private leagues only)"
                value={swid}
                onChange={(e) => setSwid(e.target.value)}
                style={{ background: '#151b22', border: '1px solid #22303d', color: '#e9eef5', borderRadius: 10, padding: '10px 12px' }}
              />
              <input
                placeholder="ESPN_S2 (private leagues only)"
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                style={{ background: '#151b22', border: '1px solid #22303d', color: '#e9eef5', borderRadius: 10, padding: '10px 12px' }}
              />
            </>
          )}
          <button
            onClick={loadLeague}
            disabled={loading}
            style={{
              border: '1px solid #1e7e59',
              background: '#2fb47d',
              color: '#0b1210',
              borderRadius: 10,
              padding: '10px 12px',
              cursor: 'pointer',
              fontWeight: 700,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Loading…' : 'Load League'}
          </button>
        </div>
      </div>

      {/* Mode bar */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <span style={{ opacity: 0.8 }}>Mode:</span>
        <button
          onClick={() => setMode('commissioner')}
          style={{
            border: '1px solid #22303d',
            background: mode === 'commissioner' ? '#2fb47d' : '#151b22',
            color: mode === 'commissioner' ? '#0b1210' : '#e9eef5',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            fontWeight: mode === 'commissioner' ? 700 : 400,
          }}
        >
          Commissioner (bulk)
        </button>
        <button
          onClick={() => setMode('manager')}
          style={{
            border: '1px solid #22303d',
            background: mode === 'manager' ? '#2fb47d' : '#151b22',
            color: mode === 'manager' ? '#0b1210' : '#e9eef5',
            borderRadius: 10,
            padding: '8px 10px',
            cursor: 'pointer',
            fontWeight: mode === 'manager' ? 700 : 400,
          }}
        >
          Manager (focus)
        </button>
        {teams.length > 0 && (
          <button
            onClick={generateAll}
            style={{
              border: '1px solid #22303d',
              background: '#151b22',
              color: '#e9eef5',
              borderRadius: 10,
              padding: '8px 10px',
              cursor: 'pointer',
              marginLeft: 8,
            }}
            title="Generate logos for all teams"
          >
            Generate All (Free)
          </button>
        )}
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: mode === 'manager'
            ? 'repeat(auto-fill, minmax(360px, 1fr))'
            : 'repeat(auto-fill, minmax(300px, 1fr))',
        }}
      >
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
    </div>
  );
}
