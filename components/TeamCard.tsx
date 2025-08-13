
import { useState } from 'react';
import Modal from '@/components/Modal';
import ColorPicker from '@/components/ColorPicker';

export type Team = {
  id: string;
  name: string;
  owner?: string;
  mascot: string;
  primary: string;
  secondary: string;
  seed: number;
  logoUrl?: string|null;
};

export default function TeamCard({team,onUpdate,onGenerate}:{team:Team; onUpdate:(p:Partial<Team>)=>void; onGenerate:()=>Promise<void>}){
  const [open,setOpen]=useState(false);
  const [busy,setBusy]=useState(false);
  async function gen(){ try{ setBusy(true); await onGenerate(); } finally{ setBusy(false); } }

  return <div className="card">
    <div className="cardHead">
      <div style={{minWidth:0}}>
        <div style={{fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{team.name}</div>
        <div style={{fontSize:12, opacity:.7}}>Owner: {team.owner || 'Unknown'}</div>
      </div>
      <button className="input" onClick={()=> onUpdate({ seed: Math.floor(Math.random()*1_000_000_000) })}>New Seed</button>
    </div>
    <div className="cardBody">
      <div className="preview" onClick={()=> team.logoUrl && setOpen(true)}>
        {team.logoUrl ? <img src={team.logoUrl} alt={`${team.name} logo`}/> : <div className="help">No logo yet. Generate one!</div>}
      </div>
      <div className="controls">
        <label style={{fontSize:12,opacity:.8}}>Mascot</label>
        <input className="input" value={team.mascot} onChange={e=>onUpdate({mascot:e.target.value})}/>
        <ColorPicker label="Primary" value={team.primary} onChange={(v)=> onUpdate({primary:v})}/>
        <ColorPicker label="Secondary" value={team.secondary} onChange={(v)=> onUpdate({secondary:v})}/>
        <div className="row">
          <label style={{fontSize:12,opacity:.8, minWidth:40}}>Seed</label>
          <input className="input" type="number" value={team.seed} onChange={e=>onUpdate({seed: parseInt(e.target.value||'0',10)})} style={{maxWidth:160}}/>
        </div>
        <div className="row" style={{marginTop:6, flexWrap:'wrap', gap:8}}>
          <button className="primary" onClick={gen} disabled={busy}>{busy?'Generating…':'Generate Logo (Free)'}</button>
        </div>
      </div>
    </div>
    <Modal open={open} onClose={()=>setOpen(false)} title={team.name}>
      {team.logoUrl && <img src={team.logoUrl} alt="full" style={{maxWidth:'100%'}}/>}
    </Modal>
  </div>;
}
