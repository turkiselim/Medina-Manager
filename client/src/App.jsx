import { useEffect, useState } from 'react'
import Login from './Login'

// --- CONFIGURATION ---
const API_URL = 'https://medina-api.onrender.com'; // <--- METTEZ VOTRE VRAI CODE RENDER ICI

// --- VUE CORBEILLE ---
function TrashView() {
    const [items, setItems] = useState([]);
    const loadTrash = () => { fetch(`${API_URL}/trash`).then(r=>r.json()).then(setItems).catch(console.error); };
    useEffect(() => { loadTrash(); }, []);
    const handleRestore = async (type, id) => { await fetch(`${API_URL}/restore/${type}/${id}`, { method:'PUT' }); loadTrash(); };
    const handlePermanentDelete = async (type, id) => { if(!confirm("Irréversible. Confirmer ?")) return; await fetch(`${API_URL}/permanent/${type}/${id}`, { method:'DELETE' }); loadTrash(); };

    return (
        <div style={{padding:'40px'}}>
            <h1 style={{color:'#ef4444'}}>🗑️ Corbeille</h1>
            <div style={{marginTop:'20px'}}>
                {items.length === 0 && <p style={{color:'#888'}}>Corbeille vide.</p>}
                {items.map((item, idx) => (
                    <div key={idx} style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', padding:'15px', borderBottom:'1px solid #eee'}}>
                        <div><b>{item.title}</b> <span style={{fontSize:'12px', background:'#eee', padding:'2px 6px', borderRadius:'4px'}}>{item.type}</span></div>
                        <div>
                            <button onClick={()=>handleRestore(item.type, item.id)} style={{background:'#10b981', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', marginRight:'5px', cursor:'pointer'}}>Restaurer</button>
                            <button onClick={()=>handlePermanentDelete(item.type, item.id)} style={{background:'#ef4444', color:'white', border:'none', padding:'5px 10px', borderRadius:'4px', cursor:'pointer'}}>X</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// --- MODALE TÂCHE ---
function TaskModal({ task, projectMembers, currentUser, onClose, onUpdate, onDelete }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
      fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(res => res.json()).then(setSubtasks).catch(console.error);
      fetch(`${API_URL}/tasks/${task.id}/comments`).then(res => res.json()).then(setComments).catch(console.error);
  }, [task]);

  const handleSaveMain = () => { onUpdate(formData); onClose(); };
  const addSubtask = async (e) => { e.preventDefault(); if(!newSubtaskTitle) return; const res = await fetch(`${API_URL}/subtasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, title: newSubtaskTitle})}); const json = await res.json(); setSubtasks([...subtasks, json]); setNewSubtaskTitle(""); };
  const updateSubtask = async (u) => { setSubtasks(subtasks.map(s => s.id === u.id ? u : s)); await fetch(`${API_URL}/subtasks/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(u)}); };
  const deleteSubtask = async (id) => { setSubtasks(subtasks.filter(s => s.id !== id)); await fetch(`${API_URL}/subtasks/${id}`, { method:'DELETE' }); };
  const sendComment = async (e) => { e.preventDefault(); if(!newComment) return; const res = await fetch(`${API_URL}/comments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, user_id: currentUser.id, content: newComment})}); const json = await res.json(); setComments([json, ...comments]); setNewComment(""); };
  const handleFileUpload = async (e) => { const f = e.target.files[0]; if (!f) return; const d = new FormData(); d.append('file', f); try { const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: d }); const j = await res.json(); setFormData({ ...formData, attachment_url: j.url }); } catch (err) { alert("Erreur upload"); } };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(2px)'}}>
      <div style={{background:'white', width:'900px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)'}}>
        <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'20px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <div style={{display:'flex', gap:'10px'}}>
                 {currentUser.role === 'admin' && <button onClick={()=>{if(confirm("Corbeille ?")) onDelete(task.id)}} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>Supprimer</button>}
                 <button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#64748b'}}>✕</button>
             </div>
        </div>
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginBottom:'20px', border:'1px solid #e2e8f0', borderRadius:'6px'}} placeholder="Description..." />
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', marginBottom:'20px'}}>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>✅ Sous-tâches</label>
                    {subtasks.map(st => (<div key={st.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}><input type="checkbox" checked={st.is_completed} onChange={(e)=>updateSubtask({...st, is_completed:e.target.checked})} /><input value={st.title} onChange={(e)=>updateSubtask({...st, title:e.target.value})} style={{border:'none', background:'transparent', flex:1}} /><button onClick={()=>deleteSubtask(st.id)} style={{border:'none', color:'#ef4444', cursor:'pointer'}}>×</button></div>))}
                    <form onSubmit={addSubtask}><input placeholder="+ Étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{width:'100%', padding:'5px', marginTop:'5px'}} /></form>
                </div>
                <div>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>💬 Commentaires</label>
                    <div style={{background:'#f1f5f9', padding:'15px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                        {comments.map(c => (<div key={c.id} style={{marginBottom:'10px', background:'white', padding:'8px', borderRadius:'6px'}}><div style={{fontSize:'11px', fontWeight:'bold', color:'#3b82f6'}}>{c.username}</div><div>{c.content}</div></div>))}
                    </div>
                    <form onSubmit={sendComment} style={{display:'flex', gap:'10px'}}><input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Commentaire..." style={{flex:1, padding:'8px'}} /><button type="submit" style={{background:'#3b82f6', color:'white', border:'none', padding:'0 15px', borderRadius:'6px'}}>Envoyer</button></form>
                </div>
            </div>
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px'}}>
                <div><label>STATUT</label><select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option></select></div>
                <div><label>ASSIGNÉ À</label><select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px'}}><option value="">-- Personne --</option>{projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}</select></div>
                <div><label>ÉCHÉANCE</label><input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px'}} /></div>
                <div><label>PIÈCE JOINTE</label><div style={{marginTop:'5px'}}><label style={{padding:'5px', border:'1px solid #ccc', cursor:'pointer', background:'white'}}>📎 Upload<input type="file" onChange={handleFileUpload} style={{display:'none'}} /></label>{formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{marginLeft:'10px', color:'#3b82f6'}}>Voir</a>}</div></div>
                <div style={{marginTop:'auto'}}><button onClick={handleSaveMain} style={{width:'100%', padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px'}}>Enregistrer</button></div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD (C'EST LA PIÈCE QUI MANQUAIT !) ---
function Dashboard({ user, onOpenProject }) {
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetch(`${API_URL}/users/${user.id}/activity`).then(r=>r.json()).then(d => setActivity(Array.isArray(d)?d:[])).catch(console.error);
        fetch(`${API_URL}/stats/${user.id}`).then(r=>r.json()).then(setStats).catch(console.error);
        fetch(`${API_URL}/projects`).then(r=>r.json()).then(d => setRecentProjects(Array.isArray(d)?d.slice(0,4):[])).catch(console.error);
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f8f9fa'}}>
            <div className="dash-header" style={{padding:'40px'}}>
                <div style={{color:'#666'}}>{today}</div>
                <div style={{fontSize:'32px', fontWeight:'bold', marginBottom:'20px'}}>Bonjour, {user?.username}</div>
                <div style={{display:'flex', gap:'20px'}}>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd'}}>
                        <div style={{fontSize:'30px', fontWeight:'bold'}}>{stats.pending}</div><div style={{fontSize:'12px', color:'#888'}}>TÂCHES À FAIRE</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', flex:1, textAlign:'center', border:'1px solid #ddd'}}>
                        <div style={{fontSize:'30px', fontWeight:'bold'}}>{stats.projects}</div><div style={{fontSize:'12px', color:'#888'}}>PROJETS ACTIFS</div>
                    </div>
                </div>
            </div>
            <div style={{padding:'0 40px 40px'}}>
                <h3>Activité Récente</h3>
                {activity.length === 0 ? <p style={{color:'#888'}}>Aucune activité récente.</p> : 
                    activity.map(t => (
                        <div key={t.id} style={{background:'white', padding:'15px', borderBottom:'1px solid #eee', display:'flex', justifyContent:'space-between'}}>
                             <div><b>{t.title}</b> <span style={{fontSize:'12px', color:'#888'}}>dans {t.project_name}</span></div>
                             <div style={{fontSize:'12px', color:'#aaa'}}>{new Date(t.created_at || Date.now()).toLocaleDateString()}</div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

// --- VUE PROJET ---
function ProjectView({ project, tasks, members, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => { const id = e.dataTransfer.getData("taskId"); const task = tasks.find(t => t.id.toString() === id); if (task && task.status !== newStatus) onUpdateTask({ ...task, status: newStatus }); };

    return (
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h1>{project.name}</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px'}}>Kanban</button>
                    <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px'}}>Liste</button>
                    {user.role === 'admin' && <button onClick={onInvite} style={{background:'#f3f4f6', border:'1px solid #ddd', padding:'6px 12px'}}>Inviter</button>}
                    {user.role === 'admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'6px 12px'}}>Supprimer</button>}
                </div>
            </div>

            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'300px', background:'#f7f8f9', borderRadius:'10px', padding:'15px'}}>
                            <div style={{fontWeight:'bold', marginBottom:'15px', textTransform:'uppercase'}}>{status}</div>
                            {status === 'todo' && user.role === 'admin' && <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}}><input placeholder="+ Tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', marginBottom:'10px'}} /></form>}
                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {tasks.filter(t=>t.status===status).map(t => (
                                    <div key={t.id} draggable="true" onDragStart={(e)=>handleDragStart(e, t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'grab'}}>
                                        {t.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {viewMode === 'list' && (
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                    <thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left'}}>Titre</th><th style={{padding:'10px', textAlign:'left'}}>Statut</th><th style={{padding:'10px', textAlign:'left'}}>Assigné</th></tr></thead>
                    <tbody>
                        {tasks.map(t => {
                            const assignee = members.find(m => m.id === t.assignee_id);
                            return (
                                <tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee', cursor:'pointer'}}>
                                    <td style={{padding:'10px'}}>{t.title}</td>
                                    <td style={{padding:'10px'}}>{t.status}</td>
                                    <td style={{padding:'10px'}}>{assignee ? assignee.username : '-'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}

// --- VUE MEMBRES (ANNUAIRE RH) ---
function MembersView({ user }) {
    const [email, setEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [members, setMembers] = useState([]);

    // Charger la liste des membres
    const loadMembers = () => {
        fetch(`${API_URL}/users`).then(r => r.json()).then(setMembers).catch(console.error);
    };

    useEffect(() => { loadMembers(); }, []);

    const handleInvite = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/admin/invite`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const json = await res.json();
        setInviteLink(json.link.replace('http://localhost:5000', 'https://medina-app.onrender.com'));
    };

    const changeRole = async (userId, newRole) => {
        if (userId === user.id) { alert("Vous ne pouvez pas modifier vos propres droits ici."); return; }
        const res = await fetch(`${API_URL}/users/${userId}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole }) });
        if (res.ok) {
            alert("Droits mis à jour !");
            loadMembers(); // Rafraîchir la liste
        }
    };

    const removeUser = async (userId) => {
        if (!confirm("Voulez-vous vraiment retirer cet utilisateur de l'hôtel ?")) return;
        await fetch(`${API_URL}/users/${userId}`, { method: 'DELETE' });
        loadMembers();
    };

    return (
        <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '30px' }}>Gestion des Ressources Humaines</h1>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                
                {/* BLOC 1 : INVITER */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '10px', border: '1px solid #eee', height: 'fit-content' }}>
                    <h3 style={{ marginTop: 0 }}>📩 Inviter un collaborateur</h3>
                    <p style={{ fontSize: '13px', color: '#666' }}>Générez un lien unique pour permettre à un employé de créer son compte.</p>
                    <form onSubmit={handleInvite} style={{ display: 'flex', gap: '10px', flexDirection: 'column', marginTop: '15px' }}>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@medina.tn" style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '6px' }} required />
                        <button type="submit" style={{ padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Générer le lien</button>
                    </form>
                    {inviteLink && <div style={{ marginTop: '15px', background: '#eff6ff', padding: '10px', borderRadius: '6px', border: '1px solid #bfdbfe', fontSize: '12px', wordBreak: 'break-all' }}><strong>Lien :</strong> {inviteLink}</div>}
                </div>

                {/* BLOC 2 : LISTE DU PERSONNEL */}
                <div style={{ background: 'white', padding: '25px', borderRadius: '10px', border: '1px solid #eee' }}>
                    <h3 style={{ marginTop: 0 }}>👥 L'Équipe ({members.length})</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f3f4f6', textAlign: 'left' }}>
                                    <th style={{ padding: '10px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Nom</th>
                                    <th style={{ padding: '10px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Email</th>
                                    <th style={{ padding: '10px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Rôle / Droits</th>
                                    <th style={{ padding: '10px', fontSize: '12px', color: '#888', textTransform: 'uppercase' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map(m => (
                                    <tr key={m.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                                        <td style={{ padding: '15px 10px', fontWeight: '500' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: m.role === 'admin' ? '#f06a6a' : '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                                                    {m.username.charAt(0).toUpperCase()}
                                                </div>
                                                {m.username} {m.id === user.id && <span style={{ fontSize: '10px', color: '#aaa' }}>(Vous)</span>}
                                            </div>
                                        </td>
                                        <td style={{ padding: '10px', color: '#666', fontSize: '14px' }}>{m.email}</td>
                                        <td style={{ padding: '10px' }}>
                                            <select 
                                                value={m.role} 
                                                onChange={(e) => changeRole(m.id, e.target.value)}
                                                disabled={m.id === user.id} // On ne peut pas se modifier soi-même pour éviter de se bloquer
                                                style={{ 
                                                    padding: '5px 10px', 
                                                    borderRadius: '20px', 
                                                    border: '1px solid #e5e7eb', 
                                                    background: m.role === 'admin' ? '#fef2f2' : '#eff6ff',
                                                    color: m.role === 'admin' ? '#ef4444' : '#3b82f6',
                                                    fontWeight: 'bold',
                                                    fontSize: '12px',
                                                    cursor: m.id === user.id ? 'not-allowed' : 'pointer'
                                                }}
                                            >
                                                <option value="member">Membre (Lecture/Écriture)</option>
                                                <option value="admin">Admin (Contrôle Total)</option>
                                            </select>
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {m.id !== user.id && (
                                                <button onClick={() => removeUser(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '18px' }} title="Supprimer">×</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- APP PRINCIPALE (Avec correction de sécurité) ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  
  // SÉCURITÉ ANTI-CRASH JSON
  const [user, setUser] = useState(() => {
      try {
          const s = localStorage.getItem('hotel_user');
          return s && s !== "undefined" ? JSON.parse(s) : null;
      } catch { return null; }
  });

  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
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

  const loadData = () => { Promise.all([fetch(`${API_URL}/sites`).then(r=>r.json()), fetch(`${API_URL}/projects`).then(r=>r.json())]).then(([s, p]) => { setSites(Array.isArray(s)?s:[]); setProjects(Array.isArray(p)?p:[]); }).catch(console.error); };
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
        {editingTask && <TaskModal task={editingTask} projectMembers={projectData.members} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} onDelete={deleteTask} />}

        <div className="sidebar" style={{width:'250px', flexShrink:0, overflowY:'auto', background:'#1e1f21', color:'white'}}>
            <div style={{padding:'20px', fontWeight:'bold', fontSize:'18px'}}>MedinaOS</div>
            <div style={{padding:'10px 20px', cursor:'pointer', background: activeTab==='home'?'rgba(255,255,255,0.1)':'transparent'}} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>🏠 Accueil</div>
            {user.role === 'admin' && (
                <>
                    <div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('members'); setSelectedProject(null)}}>👥 Membres</div>
                    <div style={{padding:'10px 20px', cursor:'pointer'}} onClick={()=>{setActiveTab('trash'); setSelectedProject(null)}}>🗑️ Corbeille</div>
                </>
            )}
            
            {sites.map(site => (
                <div key={site.id}>
                    <div style={{padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#888', fontSize:'12px', textTransform:'uppercase', marginTop:'10px'}}>
                        <span>{site.name}</span>
                        {user.role === 'admin' && <div style={{display:'flex', gap:'5px'}}><button onClick={()=>setCreatingProjectForSite(creatingProjectForSite===site.id ? null : site.id)} style={{background:'none', border:'none', color:'#ccc', cursor:'pointer'}}>+</button><button onClick={()=>deleteSite(site.id)} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}>x</button></div>}
                    </div>
                    {creatingProjectForSite === site.id && <form onSubmit={(e)=>createProject(e, site.id)} style={{padding:'0 20px 10px'}}><input autoFocus placeholder="Nom..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /></form>}
                    {projects.filter(p => p.site_id === site.id).map(p => (
                        <div key={p.id} style={{padding:'8px 30px', cursor:'pointer', background: activeTab===`project-${p.id}`?'rgba(255,255,255,0.1)':'transparent'}} onClick={() => navToProject(p)}>{p.name}</div>
                    ))}
                </div>
            ))}

            {user.role === 'admin' && <div style={{padding:'20px'}}><form onSubmit={createSite} style={{display:'flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'100%', padding:'5px', background:'#333', border:'none', color:'white'}} /><button style={{background:'#f06a6a', border:'none', color:'white'}}>></button></form></div>}
            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{width:'100%'}}>Déconnexion</button></div>
        </div>

        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            {activeTab === 'home' && <Dashboard user={user} onOpenProject={navToProject} />}
            {activeTab === 'members' && <MembersView user={user} />}
            {activeTab === 'trash' && <TrashView />}
            {activeTab.startsWith('project-') && selectedProject && (
                <ProjectView project={selectedProject} tasks={projectData.tasks} members={projectData.members} viewMode={viewMode} setViewMode={setViewMode} onAddTask={createTask} onEditTask={setEditingTask} onUpdateTask={updateTask} onDeleteProject={deleteProject} onInvite={()=>setActiveTab('members')} user={user} />
            )}
        </div>
    </div>
  )
}