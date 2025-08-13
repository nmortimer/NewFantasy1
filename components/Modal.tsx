
import { ReactNode, useEffect } from 'react';
export default function Modal({ open, onClose, title, children }:{open:boolean; onClose:()=>void; title?:string; children:ReactNode}){
  useEffect(()=>{ const onKey=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose(); }; if(open) window.addEventListener('keydown', onKey); return()=>window.removeEventListener('keydown', onKey); },[open,onClose]);
  if(!open) return null;
  return <div className="modalBack" onClick={onClose}>
    <div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modalHead"><strong>{title}</strong><button className="input" onClick={onClose}>Close</button></div>
      <div className="modalBody">{children}</div>
    </div>
  </div>;
}
