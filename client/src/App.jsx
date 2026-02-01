import { useEffect, useState, useRef } from 'react'
import Login from './Login'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const API_URL = 'https://medina-api.onrender.com'; // <--- ⚠️ REMETTEZ VOTRE CODE RENDER ICI (ex: z8kd...)

const styles = `
  .app-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
  .sidebar { width: 250px; flex-shrink: 0; overflow-y: auto; background: #1e1f21; color: white; z-index: 100; transition: transform 0.3s ease; }
  
  /* STYLES LOGO */
  .logo-container { background: white; padding: 15px; text-align: center; border-bottom: 4px solid #b8860b; }
  .logo-img { max-width: 100%; height: auto; display: block; margin: 0 auto; }

  .mobile-header { display: none; }
  .menu-overlay { display: none; }
  .main-content { flex: 1; overflow: hidden; background: white; position: relative; }
  
  /* KANBAN & LISTES */
  .kanban-board { display: flex; gap: 15px; overflow-x: auto; height: 100%; align-items: flex-start; padding-bottom: 10px; }
  .kanban-col { min-width: 300px; width: 300px; background: #f7f8f9; border-radius: 10px; padding: 15px; border: 1px solid #e0e0e0; flex-shrink: 0; }
  .stat-card { background: white; padding: 20px; border-radius: 10px; flex: 1; text-align: center; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.02); transition: transform 0.2s, box-shadow 0.2s; cursor: pointer; }
  .stat-card:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); border-color: #b0b0b0; }
  .comment-bubble { padding: 10px; background: white; border-radius: 8px; margin-bottom: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid #eee; }
  .comment-img { max-width: 100%; max-height: 200px; border-radius: 6px; margin-top: 5px; display: block; border: 1px solid #ddd; cursor: pointer; }

  /* --- NOUVEAUX STYLES DASHBOARD V18 (GRILLE & WIDGETS) --- */
  .dash-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; padding: 0 20px 20px; }
  .dash-widget { background: white; border-radius: 12px; border: 1px solid #eee; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
  .widget-title { font-size: 16px; font-weight: bold; color: #444; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; }
  
  /* Widget Urgences */
  .critical-item { display: flex; align-items: center; justify-content: space-between; padding: 12px; border-bottom: 1px solid #f9f9f9; }
  .critical-tag { background: #fee2e2; color: #ef4444; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
  
  /* Widget Équipe */
  .team-item { display: flex; align-items: center; margin-bottom: 12px; }
  .team-name { width: 100px; font-size: 13px; font-weight: 500; }
  .team-bar-bg { flex: 1; height: 8px; background: #f1f5f9; border-radius: 4px; overflow: hidden; margin: 0 10px; }
  .team-bar-fill { height: 100%; background: #3b82f6; }
  .team-count { font-size: 11px; color: #888; width: 30px; text-align: right; }

  /* Graphique Donut CSS */
  .donut-chart { width: 120px; height: 120px; border-radius: 50%; position: relative; margin: 0 auto; }
  .donut-center { position: absolute; inset: 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; }

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
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'6px'}} placeholder="Description..." />
                <div style={{marginBottom:'20px'}}><label style={{fontWeight:'bold', fontSize:'12px', color:'#888', marginBottom:'5px', display:'block'}}>SOUS-TÂCHES</label>{subtasks.map(s=>(<div key={s.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}><input type="checkbox" checked={s.is_completed} onChange={e=>upS({...s, is_completed:e.target.checked})}/><input value={s.title} onChange={e=>upS({...s, title:e.target.value})} style={{border:'none', background:'transparent', flex:1, textDecoration:s.is_completed?'line-through':'none', color:s.is_completed?'#ccc':'inherit'}}/><button onClick={()=>delS(s.id)} style={{border:'none', color:'#ef4444'}}>×</button></div>))}<form onSubmit={addS}><input placeholder="+ Étape" value={newSub} onChange={e=>setNewSub(e.target.value)} style={{width:'100%', padding:'5px', marginTop:'5px', border:'1px dashed #ccc', borderRadius:'4px'}} /></form></div>
                <div style={{borderTop:'1px solid #eee', paddingTop:'20px'}}><label style={{fontWeight:'bold', fontSize:'12px', color:'#888', marginBottom:'10px', display:'block'}}>DISCUSSION</label><div style={{background:'#f9f9f9', padding:'15px', borderRadius:'8px', maxHeight:'300px', overflowY:'auto', marginBottom:'15px', display:'flex', flexDirection:'column-reverse'}}>{comments.length===0 && <div style={{textAlign:'center', color:'#aaa', fontSize:'12px'}}>Aucun message.</div>}{comments.map(c=>(<div key={c.id} className="comment-bubble"><div style={{fontSize:'11px', fontWeight:'bold', color:'#3b82f6', display:'flex', justifyContent:'space-between'}}>{c.username}<span style={{color:'#ccc', fontWeight:'normal'}}>{new Date(c.created_at).toLocaleDateString()} {new Date(c.created_at).toLocaleTimeString().slice(0,5)}</span></div><div style={{fontSize:'13px', marginTop:'2px', whiteSpace:'pre-wrap'}}>{c.content}</div>{c.attachment_url && (c.attachment_url.match(/\.(jpeg|jpg|gif|png)$/)!=null?<img src={c.attachment_url} className="comment-img" onClick={()=>window.open(c.attachment_url,'_blank')}/>:<a href={c.attachment_url} target="_blank" style={{display:'block', marginTop:'5px', fontSize:'12px', color:'#3b82f6'}}>📎 Voir la pièce jointe</a>)}</div>))}</div><form onSubmit={sendC} style={{display:'flex', gap:'10px', alignItems:'center'}}><div style={{flex:1, position:'relative'}}><input value={newCom} onChange={e=>setNewCom(e.target.value)} placeholder="Écrire un message..." style={{width:'100%', padding:'10px', borderRadius:'20px', border:'1px solid #ccc', paddingRight:'40px'}} /><label style={{position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#888'}}>📎<input type="file" onChange={e=>setComFile(e.target.files[0])} style={{display:'none'}} /></label></div><button type="submit" disabled={isUploading} style={{background:isUploading?'#ccc':'#3b82f6', color:'white', border:'none', padding:'10px 15px', borderRadius:'50%', cursor:'pointer', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center'}}>{isUploading?'...':'➤'}</button></form>{comFile && <div style={{fontSize:'11px', color:'#10b981', marginTop:'5px', marginLeft:'10px'}}>Image : {comFile.name}</div>}</div>
            </div>
            <div style={{flex:1, padding:'20px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px', overflowY:'auto'}}>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>STATUT</label><select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status:e.target.value})} style={{width:'100%', padding:'8px'}}><option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>ASSIGNÉ À</label><select value={formData.assignee_id||''} onChange={e=>setFormData({...formData, assignee_id:e.target.value})} style={{width:'100%', padding:'8px'}}><option value="">--</option>{allUsers.map(u=>(<option key={u.id} value={u.id}>{u.username}</option>))}</select></div>
                <div style={{display:'flex', gap:'10px'}}><div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>DÉBUT</label><input type="date" value={formData.start_date?formData.start_date.split('T')[0]:''} onChange={e=>setFormData({...formData, start_date:e.target.value})} style={{width:'100%', padding:'8px'}}/></div><div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>FIN</label><input type="date" value={formData.due_date?formData.due_date.split('T')[0]:''} onChange={e=>setFormData({...formData, due_date:e.target.value})} style={{width:'100%', padding:'8px'}}/></div></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>DOCUMENT TÂCHE</label><div style={{marginTop:'5px', display:'flex', alignItems:'center', gap:'5px'}}><label style={{padding:'6px 10px', border:'1px solid #ccc', cursor:'pointer', background:'white', borderRadius:'4px', fontSize:'12px'}}>📎 Upload<input type="file" onChange={upF} style={{display:'none'}}/></label>{formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{color:'#3b82f6', fontSize:'12px'}}>Voir le fichier</a>}</div></div>
                <div style={{marginTop:'auto', paddingBottom:'20px'}}><button onClick={save} style={{width:'100%', padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold'}}>Enregistrer</button></div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD V18 (Cockpit) ---
function Dashboard({ user, onNavigate }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => { 
        if (!user) return; 
        fetch(`${API_URL}/dashboard/advanced`)
            .then(r => { if(!r.ok) throw new Error("API Error"); return r.json(); })
            .then(setData)
            .catch(() => setError("Veuillez mettre à jour le serveur (Server Update Required)")); 
    }, [user]);

    if (!data) return <div style={{padding:'40px'}}>Chargement du cockpit...</div>;

    const percent = data.stats.total > 0 ? Math.round((data.stats.done / data.stats.total) * 100) : 0;
    
    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f8f9fa'}}>
            <div style={{padding:'20px 20px 0'}}>
                <div style={{color:'#666', fontSize:'14px'}}>{new Date().toLocaleDateString('fr-FR', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</div>
                <div style={{fontSize:'24px', fontWeight:'bold', marginBottom:'20px'}}>Bonjour, {user?.username}</div>
                {error && <div style={{padding:'10px', background:'#fee2e2', color:'red', borderRadius:'6px', marginBottom:'20px'}}>⚠️ {error}</div>}

                {/* 1. Compteurs */}
                <div className="dash-stats" style={{display:'flex', gap:'15px', marginBottom:'20px'}}>
                    <div className="stat-card" onClick={() => onNavigate('global_projects')} style={{borderLeft:'4px solid #333'}}>
                        <div style={{fontSize:'28px', fontWeight:'bold', color:'#333'}}>{data.stats.projects}</div>
                        <div style={{fontSize:'11px', color:'#888', fontWeight:'bold'}}>PROJETS ACTIFS</div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('global_tasks_todo')} style={{borderLeft:'4px solid #f59e0b'}}>
                        <div style={{fontSize:'28px', fontWeight:'bold', color:'#333'}}>{data.stats.pending}</div>
                        <div style={{fontSize:'11px', color:'#888', fontWeight:'bold'}}>TÂCHES EN COURS</div>
                    </div>
                    <div className="stat-card" onClick={() => onNavigate('global_tasks_done')} style={{borderLeft:'4px solid #10b981'}}>
                        <div style={{fontSize:'28px', fontWeight:'bold', color:'#10b981'}}>{data.stats.done}</div>
                        <div style={{fontSize:'11px', color:'#888', fontWeight:'bold'}}>TERMINÉES</div>
                    </div>
                </div>

                {/* 2. Grille Widgets */}
                <div className="dash-grid">
                    {/* Gauche : Alertes & Activité */}
                    <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                        
                        {/* WIDGET : URGENCES */}
                        <div className="dash-widget">
                            <div className="widget-title"><span style={{color:'#ef4444'}}>🔥</span> Urgences (Haute Priorité)</div>
                            {data.critical.length === 0 ? <div style={{color:'#888', fontStyle:'italic'}}>Aucune urgence.</div> :
                                data.critical.map(t => (
                                    <div key={t.id} className="critical-item">
                                        <div>
                                            <div style={{fontWeight:'500', fontSize:'14px'}}>{t.title}</div>
                                            <div style={{fontSize:'12px', color:'#666'}}>{t.project_name} • {t.assignee_name || '?'}</div>
                                        </div>
                                        <div className="critical-tag">{t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : '!'}</div>
                                    </div>
                                ))
                            }
                        </div>

                        {/* WIDGET : ACTIVITÉ */}
                        <div className="dash-widget">
                            <div className="widget-title">⏱️ Activité Récente</div>
                            {data.activity.slice(0,5).map(t => (
                                <div key={t.id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #f9f9f9', fontSize:'13px'}}>
                                    <div style={{color:'#555'}}>{t.title}</div>
                                    <div style={{color:'#aaa', fontSize:'11px'}}>{new Date(t.created_at).toLocaleTimeString().slice(0,5)}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Droite : Stats & Équipe */}
                    <div style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                        
                        {/* WIDGET : PERFORMANCE */}
                        <div className="dash-widget" style={{textAlign:'center'}}>
                            <div className="widget-title" style={{justifyContent:'center'}}>Performance</div>
                            <div className="donut-chart" style={{background: `conic-gradient(#10b981 ${percent}%, #f3f4f6 0)`}}>
                                <div className="donut-center">
                                    <span style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{percent}%</span>
                                    <span style={{fontSize:'10px', color:'#888'}}>RÉALISÉ</span>
                                </div>
                            </div>
                            <div style={{marginTop:'15px', fontSize:'12px', color:'#666'}}>
                                {data.stats.done} / {data.stats.total} tâches
                            </div>
                        </div>

                        {/* WIDGET : CHARGE ÉQUIPE */}
                        <div className="dash-widget">
                            <div className="widget-title">👥 Charge Équipe</div>
                            {data.team.map((u, i) => (
                                <div key={i} className="team-item">
                                    <div className="team-name">{u.username}</div>
                                    <div className="team-bar-bg">
                                        <div className="team-bar-fill" style={{width: `${Math.min(100, (u.todo_count * 10))}px`}}></div>
                                    </div>
                                    <div className="team-count">{u.todo_count}</div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}

function GlobalListView({ type, user, onEditTask }) {
    const [items, setItems] = useState([]);
    useEffect(() => {
        if (type === 'projects') { fetch(`${API_URL}/projects`).then(r => r.json()).then(setItems); } 
        else { const status = type === 'todo' ? 'todo' : 'done'; fetch(`${API_URL}/global-tasks?status=${status}&role=${user.role}&userId=${user.id}`).then(r => r.json()).then(setItems).catch(console.error); }
    }, [type, user]);
    return (
        <div style={{padding:'20px', height:'100%', overflowY:'auto'}}>
            <h2 style={{textTransform:'uppercase', fontSize:'18px', marginBottom:'20px', color:'#333'}}>{type === 'projects' ? '📂 Tous les Projets' : type === 'todo' ? '🔥 Tâches en cours' : '✅ Tâches terminées'}</h2>
            <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', minWidth:'500px'}}><thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Nom / Titre</th>{type !== 'projects' && <th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Projet</th>}{type !== 'projects' && <th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Assigné à</th>}<th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>{type === 'projects' ? 'Site' : 'Échéance'}</th></tr></thead><tbody>{items.map(item => (<tr key={item.id} onClick={() => type !== 'projects' && onEditTask(item)} style={{borderBottom:'1px solid #eee', cursor: type !== 'projects' ? 'pointer' : 'default'}}><td style={{padding:'10px', fontSize:'13px', fontWeight:'500'}}>{type === 'projects' ? item.name : item.title}</td>{type !== 'projects' && <td style={{padding:'10px', fontSize:'12px', color:'#666'}}>{item.p_name}</td>}{type !== 'projects' && <td style={{padding:'10px', fontSize:'12px', color:'#666'}}>{item.u_name || '-'}</td>}<td style={{padding:'10px', fontSize:'12px', color:'#888'}}>{type === 'projects' ? 'Site #' + item.site_id : (item.due_date ? new Date(item.due_date).toLocaleDateString() : '-')}</td></tr>))}</tbody></table>{items.length === 0 && <div style={{padding:'20px', textAlign:'center', color:'#888'}}>Aucun élément trouvé.</div>}</div></div>
    );
}

function MembersView({ user }) {
    const [email, setEmail] = useState(""); const [inviteLink, setInviteLink] = useState(""); const [members, setMembers] = useState([]);
    useEffect(() => { fetch(`${API_URL}/users`).then(r=>r.json()).then(setMembers).catch(console.error); }, []);
    const inv = async (e) => { e.preventDefault(); const res=await fetch(`${API_URL}/admin/invite`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email})}); const j=await res.json(); setInviteLink(j.link.replace('http://localhost:5000', 'https://medina-app.onrender.com')); };
    const role = async (uid, r) => { if(uid===user.id) return alert("Impossible"); await fetch(`${API_URL}/users/${uid}/role`, {method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({role:r})}); fetch(`${API_URL}/users`).then(r=>r.json()).then(setMembers); };
    const del = async (uid) => { if(!confirm("Supprimer ?")) return; await fetch(`${API_URL}/users/${uid}`, {method:'DELETE'}); fetch(`${API_URL}/users`).then(r=>r.json()).then(setMembers); };
    return ( <div style={{padding:'20px', maxWidth:'100%'}}><h2 style={{fontSize:'20px'}}>Équipe RH</h2><div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #eee', marginBottom:'20px'}}><h3 style={{marginTop:0, fontSize:'16px'}}>Inviter</h3><form onSubmit={inv} style={{display:'flex', gap:'10px'}}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email..." style={{flex:1, padding:'10px', border:'1px solid #ccc', borderRadius:'6px'}} required /><button type="submit" style={{padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px'}}>Envoyer</button></form>{inviteLink && <div style={{marginTop:'10px', background:'#eff6ff', padding:'10px', borderRadius:'6px', fontSize:'11px', wordBreak:'break-all'}}>{inviteLink}</div>}</div><div style={{background:'white', borderRadius:'10px', border:'1px solid #eee', overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', minWidth:'500px'}}><thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}><th style={{padding:'10px', fontSize:'12px'}}>Nom</th><th style={{padding:'10px', fontSize:'12px'}}>Email</th><th style={{padding:'10px', fontSize:'12px'}}>Rôle</th><th></th></tr></thead><tbody>{members.map(m=>(<tr key={m.id} style={{borderBottom:'1px solid #f9f9f9'}}><td style={{padding:'10px', fontSize:'13px'}}>{m.username}</td><td style={{padding:'10px', color:'#666', fontSize:'12px'}}>{m.email}</td><td style={{padding:'10px'}}><select value={m.role} onChange={e=>role(m.id, e.target.value)} disabled={m.id===user.id} style={{fontSize:'12px'}}><option value="member">Membre</option><option value="admin">Admin</option></select></td><td style={{padding:'10px'}}>{m.id!==user.id && <button onClick={()=>del(m.id)} style={{color:'red', border:'none', background:'none'}}>×</button>}</td></tr>))}</tbody></table></div></div> );
}

function ProjectView({ project, tasks, members, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");
    const dragStart = (e, id) => e.dataTransfer.setData("taskId", id);
    const drop = (e, status) => { const id=e.dataTransfer.getData("taskId"); const t=tasks.find(x=>x.id.toString()===id); if(t && t.status!==status) onUpdateTask({...t, status}); };
    const getName = (id) => { const u=allUsers.find(x=>x.id===id); return u?u.username:'-'; };
    const exportPDF = () => { const doc = new jsPDF(); doc.text(`Rapport Projet: ${project.name}`, 14, 20); doc.setFontSize(10); doc.text(`Généré le ${new Date().toLocaleDateString()}`, 14, 28); const tableData = tasks.map(t => [t.title, t.status, getName(t.assignee_id), t.due_date ? new Date(t.due_date).toLocaleDateString() : '-']); autoTable(doc, { head: [['Tâche', 'Statut', 'Assigné à', 'Échéance']], body: tableData, startY: 35 }); doc.save(`${project.name}_rapport.pdf`); };
    return ( <div style={{padding:'20px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}><div className="project-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}><div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'32px', height:'32px', background:'#f06a6a', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px', fontWeight:'bold'}}>{project.name.charAt(0)}</div><h2 style={{margin:0, fontSize:'18px'}}>{project.name}</h2></div><div style={{display:'flex', gap:'5px'}}><button onClick={exportPDF} style={{background:'#fff', border:'1px solid #ccc', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer', color:'#333'}}>📄 PDF</button>{user.role==='admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px 10px', borderRadius:'6px', fontSize:'12px'}}>Supprimer</button>}</div></div><div className="view-buttons" style={{display:'flex', gap:'5px', marginBottom:'15px', background:'#f1f5f9', padding:'3px', borderRadius:'6px'}}><button onClick={()=>setViewMode('board')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background:viewMode==='board'?'white':'transparent', fontWeight:viewMode==='board'?'bold':'normal', fontSize:'13px'}}>Kanban</button><button onClick={()=>setViewMode('list')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background:viewMode==='list'?'white':'transparent', fontWeight:viewMode==='list'?'bold':'normal', fontSize:'13px'}}>Liste</button><button onClick={()=>setViewMode('timeline')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background:viewMode==='timeline'?'white':'transparent', fontWeight:viewMode==='timeline'?'bold':'normal', fontSize:'13px'}}>Gantt</button></div>{viewMode==='board' && <div className="kanban-board">{['todo', 'doing', 'done'].map(s=>(<div key={s} className="kanban-col" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,s)}><div style={{fontWeight:'bold', marginBottom:'10px', textTransform:'uppercase', color:'#666', fontSize:'12px'}}>{s}</div>{s==='todo' && user.role==='admin' && <form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}><input placeholder="+ Tâche" value={newTask} onChange={e=>setNewTask(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'10px', border:'1px solid white', borderRadius:'6px'}}/></form>}<div style={{display:'flex', flexDirection:'column', gap:'10px'}}>{tasks.filter(t=>t.status===s).map(t=>(<div key={t.id} draggable="true" onDragStart={e=>dragStart(e,t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'12px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', borderLeft:`3px solid ${t.priority==='high'?'red':'transparent'}`}}><div style={{fontWeight:'500', fontSize:'14px'}}>{t.title}</div><div style={{fontSize:'11px', color:'#888', marginTop:'5px'}}>{getName(t.assignee_id)} • {t.due_date?new Date(t.due_date).toLocaleDateString().slice(0,5):''}</div></div>))}</div></div>))}</div>}{viewMode==='list' && <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden', overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', minWidth:'500px'}}><thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Titre</th><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Statut</th><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Assigné</th></tr></thead><tbody>{tasks.map(t=>(<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px', fontSize:'13px'}}>{t.title}</td><td style={{padding:'10px', fontSize:'12px'}}>{t.status}</td><td style={{padding:'10px', fontSize:'12px'}}>{getName(t.assignee_id)}</td></tr>))}</tbody></table></div>}{viewMode==='timeline' && <GanttView tasks={tasks} onEditTask={onEditTask} />}</div> );
}

function TrashView() {
    const [items, setItems] = useState([]); const [error, setError] = useState(null);
    const load = () => { fetch(`${API_URL}/trash`).then(r=>{if(!r.ok)throw new Error("Err");return r.json()}).then(d=>{if(Array.isArray(d))setItems(d);else setItems([])}).catch(e=>{console.error(e); setError("HS");}) };
    useEffect(() => { load(); }, []);
    const res = async (t, id) => { await fetch(`${API_URL}/restore/${t}/${id}`, {method:'PUT'}); load(); };
    const del = async (t, id) => { if(!confirm("Sûr ?")) return; await fetch(`${API_URL}/permanent/${t}/${id}`, {method:'DELETE'}); load(); };
    if(error) return <div style={{padding:'40px', color:'red'}}>⚠️ Vérifiez server/index.js</div>;
    return (<div style={{padding:'40px'}}><h1 style={{color:'red'}}>Corbeille</h1>{items.length===0?<p>Vide</p>:items.map((i,x)=>(<div key={x} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}><div>{i.title} ({i.type})</div><div><button onClick={()=>res(i.type, i.id)}>♻️</button><button onClick={()=>del(i.type, i.id)}>☠️</button></div></div>))}</div>)
}

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token')); const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('hotel_user')); } catch { return null; } });
  const [sites, setSites] = useState([]); const [projects, setProjects] = useState([]); const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('home'); const [selectedProject, setSelectedProject] = useState(null); const [projectData, setProjectData] = useState({ tasks: [], members: [] }); const [viewMode, setViewMode] = useState('board'); const [editingTask, setEditingTask] = useState(null); const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [newSiteName, setNewSiteName] = useState(""); const [newProjectName, setNewProjectName] = useState(""); const [creatingProjectForSite, setCreatingProjectForSite] = useState(null);
  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); localStorage.setItem('hotel_user', JSON.stringify(usr)); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.clear(); };
  useEffect(() => { const style = document.createElement('style'); style.textContent = styles; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);
  const loadData = () => { Promise.all([fetch(`${API_URL}/sites`).then(r=>r.json()), fetch(`${API_URL}/projects`).then(r=>r.json()), fetch(`${API_URL}/users`).then(r=>r.json())]).then(([s, p, u]) => { setSites(Array.isArray(s)?s:[]); setProjects(Array.isArray(p)?p:[]); setAllUsers(Array.isArray(u)?u:[]); }).catch(console.error); };
  useEffect(() => { if (token) loadData(); }, [token]);
  useEffect(() => { if (selectedProject) { Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(r=>r.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(r=>r.json())]).then(([t, m]) => { setProjectData({ tasks: Array.isArray(t)?t:[], members: Array.isArray(m)?m:[] }); }).catch(console.error); } }, [selectedProject]);
  const navToProject = (p) => { setSelectedProject(p); setActiveTab(`project-${p.id}`); setMobileMenuOpen(false); };
  const createTask = async (title) => { const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})}); const t = await res.json(); setProjectData({...projectData, tasks: [...projectData.tasks, t]}); };
  const updateTask = async (uT) => { 
      if (activeTab.startsWith('global') || activeTab === 'home') { window.location.reload(); } 
      else { setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === uT.id ? uT : t) })); }
      await fetch(`${API_URL}/tasks/${uT.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(uT) }); 
  };
  const deleteTask = async (taskId) => { await fetch(`${API_URL}/recycle/tasks/${taskId}`, { method:'PUT' }); setProjectData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); setEditingTask(null); };
  const deleteProject = async (projId) => { if(!confirm("Supprimer ?")) return; await fetch(`${API_URL}/recycle/projects/${projId}`, { method:'PUT' }); loadData(); setActiveTab('home'); setSelectedProject(null); };
  const deleteSite = async (siteId) => { if(!confirm("Supprimer site ?")) return; await fetch(`${API_URL}/recycle/sites/${siteId}`, { method:'PUT' }); loadData(); };
  const createSite = async (e) => { e.preventDefault(); if(!newSiteName) return; const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id: user.id})}); if(res.ok) { setNewSiteName(""); loadData(); } };
  const createProject = async (e, siteId) => { e.preventDefault(); if(!newProjectName) return; const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id: user.id, site_id: siteId})}); const newProj = await res.json(); setNewProjectName(""); setCreatingProjectForSite(null); loadData(); navToProject(newProj); };
  
  if (!token || !user) return <Login onLogin={handleLogin} />;
  return (
    <div className="app-container">
        {editingTask && <TaskModal task={editingTask} allUsers={allUsers} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
        <div className="mobile-header"><img src="/logo.png" alt="Belisaire Logo" className="logo-img" style={{maxHeight:'50px'}} /><button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:'none', border:'none', color:'#333', fontSize:'24px'}}>☰</button></div>
        {mobileMenuOpen && <div className="menu-overlay" onClick={()=>setMobileMenuOpen(false)}></div>}
        <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}><div className="logo-container"><img src="/logo.png" alt="Belisaire" className="logo-img" /></div><div style={{padding:'10px 20px', cursor:'pointer', background: activeTab==='home'?'rgba(255,255,255,0.1)':'transparent'}} onClick={()=>{setActiveTab('home'); setSelectedProject(null); setMobileMenuOpen(false);}}>🏠 Accueil</div>{user.role === 'admin' && <><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('members'); setSelectedProject(null); setMobileMenuOpen(false);}}>👥 Membres</div><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('trash'); setSelectedProject(null); setMobileMenuOpen(false);}}>🗑️ Corbeille</div></>}
            {sites.map(site => (<div key={site.id}><div style={{padding:'10px 20px', display:'flex', justifyContent:'space-between', color:'#888', fontSize:'12px', textTransform:'uppercase', marginTop:'10px'}}><span>{site.name}</span>{user.role === 'admin' && <div style={{display:'flex', gap:'5px'}}><button onClick={()=>setCreatingProjectForSite(creatingProjectForSite===site.id ? null : site.id)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer'}}>+</button><button onClick={()=>deleteSite(site.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>x</button></div>}</div>{creatingProjectForSite === site.id && <form onSubmit={(e)=>createProject(e, site.id)} style={{padding:'0 20px 10px'}}><input autoFocus placeholder="Nom..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /></form>}{projects.filter(p => p.site_id === site.id).map(p => (<div key={p.id} style={{padding:'8px 30px', cursor:'pointer', background: activeTab===`project-${p.id}`?'rgba(255,255,255,0.1)':'transparent'}} onClick={() => navToProject(p)}>{p.name}</div>))}</div>))}
            {user.role === 'admin' && <div style={{padding:'20px'}}><form onSubmit={createSite} style={{display:'flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /><button style={{background:'#f06a6a', border:'none', color:'white'}}>></button></form></div>}
            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{width:'100%'}}>Déconnexion</button></div>
        </div>
        <div className="main-content">
            {activeTab === 'home' && <Dashboard user={user} onNavigate={(view) => setActiveTab(view)} />}
            {activeTab.startsWith('global_') && <GlobalListView type={activeTab.replace('global_tasks_', '').replace('global_', '')} user={user} onEditTask={setEditingTask} />}
            {activeTab === 'members' && <MembersView user={user} />}
            {activeTab === 'trash' && <TrashView />}
            {activeTab.startsWith('project-') && selectedProject && <ProjectView project={selectedProject} tasks={projectData.tasks} members={projectData.members} allUsers={allUsers} viewMode={viewMode} setViewMode={setViewMode} onAddTask={createTask} onEditTask={setEditingTask} onUpdateTask={updateTask} onDeleteProject={deleteProject} onInvite={()=>setActiveTab('members')} user={user} />}
        </div>
    </div>
  )
} 