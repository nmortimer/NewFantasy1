
'use client';
import { useState } from 'react';
import TeamCard, { Team } from '@/components/TeamCard';

type Provider = 'sleeper' | 'mfl' | 'espn';

export default function Home(){
  const [provider, setProvider] = useState<Provider>('sleeper');
  const [leagueId, setLeagueId] = useState('');
  const [season, setSeason] = useState('2025');
  const [swid, setSwid] = useState('');
  const [s2, setS2] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);

  async function loadLeague(){
    if(!leagueId) return;
    try{
      setLoading(true);
      const qs = new URLSearchParams({ provider, leagueId, ...(provider!=='sleeper' ? { season } : {}), ...(provider==='espn' ? { swid, s2 } : {}) });
      const res = await fetch(`/api/league?${qs.toString()}`);
      const data = await res.json();
      if(!res.ok) throw new Error(data.error || 'Failed league load');
      const mapped: Team[] = data.teams.map((t:any, i:number)=> ({
        id: String(t.id ?? i),
        name: t.name || `Team ${i+1}`,
        owner: t.owner || 'Unknown',
        mascot: 'Fox',
        primary: '#00B2CA',
        secondary: '#1A1A1A',
        seed: Math.floor(Math.random()*1_000_000_000),
        logoUrl: null
      }));
      setTeams(mapped);
    } catch(e:any){
      alert(e.message);
    } finally { setLoading(false); }
  }

  function patch(id: string, patch: Partial<Team>){
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }

  async function generate(team: Team){
    const res = await fetch('/api/generate-logo', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ team }) });
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || 'gen failed');
    patch(team.id, { logoUrl: data.url });
  }

  return <div className="container">
    <div className="header">
      <h1>Fantasy Logo Studio — Free</h1>
      <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
        <select className="input" value={provider} onChange={e=> setProvider(e.target.value as Provider)}>
          <option value="sleeper">Sleeper</option>
          <option value="mfl">MFL</option>
          <option value="espn">ESPN</option>
        </select>
        <input className="input" placeholder="League ID" value={leagueId} onChange={e=> setLeagueId(e.target.value)} />
        {provider!=='sleeper' && <input className="input" placeholder="Season (e.g., 2025)" value={season} onChange={e=> setSeason(e.target.value)} />}
        {provider==='espn' && <>
          <input className="input" placeholder="SWID (private leagues only)" value={swid} onChange={e=> setSwid(e.target.value)} />
          <input className="input" placeholder="ESPN_S2 (private leagues only)" value={s2} onChange={e=> setS2(e.target.value)} />
        </>}
        <button className="primary" onClick={loadLeague} disabled={loading}>{loading?'Loading…':'Load League'}</button>
      </div>
    </div>

    {teams.length===0 && <p className="help">Load your league, then click “Generate Logo (Free)” on each card. No API keys, free hosting on Vercel.</p>}

    <div className="grid">
      {teams.map(t => <TeamCard key={t.id} team={t} onUpdate={(p)=>patch(t.id,p)} onGenerate={()=> generate(t)} />)}
    </div>
  </div>;
}
