'use client';
import { useState } from 'react';
import TeamCard, { Team } from '../components/TeamCard';

type Provider = 'sleeper' | 'mfl' | 'espn';

/** Suggest a mascot from a team name (editable later). */
function deriveMascot(teamName: string): string {
  const animals = [
    'Foxes','Wolves','Tigers','Bears','Hawks','Eagles','Falcons','Sharks','Dragons','Knights',
    'Buccaneers','Runners','Raiders','Warriors','Raptors','Vikings','Titans','Gators','Bulls','Spartans'
  ];
  const tokens = teamName.replace(/[^a-zA-Z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  const last = (tokens[tokens.length - 1] || '').toLowerCase();
  const already = animals.find(a => a.toLowerCase() === last || a.toLowerCase().slice(0, -1) === last);
  if (already) return already;
  const candidate = [...tokens].reverse().find(t => t.length > 3) || tokens[0] || 'Knights';
  let h = 2166136261;
  for (let i = 0; i < candidate.length; i++) { h ^= candidate.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24); }
  return animals[(h >>> 0) % animals.length];
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
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

      const mapped: Team[] = data.teams.map((t: any, i: number) => {
        const name = t.name || `Team ${i + 1}`;
        return {
          id: String(t.id ?? i),
          name,
          owner: t.owner || 'Unknown',
          mascot: deriveMascot(name), // smarter default
          primary: '#00B2CA',
          secondary: '#1A1A1A',
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
      try {
        await generate(t);
      } catch {
        // keep going on failures
      }
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
          gridTemplateColumns: mode === 'manager' ? 'repeat(auto-fill, minmax(360px, 1fr))' : 'repeat(auto-fill, minmax(300px, 1fr))',
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
