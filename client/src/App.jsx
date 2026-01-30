import { useEffect, useState, useRef } from 'react'
import Login from './Login'

const API_URL = 'https://medina-api-xxxx.onrender.com'; // <--- VÉRIFIEZ VOTRE URL !

// --- STYLE CSS MOBILE (TIROIR FLOTTANT) ---
const mobileStyles = `
  @media (max-width: 768px) {
    /* Conteneur principal */
    .app-container { flex-direction: column; overflow-x: hidden; }
    
    /* Header Mobile (Visible uniquement sur tel) */
    .mobile-header { 
        display: flex !important; 
        position: fixed; 
        top: 0; left: 0; right: 0; 
        height: 60px; 
        z-index: 900; 
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }

    /* La Sidebar devient un tiroir caché */
    .sidebar { 
        position: fixed !important;
        top: 0; left: 0; bottom: 0;
        width: 260px !important;
        transform: translateX(-100%); /* Caché à gauche */
        transition: transform 0.3s ease;
        z-index: 1000;
        box-shadow: 5px 0 15px rgba(0,0,0,0.3);
    }
    
    /* Quand le menu est ouvert */
    .sidebar.open { transform: translateX(0); }

    /* Le contenu principal prend tout l'écran */
    .main-content { 
        margin-top: 60px; /* Pour ne pas être caché par le header */
        width: 100% !important; 
        flex: 1;
    }

    /* Ajustements Dashboard */
    .dash-stats { flex-direction: column; }
    .dash-header { padding: 20px !important; }
    
    /* Modale Plein Écran */
    .task-modal { width: 100% !important; height: 100% !important; borderRadius: 0 !important; }
    .task-modal-body { flex-direction: column; }
    .task-modal-left { border-right: none !important; border-bottom: 1px solid #eee; height: 50%; }
    
    /* Overlay sombre quand le menu est ouvert */
    .menu-overlay {
        position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 950;
    }
  }
`;

// --- VUE CHRONOLOGIE (GANTT) ---
function GanttView({ tasks, onEditTask }) {
    const scrollRef = useRef(null);
    const getRange = () => {
        const now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - 5);
        const end = new Date(now); end.setDate(now.getDate() + 15);
        return { start, end };
    };
    const { start, end } = getRange();
    const days = []; for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d));
    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollLeft = 0; }, []);

    const getStyle = (t) => {
        let s = new Date(t.start_date || Date.now()); let e = new Date(t.due_date || s);
        if (e < s) e = new Date(s); if (s < start) s = new Date(start);
        const diff = Math.max(0, Math.ceil((s - start) / (1000 * 60 * 60 * 24)));
        const dur = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);
        return { left: `${diff * 40}px`, width: `${dur * 40}px`, background: t.status === 'done' ? '#10b981' : (t.priority === 'high' ? '#ef4444' : '#3b82f6'), opacity: 1 };
    };

    return (
        <div style={{overflowX: 'auto', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column'}} ref={scrollRef}>
            <div style={{display: 'flex', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#f9f9f9', zIndex: 10, minWidth:'fit-content'}}>
                <div style={{minWidth: '150px', padding: '10px', borderRight: '1px solid #eee', position: 'sticky', left: 0, background: '#f9f9f9', zIndex: 20, fontWeight: 'bold', fontSize:'12px'}}>Tâche</div>
                {days.map((d, i) => (
                    <div key={i} style={{minWidth: '40px', padding: '10px 0', textAlign: 'center', borderRight: '1px solid #eee', fontSize: '10px', color: '#666', background: d.toDateString() === new Date().toDateString() ? '#e0f2fe' : 'transparent'}}>
                        <div style={{fontWeight: 'bold'}}>{d.getDate()}</div>
                        <div>{d.toLocaleDateString('fr', { month: 'short' })}</div>
                    </div>
                ))}
            </div>
            <div style={{flex: 1, overflowY: 'auto', minWidth:'fit-content'}}>
                {tasks.map(t => (
                    <div key={t.id} style={{display: 'flex', borderBottom: '1px solid #f9f9f9', height: '40px', alignItems: 'center', position: 'relative'}}>
                        <div style={{minWidth: '150px', padding: '0 10px', borderRight: '1px solid #eee', position: 'sticky', left: 0, background: 'white', zIndex: 10, fontSize: '12px', fontWeight: '500', height: '100%', display: 'flex', alignItems: 'center', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}}>{t.title}</div>
                        <div style={{position: 'relative', flex: 1, height: '100%'}}>
                            <div style={{position: 'absolute', inset: 0, display: 'flex'}}>{days.map((_, i) => <div key={i} style={{minWidth: '40px', borderRight: '1px solid #f9f9f9', height: '100%'}}></div>)}</div>
                            <div onClick={() => onEditTask(t)} style={{...getStyle(t), position: 'absolute', top: '8px', height: '24px', borderRadius: '4px', color: 'white', fontSize: '10px', padding: '0 5px', overflow: 'hidden', cursor: 'pointer', whiteSpace: 'nowrap'}}>{t.title}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// --- MODALE TÂCHE ---
function TaskModal({ task, allUsers, currentUser, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => { fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(r=>r.json()).then(setSubtasks).catch(console.error); fetch(`${API_URL}/tasks/${task.id}/comments`).then(r=>r.json()).then(setComments).catch(console.error); }, [task]);
  const handleSave = () => { onUpdate(formData); onClose(); };
  const addSub = async (e) => { e.preventDefault(); if(!newSubtaskTitle) return; const res = await fetch(`${API_URL}/subtasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, title: newSubtaskTitle})}); const json = await res.json(); setSubtasks([...subtasks, json]); setNewSubtaskTitle(""); };
  const updateSub = async (u) => { setSubtasks(subtasks.map(s => s.id === u.id ? u : s)); await fetch(`${API_URL}/subtasks/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)}); };
  const deleteSub = async (id) => { setSubtasks(subtasks.filter(s => s.id !== id)); await fetch(`${API_URL}/subtasks/${id}`, { method:'DELETE' }); };
  const sendCom = async (e) => { e.preventDefault(); if(!newComment) return; const res = await fetch(`${API_URL}/comments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, user_id: currentUser.id, content: newComment})}); const json = await res.json(); setComments([json, ...comments]); setNewComment(""); };
  const uploadFile = async (e) => { const f = e.target.files[0]; if (!f) return; const d = new FormData(); d.append('file', f); try { const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: d }); const j = await res.json(); setFormData({ ...formData, attachment_url: j.url }); } catch (err) { alert("Erreur upload"); } };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(2px)'}}>
      <div className="task-modal" style={{background:'white', width:'900px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
        <div style={{padding:'15px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'18px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <div style={{display:'flex', gap:'10px'}}>{currentUser.role === 'admin' && <button onClick={()=>{if(confirm("Corbeille ?")) onDelete(task.id)}} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px', borderRadius:'4px', fontSize:'12px'}}>🗑️</button>}<button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px'}}>✕</button></div>
        </div>
        <div className="task-modal-body" style={{display:'flex', flex:1, overflow:'hidden'}}>
            <div className="task-modal-left" style={{flex:2, padding:'20px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'6px'}} placeholder="Description..." />
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}><label style={{fontWeight:'bold', fontSize:'12px', color:'#888'}}>SOUS-TÂCHES</label>{subtasks.map(st => (<div key={st.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}><input type="checkbox" checked={st.is_completed} onChange={(e)=>updateSub({...st, is_completed:e.target.checked})} /><input value={st.title} onChange={(e)=>updateSub({...st, title:e.target.value})} style={{border:'none', background:'transparent', flex:1}} /><button onClick={()=>deleteSub(st.id)} style={{border:'none', color:'red'}}>×</button></div>))}<form onSubmit={addSub}><input placeholder="+ Étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{width:'100%', padding:'5px', marginTop:'5px'}} /></form></div>
                <div><label style={{fontWeight:'bold', fontSize:'12px', color:'#888'}}>COMMENTAIRES</label><div style={{background:'#f9f9f9', padding:'10px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>{comments.map(c => (<div key={c.id} style={{marginBottom:'8px', background:'white', padding:'8px', borderRadius:'6px'}}><div style={{fontSize:'11px', fontWeight:'bold', color:'#3b82f6'}}>{c.username}</div><div style={{fontSize:'13px'}}>{c.content}</div></div>))}</div><form onSubmit={sendCom} style={{display:'flex', gap:'10px'}}><input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Écrire..." style={{flex:1, padding:'8px'}} /><button type="submit" style={{background:'#3b82f6', color:'white', border:'none', padding:'0 15px', borderRadius:'6px'}}>></button></form></div>
            </div>
            <div style={{flex:1, padding:'20px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px', overflowY:'auto'}}>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>STATUT</label><select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>ASSIGNÉ À</label><select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="">-- Personne --</option>{allUsers.map(m => (<option key={m.id} value={m.id}>{m.username}</option>))}</select></div>
                <div style={{display:'flex', gap:'10px'}}><div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>DÉBUT</label><input type="date" value={formData.start_date ? formData.start_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, start_date: e.target.value})} style={{width:'100%', padding:'8px'}} /></div><div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>FIN</label><input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px'}} /></div></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>PIÈCE JOINTE</label><div style={{marginTop:'5px'}}><label style={{padding:'5px', border:'1px solid #ccc', cursor:'pointer', background:'white'}}>📎 Upload<input type="file" onChange={uploadFile} style={{display:'none'}} /></label>{formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{marginLeft:'10px', color:'#3b82f6'}}>Voir</a>}</div></div>
                <div style={{marginTop:'auto', paddingBottom:'20px'}}><button onClick={handleSave} style={{width:'100%', padding:'12px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold'}}>Enregistrer</button></div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ user }) {
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    
    useEffect(() => {
        if (!user) return;
        const sUrl = user.role === 'admin' ? `${API_URL}/stats/global` : `${API_URL}/stats/${user.id}`;
        const aUrl = user.role === 'admin' ? `${API_URL}/activity/global` : `${API_URL}/users/${user.id}/activity`;
        fetch(sUrl).then(r=>r.json()).then(setStats).catch(console.error);
        fetch(aUrl).then(r=>r.json()).then(setActivity).catch(console.error);
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f8f9fa'}}>
            <div style={{padding:'20px 20px 0'}}>
                <div style={{color:'#666', fontSize:'14px'}}>{today}</div>
                <div style={{fontSize:'24px', fontWeight:'bold', marginBottom:'20px'}}>Bonjour, {user?.username}</div>
                <div className="dash-stats" style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.projects}</div><div style={{fontSize:'10px', color:'#888', fontWeight:'bold'}}>PROJETS</div>
                    </div>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.pending}</div><div style={{fontSize:'10px', color:'#888', fontWeight:'bold'}}>EN COURS</div>
                    </div>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#10b981'}}>{stats.completed}</div><div style={{fontSize:'10px', color:'#888', fontWeight:'bold'}}>FINI</div>
                    </div>
                </div>
            </div>
            <div style={{padding:'20px'}}>
                <h3 style={{fontSize:'16px'}}>Activité Récente</h3>
                {activity.length === 0 ? <p style={{color:'#888', fontStyle:'italic', fontSize:'13px'}}>Rien à signaler.</p> : 
                    activity.map(t => (
                        <div key={t.id} style={{background:'white', padding:'12px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                             <div style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'70%'}}>
                                 <div style={{fontWeight:'500', fontSize:'14px'}}>{t.title}</div> 
                                 <div style={{fontSize:'11px', color:'#888'}}>{t.assignee_name || '?'} • {t.project_name}</div>
                             </div>
                             <div style={{fontSize:'10px', color:'#aaa'}}>{new Date(t.created_at).toLocaleDateString()}</div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

// --- VUE MEMBRES (RESPONSIVE) ---
function MembersView({ user }) {
    const [email, setEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [members, setMembers] = useState([]);
    useEffect(() => { fetch(`${API_URL}/users`).then(r => r.json()).then(setMembers).catch(console.error); }, []);
    const handleInvite = async (e) => { e.preventDefault(); const res = await fetch(`${API_URL}/admin/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) }); const json = await res.json(); setInviteLink(json.link.replace('http://localhost:5000', 'https://medina-app.onrender.com')); };
    const changeRole = async (userId, newRole) => { if (userId === user.id) { alert("Impossible."); return; } await fetch(`${API_URL}/users/${userId}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) }); fetch(`${API_URL}/users`).then(r => r.json()).then(setMembers); };
    const removeUser = async (userId) => { if (!confirm("Supprimer ?")) return; await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' }); fetch(`${API_URL}/users`).then(r => r.json()).then(setMembers); };

    return (
        <div style={{padding:'20px', maxWidth:'100%'}}>
            <h2 style={{fontSize:'20px'}}>Équipe RH</h2>
            <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #eee', marginBottom:'20px'}}>
                <h3 style={{marginTop:0, fontSize:'16px'}}>Inviter</h3>
                <form onSubmit={handleInvite} style={{display:'flex', gap:'10px'}}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email..." style={{flex:1, padding:'10px', border:'1px solid #ccc', borderRadius:'6px'}} required /><button type="submit" style={{padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px'}}>Envoyer</button></form>
                {inviteLink && <div style={{marginTop:'10px', background:'#eff6ff', padding:'10px', borderRadius:'6px', fontSize:'11px', wordBreak:'break-all'}}>{inviteLink}</div>}
            </div>
            <div style={{background:'white', borderRadius:'10px', border:'1px solid #eee', overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', minWidth:'500px'}}>
                    <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee', background:'#f9f9f9'}}><th style={{padding:'10px', fontSize:'12px'}}>Nom</th><th style={{padding:'10px', fontSize:'12px'}}>Email</th><th style={{padding:'10px', fontSize:'12px'}}>Rôle</th><th></th></tr></thead>
                    <tbody>{members.map(m => (<tr key={m.id} style={{borderBottom:'1px solid #f9f9f9'}}><td style={{padding:'10px', fontSize:'13px'}}>{m.username}</td><td style={{padding:'10px', color:'#666', fontSize:'12px'}}>{m.email}</td><td style={{padding:'10px'}}><select value={m.role} onChange={(e)=>changeRole(m.id, e.target.value)} disabled={m.id===user.id} style={{fontSize:'12px'}}><option value="member">Membre</option><option value="admin">Admin</option></select></td><td style={{padding:'10px'}}>{m.id!==user.id && <button onClick={()=>removeUser(m.id)} style={{color:'red', border:'none', background:'none'}}>×</button>}</td></tr>))}</tbody>
                </table>
            </div>
        </div>
    );
}

// --- VUE PROJET (RESPONSIVE) ---
function ProjectView({ project, tasks, members, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => { const id = e.dataTransfer.getData("taskId"); const task = tasks.find(t => t.id.toString() === id); if (task && task.status !== newStatus) onUpdateTask({ ...task, status: newStatus }); };
    const getUserName = (id) => { const u = allUsers.find(u => u.id === id); return u ? u.username : '-'; };

    return (
        <div style={{padding:'20px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div className="project-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'32px', height:'32px', background:'#f06a6a', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px', fontWeight:'bold'}}>{project.name.charAt(0)}</div><h2 style={{margin:0, fontSize:'18px'}}>{project.name}</h2></div>
                {user.role === 'admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px 10px', borderRadius:'6px', fontSize:'12px'}}>Supprimer</button>}
            </div>
            
            <div className="view-buttons" style={{display:'flex', gap:'5px', marginBottom:'15px', background:'#f1f5f9', padding:'3px', borderRadius:'6px'}}>
                <button onClick={()=>setViewMode('board')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background: viewMode==='board'?'white':'transparent', fontWeight: viewMode==='board'?'bold':'normal', fontSize:'13px'}}>Kanban</button>
                <button onClick={()=>setViewMode('list')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background: viewMode==='list'?'white':'transparent', fontWeight: viewMode==='list'?'bold':'normal', fontSize:'13px'}}>Liste</button>
                <button onClick={()=>setViewMode('timeline')} style={{padding:'8px 12px', border:'none', borderRadius:'4px', background: viewMode==='timeline'?'white':'transparent', fontWeight: viewMode==='timeline'?'bold':'normal', fontSize:'13px'}}>Gantt</button>
            </div>

            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'15px', overflowX:'auto', height:'100%', alignItems:'flex-start', paddingBottom:'10px'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'280px', width:'85vw', background:'#f7f8f9', borderRadius:'10px', padding:'15px', border:'1px solid #e0e0e0', flexShrink:0}}>
                            <div style={{fontWeight:'bold', marginBottom:'10px', textTransform:'uppercase', color:'#666', fontSize:'12px'}}>{status}</div>
                            {status === 'todo' && user.role === 'admin' && <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}}><input placeholder="+ Tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'10px', border:'1px solid white', borderRadius:'6px'}} /></form>}
                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {tasks.filter(t=>t.status===status).map(t => (
                                    <div key={t.id} draggable="true" onDragStart={(e)=>handleDragStart(e, t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'12px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', borderLeft: `3px solid ${t.priority==='high'?'red':'transparent'}`}}>
                                        <div style={{fontWeight:'500', fontSize:'14px'}}>{t.title}</div>
                                        <div style={{fontSize:'11px', color:'#888', marginTop:'5px'}}>{getUserName(t.assignee_id)} • {t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden', overflowX:'auto'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', minWidth:'500px'}}>
                        <thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Titre</th><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Statut</th><th style={{padding:'10px', textAlign:'left', fontSize:'12px'}}>Assigné</th></tr></thead>
                        <tbody>{tasks.map(t => (<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'10px', fontSize:'13px'}}>{t.title}</td><td style={{padding:'10px', fontSize:'12px'}}>{t.status}</td><td style={{padding:'10px', fontSize:'12px'}}>{getUserName(t.assignee_id)}</td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {viewMode === 'timeline' && <GanttView tasks={tasks} onEditTask={onEditTask} />}
        </div>
    )
}

// --- APP PRINCIPALE ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('hotel_user')); } catch { return null; } });
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState({ tasks: [], members: [] });
  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // <--- ÉTAT MENU BURGER
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProjectForSite, setCreatingProjectForSite] = useState(null);

  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); localStorage.setItem('hotel_user', JSON.stringify(usr)); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.clear(); };

  useEffect(() => { const style = document.createElement('style'); style.textContent = mobileStyles; document.head.appendChild(style); return () => document.head.removeChild(style); }, []);
  const loadData = () => { Promise.all([fetch(`${API_URL}/sites`).then(r=>r.json()), fetch(`${API_URL}/projects`).then(r=>r.json()), fetch(`${API_URL}/users`).then(r=>r.json())]).then(([s, p, u]) => { setSites(Array.isArray(s)?s:[]); setProjects(Array.isArray(p)?p:[]); setAllUsers(Array.isArray(u)?u:[]); }).catch(console.error); };
  useEffect(() => { if (token) loadData(); }, [token]);
  useEffect(() => { if (selectedProject) { Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(r=>r.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(r=>r.json())]).then(([t, m]) => { setProjectData({ tasks: Array.isArray(t)?t:[], members: Array.isArray(m)?m:[] }); }).catch(console.error); } }, [selectedProject]);

  const navToProject = (p) => { setSelectedProject(p); setActiveTab(`project-${p.id}`); setMobileMenuOpen(false); };
  const createTask = async (title) => { const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})}); const t = await res.json(); setProjectData({...projectData, tasks: [...projectData.tasks, t]}); };
  const updateTask = async (uT) => { setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === uT.id ? uT : t) })); await fetch(`${API_URL}/tasks/${uT.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(uT) }); };
  const deleteTask = async (taskId) => { await fetch(`${API_URL}/recycle/tasks/${taskId}`, { method:'PUT' }); setProjectData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); setEditingTask(null); };
  const deleteProject = async (projId) => { if(!confirm("Supprimer ?")) return; await fetch(`${API_URL}/recycle/projects/${projId}`, { method:'PUT' }); loadData(); setActiveTab('home'); setSelectedProject(null); };
  const deleteSite = async (siteId) => { if(!confirm("Supprimer site ?")) return; await fetch(`${API_URL}/recycle/sites/${siteId}`, { method:'PUT' }); loadData(); };
  const createSite = async (e) => { e.preventDefault(); if(!newSiteName) return; const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id: user.id})}); if(res.ok) { setNewSiteName(""); loadData(); } };
  const createProject = async (e, siteId) => { e.preventDefault(); if(!newProjectName) return; const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id: user.id, site_id: siteId})}); const newProj = await res.json(); setNewProjectName(""); setCreatingProjectForSite(null); loadData(); navToProject(newProj); };

  if (!token || !user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-container" style={{display:'flex', height:'100vh', width:'100vw'}}>
        {editingTask && <TaskModal task={editingTask} allUsers={allUsers} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}

        {/* HEADER MOBILE (NOUVEAU) */}
        <div style={{display: 'none', padding:'15px', background:'#1e1f21', color:'white', alignItems:'center', justifyContent:'space-between'}} className="mobile-header">
            <span style={{fontWeight:'bold'}}>MedinaOS</span>
            <button onClick={()=>setMobileMenuOpen(!mobileMenuOpen)} style={{background:'none', border:'none', color:'white', fontSize:'24px'}}>☰</button>
        </div>

        {/* OVERLAY SOMBRE QUAND MENU OUVERT */}
        {mobileMenuOpen && <div className="menu-overlay" onClick={()=>setMobileMenuOpen(false)}></div>}

        {/* SIDEBAR FLOTTANTE */}
        <div className={`sidebar ${mobileMenuOpen ? 'open' : ''}`} style={{width:'250px', flexShrink:0, overflowY:'auto', background:'#1e1f21', color:'white', zIndex:100}}>
            <div className="sidebar-content">
                <div style={{padding:'20px', fontWeight:'bold', fontSize:'18px'}}>MedinaOS</div>
                <div style={{padding:'10px 20px', cursor:'pointer', background: activeTab==='home'?'rgba(255,255,255,0.1)':'transparent'}} onClick={()=>{setActiveTab('home'); setSelectedProject(null); setMobileMenuOpen(false);}}>🏠 Accueil</div>
                {user.role === 'admin' && <><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('members'); setSelectedProject(null); setMobileMenuOpen(false);}}>👥 Membres</div><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('trash'); setSelectedProject(null); setMobileMenuOpen(false);}}>🗑️ Corbeille</div></>}
                
                {sites.map(site => (
                    <div key={site.id}>
                        <div style={{padding:'10px 20px', display:'flex', justifyContent:'space-between', color:'#888', fontSize:'12px', textTransform:'uppercase', marginTop:'10px'}}><span>{site.name}</span>{user.role === 'admin' && <div style={{display:'flex', gap:'5px'}}><button onClick={()=>setCreatingProjectForSite(creatingProjectForSite===site.id ? null : site.id)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer'}}>+</button><button onClick={()=>deleteSite(site.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>x</button></div>}</div>
                        {creatingProjectForSite === site.id && <form onSubmit={(e)=>createProject(e, site.id)} style={{padding:'0 20px 10px'}}><input autoFocus placeholder="Nom..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /></form>}
                        {projects.filter(p => p.site_id === site.id).map(p => (<div key={p.id} style={{padding:'8px 30px', cursor:'pointer', background: activeTab===`project-${p.id}`?'rgba(255,255,255,0.1)':'transparent'}} onClick={() => navToProject(p)}>{p.name}</div>))}
                    </div>
                ))}
                {user.role === 'admin' && <div style={{padding:'20px'}}><form onSubmit={createSite} style={{display:'flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /><button style={{background:'#f06a6a', border:'none', color:'white'}}>></button></form></div>}
                <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{width:'100%'}}>Déconnexion</button></div>
            </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="main-content" style={{flex:1, overflow:'hidden', background:'white', position:'relative'}}>
            {activeTab === 'home' && <Dashboard user={user} onOpenProject={navToProject} />}
            {activeTab === 'members' && <MembersView user={user} />}
            {activeTab === 'trash' && <TrashView />}
            {activeTab.startsWith('project-') && selectedProject && <ProjectView project={selectedProject} tasks={projectData.tasks} members={projectData.members} allUsers={allUsers} viewMode={viewMode} setViewMode={setViewMode} onAddTask={createTask} onEditTask={setEditingTask} onUpdateTask={updateTask} onDeleteProject={deleteProject} onInvite={()=>setActiveTab('members')} user={user} />}
        </div>
    </div>
  )
} 