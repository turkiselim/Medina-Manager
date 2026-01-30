import { useEffect, useState, useRef } from 'react'
import Login from './Login'

const API_URL = 'https://medina-api.onrender.com'; // <--- VÉRIFIEZ CECI !

// --- VUE CHRONOLOGIE (GANTT INTELLIGENT) ---
function GanttView({ tasks, onEditTask }) {
    const scrollRef = useRef(null);

    // Calculer la plage de dates (On force sur le mois en cours pour éviter le bug 2025)
    // On prend +/- 15 jours autour d'aujourd'hui, sauf si les tâches sont proches
    const getRange = () => {
        const now = new Date();
        const start = new Date(now); start.setDate(now.getDate() - 10);
        const end = new Date(now); end.setDate(now.getDate() + 20);
        return { start, end };
    };

    const { start, end } = getRange();
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        days.push(new Date(d));
    }

    // Scroll automatique vers le début
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollLeft = 0;
    }, []);

    const getStyle = (t) => {
        let s = new Date(t.start_date || Date.now());
        let e = new Date(t.due_date || s);
        
        // CORRECTION AUTO DES DATES INVERSÉES (ex: Fin en 2025)
        if (e < s) e = new Date(s); // Si la fin est avant le début, on la met au même jour
        if (s < start) s = new Date(start); // On coupe visuellement si c'est trop vieux

        const diff = Math.max(0, Math.ceil((s - start) / (1000 * 60 * 60 * 24)));
        const dur = Math.max(1, Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1);

        // Si la tâche est hors champ, on ne l'affiche pas ou on la grise
        const isVisible = (s >= start && s <= end) || (e >= start && e <= end) || (s < start && e > end);
        
        return { 
            left: `${diff * 40}px`, 
            width: `${dur * 40}px`, 
            background: t.status === 'done' ? '#10b981' : (t.priority === 'high' ? '#ef4444' : '#3b82f6'),
            opacity: isVisible ? 1 : 0.3
        };
    };

    return (
        <div style={{overflowX: 'auto', background: 'white', border: '1px solid #e0e0e0', borderRadius: '8px', height: '100%', display: 'flex', flexDirection: 'column'}} ref={scrollRef}>
            <div style={{display: 'flex', borderBottom: '1px solid #eee', position: 'sticky', top: 0, background: '#f9f9f9', zIndex: 10, minWidth:'fit-content'}}>
                <div style={{minWidth: '200px', padding: '10px', borderRight: '1px solid #eee', position: 'sticky', left: 0, background: '#f9f9f9', zIndex: 20, fontWeight: 'bold'}}>Tâche</div>
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
                        <div style={{minWidth: '200px', padding: '0 10px', borderRight: '1px solid #eee', position: 'sticky', left: 0, background: 'white', zIndex: 10, fontSize: '13px', fontWeight: '500', height: '100%', display: 'flex', alignItems: 'center', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis'}} title={t.title}>
                            {t.title}
                        </div>
                        <div style={{position: 'relative', flex: 1, height: '100%'}}>
                            <div style={{position: 'absolute', inset: 0, display: 'flex'}}>
                                {days.map((_, i) => <div key={i} style={{minWidth: '40px', borderRight: '1px solid #f9f9f9', height: '100%'}}></div>)}
                            </div>
                            <div onClick={() => onEditTask(t)} style={{...getStyle(t), position: 'absolute', top: '8px', height: '24px', borderRadius: '4px', color: 'white', fontSize: '11px', padding: '0 5px', overflow: 'hidden', cursor: 'pointer', whiteSpace: 'nowrap'}}>
                                {t.title}
                            </div>
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
      <div style={{background:'white', width:'900px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
        <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'20px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <div style={{display:'flex', gap:'10px'}}>{currentUser.role === 'admin' && <button onClick={()=>{if(confirm("Corbeille ?")) onDelete(task.id)}} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Supprimer</button>}<button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer'}}>✕</button></div>
        </div>
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <label style={{fontWeight:'bold', fontSize:'12px', color:'#888'}}>DESCRIPTION</label><textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginTop:'5px', marginBottom:'20px', border:'1px solid #ddd', borderRadius:'6px'}} />
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}><label style={{fontWeight:'bold', fontSize:'12px', color:'#888'}}>SOUS-TÂCHES</label>{subtasks.map(st => (<div key={st.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}><input type="checkbox" checked={st.is_completed} onChange={(e)=>updateSub({...st, is_completed:e.target.checked})} /><input value={st.title} onChange={(e)=>updateSub({...st, title:e.target.value})} style={{border:'none', background:'transparent', flex:1}} /><button onClick={()=>deleteSub(st.id)} style={{border:'none', color:'red', cursor:'pointer'}}>×</button></div>))}<form onSubmit={addSub}><input placeholder="+ Étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{width:'100%', padding:'5px', marginTop:'5px'}} /></form></div>
                <div><label style={{fontWeight:'bold', fontSize:'12px', color:'#888'}}>COMMENTAIRES</label><div style={{background:'#f9f9f9', padding:'10px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>{comments.map(c => (<div key={c.id} style={{marginBottom:'8px', background:'white', padding:'8px', borderRadius:'6px'}}><div style={{fontSize:'11px', fontWeight:'bold', color:'#3b82f6'}}>{c.username}</div><div>{c.content}</div></div>))}</div><form onSubmit={sendCom} style={{display:'flex', gap:'10px'}}><input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Écrire..." style={{flex:1, padding:'8px'}} /><button type="submit" style={{background:'#3b82f6', color:'white', border:'none', padding:'0 15px', borderRadius:'6px'}}>Envoyer</button></form></div>
            </div>
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px'}}>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>STATUT</label><select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>ASSIGNÉ À</label><select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="">-- Personne --</option>{allUsers.map(m => (<option key={m.id} value={m.id}>{m.username}</option>))}</select></div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>DÉBUT</label><input type="date" value={formData.start_date ? formData.start_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, start_date: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                    <div style={{flex:1}}><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>FIN</label><input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                </div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>PRIORITÉ</label><select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}><option value="low">🟢 Basse</option><option value="medium">🟡 Moyenne</option><option value="high">🔴 Haute</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#888'}}>PIÈCE JOINTE</label><div style={{marginTop:'5px'}}><label style={{padding:'5px', border:'1px solid #ccc', cursor:'pointer', background:'white'}}>📎 Upload<input type="file" onChange={uploadFile} style={{display:'none'}} /></label>{formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{marginLeft:'10px', color:'#3b82f6'}}>Voir</a>}</div></div>
                <div style={{marginTop:'auto'}}><button onClick={handleSave} style={{width:'100%', padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold'}}>Enregistrer</button></div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD (AVEC DEBUG) ---
function Dashboard({ user, onOpenProject }) {
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) return;
        const statsUrl = user.role === 'admin' ? `${API_URL}/stats/global` : `${API_URL}/stats/${user.id}`;
        const activityUrl = user.role === 'admin' ? `${API_URL}/activity/global` : `${API_URL}/users/${user.id}/activity`;

        fetch(statsUrl)
            .then(r => { if(!r.ok) throw new Error("Erreur serveur stats"); return r.json(); })
            .then(setStats)
            .catch(e => { console.error(e); setError("Impossible de charger les stats (Vérifiez server/index.js)"); });

        fetch(activityUrl).then(r=>r.json()).then(setActivity).catch(console.error);
        fetch(`${API_URL}/projects`).then(r=>r.json()).then(d => setRecentProjects(Array.isArray(d)?d.slice(0,4):[])).catch(console.error);
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f8f9fa'}}>
            <div className="dash-header" style={{padding:'40px'}}>
                <div style={{color:'#666'}}>{today}</div>
                <div style={{fontSize:'32px', fontWeight:'bold', marginBottom:'20px'}}>Bonjour, {user?.username}</div>
                
                {error && <div style={{background:'#fee2e2', color:'red', padding:'10px', marginBottom:'10px', borderRadius:'6px'}}>⚠️ {error}</div>}

                <div style={{display:'flex', gap:'20px'}}>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'30px', fontWeight:'bold', color:'#333'}}>{stats.projects}</div><div style={{fontSize:'12px', color:'#888', fontWeight:'bold'}}>PROJETS ACTIFS</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'30px', fontWeight:'bold', color:'#333'}}>{stats.pending}</div><div style={{fontSize:'12px', color:'#888', fontWeight:'bold'}}>TÂCHES EN COURS</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd', boxShadow:'0 2px 5px rgba(0,0,0,0.02)'}}>
                        <div style={{fontSize:'30px', fontWeight:'bold', color:'#10b981'}}>{stats.completed}</div><div style={{fontSize:'12px', color:'#888', fontWeight:'bold'}}>TERMINÉES</div>
                    </div>
                </div>
            </div>
            <div style={{padding:'0 40px 40px'}}>
                <h3>Activité Récente de l'Hôtel</h3>
                {activity.length === 0 ? <p style={{color:'#888', fontStyle:'italic'}}>Aucune activité récente.</p> : 
                    activity.map(t => (
                        <div key={t.id} style={{background:'white', padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                             <div>
                                 <span style={{fontWeight:'500'}}>{t.title}</span> 
                                 <span style={{fontSize:'12px', color:'#888', marginLeft:'10px'}}>
                                     {t.assignee_name ? `Assigné à ${t.assignee_name}` : 'Non assigné'} • {t.project_name}
                                 </span>
                             </div>
                             <div style={{fontSize:'12px', color:'#aaa'}}>{new Date(t.created_at).toLocaleDateString()}</div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

// --- VUE MEMBRES ---
function MembersView({ user }) {
    const [email, setEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [members, setMembers] = useState([]);
    const loadMembers = () => { fetch(`${API_URL}/users`).then(r => r.json()).then(setMembers).catch(console.error); };
    useEffect(() => { loadMembers(); }, []);
    const handleInvite = async (e) => { e.preventDefault(); const res = await fetch(`${API_URL}/admin/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) }); const json = await res.json(); setInviteLink(json.link.replace('http://localhost:5000', 'https://medina-app.onrender.com')); };
    const changeRole = async (userId, newRole) => { if (userId === user.id) { alert("Action impossible sur soi-même."); return; } await fetch(`${API_URL}/users/${userId}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) }); loadMembers(); };
    const removeUser = async (userId) => { if (!confirm("Supprimer ?")) return; await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' }); loadMembers(); };

    return (
        <div style={{padding:'40px'}}>
            <h1>RH & Équipe</h1>
            <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:'30px'}}>
                <div style={{background:'white', padding:'25px', borderRadius:'10px', border:'1px solid #eee', height:'fit-content'}}>
                    <h3>Inviter</h3>
                    <form onSubmit={handleInvite} style={{display:'flex', gap:'10px', flexDirection:'column'}}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email..." style={{padding:'10px', border:'1px solid #ccc', borderRadius:'6px'}} required /><button type="submit" style={{padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px'}}>Générer Lien</button></form>
                    {inviteLink && <div style={{marginTop:'15px', background:'#eff6ff', padding:'10px', borderRadius:'6px', fontSize:'12px', wordBreak:'break-all'}}>{inviteLink}</div>}
                </div>
                <div style={{background:'white', padding:'25px', borderRadius:'10px', border:'1px solid #eee'}}>
                    <h3>Effectif ({members.length})</h3>
                    <table style={{width:'100%', marginTop:'15px', borderCollapse:'collapse'}}>
                        <thead><tr style={{textAlign:'left', borderBottom:'2px solid #eee'}}><th style={{padding:'10px'}}>Nom</th><th style={{padding:'10px'}}>Email</th><th style={{padding:'10px'}}>Rôle</th><th></th></tr></thead>
                        <tbody>{members.map(m => (<tr key={m.id} style={{borderBottom:'1px solid #f9f9f9'}}><td style={{padding:'10px'}}>{m.username}</td><td style={{padding:'10px', color:'#666'}}>{m.email}</td><td style={{padding:'10px'}}><select value={m.role} onChange={(e)=>changeRole(m.id, e.target.value)} disabled={m.id===user.id}><option value="member">Membre</option><option value="admin">Admin</option></select></td><td style={{padding:'10px'}}>{m.id!==user.id && <button onClick={()=>removeUser(m.id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>×</button>}</td></tr>))}</tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// --- VUE PROJET ---
function ProjectView({ project, tasks, members, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => { const id = e.dataTransfer.getData("taskId"); const task = tasks.find(t => t.id.toString() === id); if (task && task.status !== newStatus) onUpdateTask({ ...task, status: newStatus }); };
    const getUserName = (id) => { const u = allUsers.find(u => u.id === id); return u ? u.username : '-'; };

    return (
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}><div style={{width:'40px', height:'40px', background:'#f06a6a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px', fontWeight:'bold'}}>{project.name.charAt(0)}</div><h1>{project.name}</h1></div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', display:'flex', padding:'2px'}}>
                        <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', background:viewMode==='board'?'#eee':'white', cursor:'pointer'}}>Kanban</button>
                        <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', background:viewMode==='list'?'#eee':'white', cursor:'pointer'}}>Liste</button>
                        <button onClick={()=>setViewMode('timeline')} style={{padding:'6px 12px', border:'none', background:viewMode==='timeline'?'#eee':'white', cursor:'pointer'}}>Chronologie</button>
                    </div>
                    {user.role === 'admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'6px 12px', borderRadius:'6px', cursor:'pointer'}}>Supprimer</button>}
                </div>
            </div>

            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'300px', background:'#f7f8f9', borderRadius:'10px', padding:'15px', border:'1px solid #e0e0e0'}}>
                            <div style={{fontWeight:'bold', marginBottom:'15px', textTransform:'uppercase', color:'#666'}}>{status}</div>
                            {status === 'todo' && user.role === 'admin' && <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}}><input placeholder="+ Tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'10px', border:'1px solid white', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', borderRadius:'6px'}} /></form>}
                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {tasks.filter(t=>t.status===status).map(t => (
                                    <div key={t.id} draggable="true" onDragStart={(e)=>handleDragStart(e, t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'grab', borderLeft: `3px solid ${t.priority==='high'?'red':'transparent'}`}}>
                                        <div style={{fontWeight:'500'}}>{t.title}</div>
                                        <div style={{fontSize:'12px', color:'#888', marginTop:'5px'}}>{getUserName(t.assignee_id)} • {t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : ''}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden'}}><table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left'}}>Titre</th><th style={{padding:'10px', textAlign:'left'}}>Statut</th><th style={{padding:'10px', textAlign:'left'}}>Assigné</th><th style={{padding:'10px', textAlign:'left'}}>Début</th><th style={{padding:'10px', textAlign:'left'}}>Fin</th></tr></thead>
                    <tbody>{tasks.map(t => (<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee', cursor:'pointer'}}><td style={{padding:'10px'}}>{t.title}</td><td style={{padding:'10px'}}>{t.status}</td><td style={{padding:'10px'}}>{getUserName(t.assignee_id)}</td><td style={{padding:'10px', color:'#888'}}>{t.start_date ? new Date(t.start_date).toLocaleDateString() : '-'}</td><td style={{padding:'10px', color:'#888'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td></tr>))}</tbody>
                </table></div>
            )}
            {viewMode === 'timeline' && <GanttView tasks={tasks} onEditTask={onEditTask} />}
        </div>
    )
}

// --- VUE CORBEILLE ---
function TrashView() {
    const [items, setItems] = useState([]);
    const loadTrash = () => { fetch(`${API_URL}/trash`).then(r=>r.json()).then(setItems).catch(console.error); };
    useEffect(() => { loadTrash(); }, []);
    const handleRestore = async (type, id) => { await fetch(`${API_URL}/restore/${type}/${id}`, { method:'PUT' }); loadTrash(); };
    const handlePermanentDelete = async (type, id) => { if(!confirm("Irréversible ?")) return; await fetch(`${API_URL}/permanent/${type}/${id}`, { method:'DELETE' }); loadTrash(); };
    return (<div style={{padding:'40px'}}><h1 style={{color:'red'}}>Corbeille</h1>{items.map((i,idx)=><div key={idx} style={{display:'flex', justifyContent:'space-between', padding:'10px', borderBottom:'1px solid #eee'}}><div>{i.title} ({i.type})</div><div><button onClick={()=>handleRestore(i.type, i.id)}>Restaurer</button><button onClick={()=>handlePermanentDelete(i.type, i.id)}>X</button></div></div>)}</div>)
}

// --- APP ---
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
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProjectForSite, setCreatingProjectForSite] = useState(null);

  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); localStorage.setItem('hotel_user', JSON.stringify(usr)); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.clear(); };

  const loadData = () => { Promise.all([fetch(`${API_URL}/sites`).then(r=>r.json()), fetch(`${API_URL}/projects`).then(r=>r.json()), fetch(`${API_URL}/users`).then(r=>r.json())]).then(([s, p, u]) => { setSites(Array.isArray(s)?s:[]); setProjects(Array.isArray(p)?p:[]); setAllUsers(Array.isArray(u)?u:[]); }).catch(console.error); };
  useEffect(() => { if (token) loadData(); }, [token]);
  useEffect(() => { if (selectedProject) { Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(r=>r.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(r=>r.json())]).then(([t, m]) => { setProjectData({ tasks: Array.isArray(t)?t:[], members: Array.isArray(m)?m:[] }); }).catch(console.error); } }, [selectedProject]);

  const navToProject = (p) => { setSelectedProject(p); setActiveTab(`project-${p.id}`); };
  const createTask = async (title) => { const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})}); const t = await res.json(); setProjectData({...projectData, tasks: [...projectData.tasks, t]}); };
  const updateTask = async (uT) => { setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === uT.id ? uT : t) })); await fetch(`${API_URL}/tasks/${uT.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(uT) }); };
  const deleteTask = async (taskId) => { await fetch(`${API_URL}/recycle/tasks/${taskId}`, { method:'PUT' }); setProjectData(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) })); setEditingTask(null); };
  const deleteProject = async (projId) => { if(!confirm("Supprimer ?")) return; await fetch(`${API_URL}/recycle/projects/${projId}`, { method:'PUT' }); loadData(); setActiveTab('home'); setSelectedProject(null); };
  const deleteSite = async (siteId) => { if(!confirm("Supprimer site ?")) return; await fetch(`${API_URL}/recycle/sites/${siteId}`, { method:'PUT' }); loadData(); };
  const createSite = async (e) => { e.preventDefault(); if(!newSiteName) return; try { const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id: user.id})}); if(!res.ok) throw new Error(await res.text()); setNewSiteName(""); loadData(); } catch(err){ alert(err.message); } };
  const createProject = async (e, siteId) => { e.preventDefault(); if(!newProjectName) return; const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id: user.id, site_id: siteId})}); const newProj = await res.json(); setNewProjectName(""); setCreatingProjectForSite(null); loadData(); navToProject(newProj); };

  if (!token || !user) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw'}}>
        {editingTask && <TaskModal task={editingTask} allUsers={allUsers} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}
        <div className="sidebar" style={{width:'250px', flexShrink:0, overflowY:'auto', background:'#1e1f21', color:'white'}}>
            <div style={{padding:'20px', fontWeight:'bold', fontSize:'18px'}}>MedinaOS</div>
            <div style={{padding:'10px 20px', cursor:'pointer', background: activeTab==='home'?'rgba(255,255,255,0.1)':'transparent'}} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>🏠 Accueil</div>
            {user.role === 'admin' && <><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('members'); setSelectedProject(null)}}>👥 Membres</div><div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('trash'); setSelectedProject(null)}}>🗑️ Corbeille</div></>}
            {sites.map(site => (<div key={site.id}><div style={{padding:'10px 20px', display:'flex', justifyContent:'space-between', color:'#888', fontSize:'12px', textTransform:'uppercase', marginTop:'10px'}}><span>{site.name}</span>{user.role === 'admin' && <div style={{display:'flex', gap:'5px'}}><button onClick={()=>setCreatingProjectForSite(creatingProjectForSite===site.id ? null : site.id)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer'}}>+</button><button onClick={()=>deleteSite(site.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>x</button></div>}</div>{creatingProjectForSite === site.id && <form onSubmit={(e)=>createProject(e, site.id)} style={{padding:'0 20px 10px'}}><input autoFocus placeholder="Nom..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /></form>}{projects.filter(p => p.site_id === site.id).map(p => (<div key={p.id} style={{padding:'8px 30px', cursor:'pointer', background: activeTab===`project-${p.id}`?'rgba(255,255,255,0.1)':'transparent'}} onClick={() => navToProject(p)}>{p.name}</div>))}</div>))}
            {user.role === 'admin' && <div style={{padding:'20px'}}><form onSubmit={createSite} style={{display:'flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /><button style={{background:'#f06a6a', border:'none', color:'white'}}>></button></form></div>}
            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{width:'100%'}}>Déconnexion</button></div>
        </div>
        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            {activeTab === 'home' && <Dashboard user={user} onOpenProject={navToProject} />}
            {activeTab === 'members' && <MembersView user={user} />}
            {activeTab === 'trash' && <TrashView />}
            {activeTab.startsWith('project-') && selectedProject && <ProjectView project={selectedProject} tasks={projectData.tasks} members={projectData.members} allUsers={allUsers} viewMode={viewMode} setViewMode={setViewMode} onAddTask={createTask} onEditTask={setEditingTask} onUpdateTask={updateTask} onDeleteProject={deleteProject} onInvite={()=>setActiveTab('members')} user={user} />}
        </div>
    </div>
  )
}