
import { useState, useEffect } from 'react';
export default function ColorPicker({label,value,onChange}:{label:string; value:string; onChange:(v:string)=>void}){
  const [v,setV]=useState(value);
  useEffect(()=>setV(value),[value]);
  const clean=(x:string)=> (x.startsWith('#')?x:'#'+x.replace(/[^0-9a-f]/gi,'').slice(0,6).padEnd(6,'0'));
  function set(x:string){ const c=clean(x); setV(c); onChange(c); }
  return <div>
    <label style={{fontSize:12,opacity:.8}}>{label}</label>
    <div className="row">
      <div className="swatch" style={{background:v}}/>
      <input type="color" value={v} onChange={e=>set(e.target.value)} style={{width:44,height:32,borderRadius:8,border:'1px solid #22303d',background:'transparent'}}/>
      <input className="input" value={v} onChange={e=>set(e.target.value)} placeholder="#00B2CA"/>
    </div>
  </div>;
}
