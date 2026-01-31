import { useEffect, useState, useRef } from 'react'
import Login from './Login'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_URL = 'https://medina-api.onrender.com'; // <--- URL RENDER

const styles = `
  .app-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
  .sidebar { width: 250px; flex-shrink: 0; overflow-y: auto; background: #1e1f21; color: white; z-index: 100; transition: transform 0.3s ease; }
  .logo-container { background: white; padding: 15px; text-align: center; border-bottom: 4px solid #b8860b; }
  .logo-img { max-width: 100%; height: auto; display: block; margin: 0 auto; }
  .mobile-header { display: none; }
  .menu-overlay { display: none; }
  .main-content { flex: 1; overflow: hidden; background: white; position: relative; }
  .kanban-board { display: flex; gap: 15px; overflow-x: auto; height: 100%; align-items: flex-start; padding-bottom: 10px; }
  .kanban-col { min-width: 300px; width: 300px; background: #f7f8f9; border-radius: 10px; padding: 15px; border: 1px solid #e0e0e0; flex-shrink: 0; }
  .stat-card { background: white; padding: 20px; border-radius: 10px; flex: 1; text-align: center; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-color: #b0b0b0; }
  .comment-bubble { padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #eee; }
  .comment-img { max-width: 100%; max-height: 200px; border-radius: 6px; margin-top: 5px; display: block; border: 1px solid #ddd; cursor: pointer; }

  /* NOUVEAUX STYLES DASHBOARD V18 */
  .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; padding: 0 20px 20px; }
  .dash-widget { background: white; border-radius: 12px; border: 1px solid #eee; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .widget-title { font-size: 16px; font-weight: bold; color: #444; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
  
  .critical-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #f9f9f9; }
  .critical-tag { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  
  .team-item { display: flex; align-items: center; margin-bottom: 12px; }
  .team-name { width: 100px; font-size: 13px; font-weight: 500; }
  .team-bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin: 0 10px; }
  .team-bar-fill { height: 100%; background: #3b82f6; }
  .team-count { font-size: 11px; color: #888; width: 30px; text-align: right; }

  /* GRAPHIQUE CIRCULAIRE (DONUT CSS) */
  .donut-chart { width: 120px; height: 120px; borderRadius: 50%; position: relative; margin: 0 auto; }
  .donut-center { position: absolute; inset: 20px; background: white; borderRadius: 50%; display: flex; alignItems: center; justifyContent: center; flexDirection: column; }

  @media (max-width: 1000px) { .dash-grid { grid-template-columns: 1fr; } }
  @media (max-width: 768px) {
    .app-container { flex-direction: column; }
    .mobile-header { display: flex !important; position: fixed; top: 0; left: 0; right: 0; height: 70px; z-index: 900; box-shadow: 0 2px 5px rgba(0,0,0,0.1); background: white; color: #333; align-items: center; justify-content: space-between; padding: 0 15px; border-bottom: 3px solid #b8860b; }
    .mobile-header .logo-img { max-height: 50px; }
    .sidebar { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); box-shadow: 5px 0 15px rgba(0,0,0,0.3); }
    .sidebar.open { transform: translateX(0); }
    .menu-overlay { display: block; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 90; }
    .main-content { margin-top: 70px; width: 100% !important; }
    .kanban-col { min-width: 85vw; width: 85vw; }
    .dash-stats { flex-direction: column; }
    .task-modal { width: 100% !important; height: 100% !important; border-radius: 0 !important; }
    .task-modal-body { flex-direction: column; }
    .task-modal-left { border-right: none !important; border-bottom: 1px solid #eee; height: 50%; }
  }
`;

function GanttView({ tasks, onEditTask }) {
    const scrollRef = useRef(null);
    const getRange = () => { const now = new Date(); const s = new Date(now); s.setDate(now.getDate()-5); const e = new Date(now); e.setDate(now.getDate()+15); return {start:s, end:e}; };
    const {start, end} = getRange(); const days=[]; for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)) days.push(new Date(d));
    useEffect(() => { if(scrollRef.current) scrollRef.current.scrollLeft=0; }, []);
    const getStyle = (t) => {
        let s = new Date(t.start_date||Date.now()); let e = new Date(t.due_date||s);
        if(e<s) e=new Date(s); if(s<start) s=new Date(start);
        const diff = Math.max(0, Math.ceil((s-start)/(86400000))); const dur = Math.max(1, Math.ceil((e-s)/(86400000))+1);
        return { left: `${diff*40}px`, width: `${dur*40}px`, background: t.status==='done'?'#10b981':t.priority==='high'?'#ef4444':'#3b82f6', opacity:1 };
    };
    return (
        <div style={{overflowX:'auto', background:'white', border:'1px solid #e0e0e0', borderRadius:'8px', height:'100%', display:'flex', flexDirection:'column'}} ref={scrollRef}>
            <div style={{display:'flex', borderBottom:'1px solid #eee', position:'sticky', top:0, background:'#f9f9f9', zIndex:10, minWidth:'fit-content'}}>
                <div style={{minWidth:'150px', padding:'10px', borderRight:'1px solid #eee', position:'sticky', left:0, background:'#f9f9f9', zIndex:20, fontWeight:'bold', fontSize:'12px'}}>Tâche</div>
                {days.map((d,i)=><div key={i} style={{minWidth:'40px', padding:'10px 0', textAlign:'center', borderRight:'1px solid #eee', fontSize:'10px', color:'#666', background:d.toDateString()===new Date().toDateString()?'#e0f2fe':'transparent'}}><div style={{fontWeight:'bold'}}>{d.getDate()}</div><div>{d.toLocaleDateString('fr',{month:'short'})}</div></div>)}
            </div>
            <div style={{flex:1, overflowY:'auto', minWidth:'fit-content'}}>{tasks.map(t=>(<div key={t.id} style={{display:'flex', borderBottom:'1px solid #f9f9f9', height:'40px', alignItems:'center', position:'relative'}}><div style={{minWidth:'150px', padding:'0 10px', borderRight:'1px solid #eee', position:'sticky', left:0, background:'white', zIndex:10, fontSize:'12px', fontWeight:'500', height:'100%', display:'flex', alignItems:'center', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}}>{t.title}</div><div style={{position:'relative', flex:1, height:'100%'}}><div style={{position:'absolute', inset:0, display:'flex'}}>{days.map((_,i)=><div key={i} style={{minWidth:'40px', borderRight:'1px solid #f9f9f9', height:'100%'}}></div>)}</div><div onClick={()=>onEditTask(t)} style={{...getStyle(t), position:'absolute', top:'8px', height:'24px', borderRadius:'4px', color:'white', fontSize:'10px', padding:'0 5px', overflow:'hidden', cursor:'pointer', whiteSpace:'nowrap'}}>{t.title}</div></div></div>))}</div>
        </div>
    );
}

function TaskModal({ task, allUsers, currentUser, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSub, setNewSub] = useState(""); const [newCom, setNewCom] = useState(""); const [comFile, setComFile] = useState(null); const [isUploading, setIsUploading] = useState(false);
  useEffect(() => { fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(r=>r.json()).then(setSubtasks); fetch(`${API_URL}/tasks/${task.id}/comments`).then(r=>r.json()).then(setComments); }, [task]);
  const save = () => { onUpdate(formData); onClose(); };
  const addS = async (e) => { e.preventDefault(); if(!newSub) return; const res=await fetch(`${API_URL}/subtasks`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id:task.id, title:newSub})}); setSubtasks([...subtasks, await res.json()]); setNewSub(""); };
  const upS = async (u) => { setSubtasks(subtasks.map(s=>s.id===u.id?u:s)); await fetch(`${API_URL}/subtasks/${u.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)}); };
  const delS = async (id) => { setSubtasks(subtasks.filter(s=>s.id!==id)); await fetch(`${API_URL}/subtasks/${id}`, {method:'DELETE'}); };
  const upF = async (e) => { const f=e.target.files[0]; if(!f) return; const d=new FormData(); d.append('file',f); const res=await fetch(`${API_URL}/upload`, {method:'POST', body:d}); const j=await res.json(); setFormData({...formData, attachment_url:j.url}); };
  const sendC = async (e) => { e.preventDefault(); if(!newCom && !comFile) return; setIsUploading(true); let aUrl = null; if (comFile) { const d = new FormData(); d.append('file', comFile); try { const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: d }); const j = await res.json(); aUrl = j.url; } catch(err) { alert("Erreur upload"); } } const res = await fetch(`${API_URL}/comments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ task_id: task.id, user_id: currentUser.id, content: newCom, attachment_url: aUrl }) }); setComments([await res.json(), ...comments]); setNewCom(""); setComFile(null); setIsUploading(false); };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(2px)'}}>
      <div className="task-modal" style={{background:'white', width:'900px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
        <div style={{padding:'15px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'18px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <div style={{display:'flex', gap:'10px'}}>{currentUser.role==='admin' && <button onClick={()=>{if(confirm("Corbeille ?")) onDelete(task.id)}} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px', borderRadius:'4px'}}>🗑️</button>}<button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px'}}>✕</button></div>
        </div>
        <div className="task-modal-body" style={{display:'flex', flex:1, overflow:'hidden'}}>
            <div className="task-modal-left" style={{flex:2, padding:'20px', overflowY:'auto', borderRight:'1px solid #e2e8f0', background:'#fff'}}>
                <textarea
