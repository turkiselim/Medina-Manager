import { useEffect, useState } from 'react'
import Login from './Login'

const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE URL RENDER ICI

// --- MODALE TÂCHE (Standard) ---
function TaskModal({ task, projectMembers, currentUser, onClose, onUpdate }) {
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
             <button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#64748b'}}>✕</button>
        </div>
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#94a3b8', textTransform:'uppercase'}}>Description</label>
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginTop:'8px', marginBottom:'20px', border:'1px solid #e2e8f0', borderRadius:'6px'}} placeholder="Détails..." />
                
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'20px'}}>
                    <label style={{fontWeight:'bold', color:'#475569', display:'block', marginBottom:'10px'}}>✅ Sous-tâches</label>
                    {subtasks.map(st => (
                        <div key={st.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}>
                            <input type="checkbox" checked={st.is_completed} onChange={(e)=>updateSubtask({...st, is_completed:e.target.checked})} style={{cursor:'pointer'}}/>
                            <input value={st.title} onChange={(e)=>updateSubtask({...st, title:e.target.value})} style={{border:'none', background:'transparent', flex:1, textDecoration: st.is_completed?'line-through':'none', color: st.is_completed?'#94a3b8':'inherit'}} />
                            <button onClick={()=>deleteSubtask(st.id)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}>×</button>
                        </div>
                    ))}
                    <form onSubmit={addSubtask}><input placeholder="+ Étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{width:'100%', padding:'5px', border:'1px solid #cbd5e1', borderRadius:'4px', marginTop:'5px'}} /></form>
                </div>

                <div>
                    <label style={{fontWeight:'bold', color:'#475569', display:'block', marginBottom:'10px'}}>💬 Commentaires</label>
                    <div style={{background:'#f1f5f9', padding:'15px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                        {comments.length === 0 && <div style={{fontSize:'12px', color:'#aaa', textAlign:'center'}}>Aucun commentaire.</div>}
                        {comments.map(c => (
                            <div key={c.id} style={{marginBottom:'10px', background:'white', padding:'8px', borderRadius:'6px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}>
                                <div style={{fontSize:'11px', fontWeight:'bold', color:'#3b82f6', marginBottom:'2px'}}>{c.username} <span style={{color:'#aaa', fontWeight:'normal'}}>{new Date(c.created_at).toLocaleString()}</span></div>
                                <div style={{fontSize:'13px'}}>{c.content}</div>
                            </div>
                        ))}
                    </div>
                    <form onSubmit={sendComment} style={{display:'flex', gap:'10px'}}>
                        <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder="Écrire un commentaire..." style={{flex:1, padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} />
                        <button type="submit" style={{background:'#3b82f6', color:'white', border:'none', padding:'0 15px', borderRadius:'6px', cursor:'pointer'}}>Envoyer</button>
                    </form>
                </div>
            </div>
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px'}}>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>STATUT</label><select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}><option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>ASSIGNÉ À</label><select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}><option value="">-- Personne --</option>{projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}</select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>ÉCHÉANCE</label><input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} /></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>PRIORITÉ</label><select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}><option value="low">🟢 Basse</option><option value="medium">🟡 Moyenne</option><option value="high">🔴 Haute</option></select></div>
                <div><label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>PIÈCE JOINTE</label><div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}><label style={{padding:'6px 10px', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', background:'white', fontSize:'12px'}}>📎 Upload<input type="file" onChange={handleFileUpload} style={{display:'none'}} /></label>{formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{color:'#3b82f6', fontSize:'12px'}}>📄 Voir</a>}</div></div>
                <div style={{marginTop:'auto', paddingTop:'20px'}}><button onClick={handleSaveMain} style={{width:'100%', padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Enregistrer</button></div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- DASHBOARD (Avec activité globale) ---
function Dashboard({ user, onOpenProject }) {
    const [activity, setActivity] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetch(`${API_URL}/users/${user.id}/activity`).then(res=>res.json()).then(setActivity).catch(console.error);
        fetch(`${API_URL}/stats/${user.id}`).then(res=>res.json()).then(setStats).catch(console.error);
        fetch(`${API_URL}/projects`).then(res=>res.json()).then(data => setRecentProjects(data.slice(0, 4))).catch(console.error);
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f8f9fa'}}>
            <div className="dash-header">
                <div className="date-sub">{today}</div>
                <div className="greeting">Bonjour, {user.username}</div>
                <div style={{display:'flex', gap:'20px', marginTop:'20px'}}>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'bold', color:'#333'}}>{stats.pending}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase', fontWeight:'bold'}}>Tâches à faire</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'bold', color:'#333'}}>{stats.projects}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase', fontWeight:'bold'}}>Projets actifs</div>
                    </div>
                </div>
            </div>

            <div className="dash-grid">
                <div className="widget-card">
                    <div className="widget-header"><span>📢 Activité Globale (Hôtel)</span></div>
                    <div style={{flex:1}}>
                        {activity.length === 0 ? <div style={{padding:'20px', textAlign:'center', color:'#888'}}>Aucune activité. Créez votre premier projet !</div> : 
                            activity.map(t => (
                                <div key={t.id} className="task-row">
                                    <div style={{width:'30px', height:'30px', background:'#eee', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>📝</div>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px', fontWeight:'500'}}>{t.title}</div>
                                        <div style={{fontSize:'11px', color:'#888'}}>Dans {t.project_name} • {t.status}</div>
                                    </div>
                                    <div style={{fontSize:'11px', color:'#aaa'}}>{new Date(t.created_at || Date.now()).toLocaleDateString()}</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className="widget-card">
                    <div className="widget-header"><span>📂 Projets Récents</span></div>
                    <div style={{padding:'10px'}}>
                        {recentProjects.map(p => (
                            <div key={p.id} onClick={() => onOpenProject(p)} style={{padding:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', borderRadius:'6px'}} onMouseOver={e=>e.currentTarget.style.background='#f5f5f5'} onMouseOut={e=>e.currentTarget.style.background='white'}>
                                <div style={{width:'32px', height:'32px', background: '#f06a6a', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>{p.name.charAt(0).toUpperCase()}</div>
                                <div style={{fontSize:'14px', fontWeight:'500'}}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- VUE PROJET (Kanban + Liste) ---
function ProjectView({ project, tasks, members, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, user }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => { const id = e.dataTransfer.getData("taskId"); const task = tasks.find(t => t.id.toString() === id); if (task && task.status !== newStatus) onUpdateTask({ ...task, status: newStatus }); };

    return (
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{width:'40px', height:'40px', background:'#f06a6a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px', fontWeight:'bold'}}>{project.name.charAt(0)}</div>
                    <div><h1 style={{margin:0, fontSize:'20px'}}>{project.name}</h1><div style={{fontSize:'13px', color:'#888'}}>{members.length} membres</div></div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', display:'flex', padding:'2px'}}>
                        <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background: viewMode==='board'?'#eee':'white', cursor:'pointer', fontWeight: viewMode==='board'?'bold':'normal'}}>Kanban</button>
                        <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background: viewMode==='list'?'#eee':'white', cursor:'pointer', fontWeight: viewMode==='list'?'bold':'normal'}}>Liste</button>
                    </div>
                    {user.role === 'admin' && <button onClick={onInvite} style={{background:'white', border:'1px solid #ddd', padding:'6px 12px', borderRadius:'6px', cursor:'pointer'}}>👤 Inviter</button>}
                </div>
            </div>

            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'320px', background:'#f7f8f9', borderRadius:'10px', padding:'15px', border:'1px solid #e0e0e0'}}>
                            <div style={{fontSize:'12px', fontWeight:'bold', color:'#6d6e70', marginBottom:'15px', textTransform:'uppercase', display:'flex', justifyContent:'space-between'}}>
                                {status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}
                                <span style={{background:'#eee', padding:'2px 8px', borderRadius:'10px'}}>{tasks.filter(t=>t.status===status).length}</span>
                            </div>
                            {status === 'todo' && user.role === 'admin' && (
                                <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}} style={{marginBottom:'10px'}}>
                                    <input placeholder="+ Ajouter une tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid transparent', borderRadius:'8px', outline:'none', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}} />
                                </form>
                            )}
                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {tasks.filter(t=>t.status===status).map(t => {
                                    const assignee = members.find(m => m.id === t.assignee_id);
                                    return (
                                        <div key={t.id} draggable="true" onDragStart={(e)=>handleDragStart(e, t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'grab', borderLeft: `3px solid ${t.priority==='high'?'#ef4444':t.priority==='medium'?'#f59e0b':'#10b981'}`}}>
                                            <div style={{fontSize:'14px', marginBottom:'8px', fontWeight:'500'}}>{t.title}</div>
                                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                <span style={{fontSize:'11px', color:'#888', background:'#f0f0f0', padding:'2px 6px', borderRadius:'4px'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : '-'}</span>
                                                {assignee && <div className="avatar" style={{width:'24px', height:'24px', borderRadius:'50%', background:'#f06a6a', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold'}}>{assignee.username.charAt(0)}</div>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'8px', border:'1px solid #e0e0e0', overflow:'hidden'}}>
                     <table style={{width:'100%', borderCollapse:'collapse', color:'#333'}}>
                        <thead style={{background:'#f9f9f9', borderBottom:'1px solid #eee'}}>
                            <tr><th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Titre</th><th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Statut</th><th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Assigné</th><th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Date</th></tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => {
                                const assignee = members.find(m => m.id === t.assignee_id);
                                return (
                                    <tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #f5f5f5', cursor:'pointer', height:'45px'}}>
                                        <td style={{padding:'12px', fontWeight:'500'}}>{t.title}</td>
                                        <td style={{padding:'12px'}}><span style={{padding:'4px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold', background: t.status==='done'?'#dcfce7':t.status==='doing'?'#dbeafe':'#f3f4f6', color: t.status==='done'?'#166534':t.status==='doing'?'#1e40af':'#4b5563'}}>{t.status === 'todo' ? 'À faire' : t.status === 'doing' ? 'En cours' : 'Terminé'}</span></td>
                                        <td style={{padding:'12px'}}>{assignee ? assignee.username : '-'}</td>
                                        <td style={{padding:'12px', color:'#888'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                     </table>
                </div>
            )}
        </div>
    )
}

// --- VUE MEMBRES ---
function MembersView({ user }) {
    const [email, setEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const handleInvite = async (e) => { e.preventDefault(); const res = await fetch(`${API_URL}/admin/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) }); const json = await res.json(); setInviteLink(json.link.replace('http://localhost:5000', 'https://medina-app.onrender.com')); };
    return (<div style={{padding:'40px'}}><h1>Membres</h1><div style={{background:'white', padding:'30px', borderRadius:'10px', border:'1px solid #eee', maxWidth:'500px'}}><form onSubmit={handleInvite}><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" style={{padding:'10px', width:'100%', marginBottom:'10px'}} /><button type="submit" style={{width:'100%', padding:'10px', background:'#10b981', color:'white', border:'none'}}>Générer</button></form>{inviteLink && <input readOnly value={inviteLink} style={{width:'100%', marginTop:'10px', padding:'10px'}} />}</div></div>);
}

// --- APP PRINCIPALE ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(() => { const s = localStorage.getItem('hotel_user'); return s ? JSON.parse(s) : null; });
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState({ tasks: [], members: [] });
  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);

  // ÉTATS POUR LA CRÉATION
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProjectForSite, setCreatingProjectForSite] = useState(null); // ID du site où on veut créer un projet

  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); localStorage.setItem('hotel_user', JSON.stringify(usr)); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user'); };

  // Rechargement des données
  const loadData = () => {
    Promise.all([fetch(`${API_URL}/sites`).then(r=>r.json()), fetch(`${API_URL}/projects`).then(r=>r.json())])
    .then(([s, p]) => { setSites(s); setProjects(p); });
  };
  useEffect(() => { if (token) loadData(); }, [token]);

  useEffect(() => { if (selectedProject) { Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(r=>r.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(r=>r.json())]).then(([t, m]) => { setProjectData({ tasks: t, members: m }); }); } }, [selectedProject]);

  const navToProject = (p) => { setSelectedProject(p); setActiveTab(`project-${p.id}`); };
  const createTask = async (title) => { const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})}); const t = await res.json(); setProjectData({...projectData, tasks: [...projectData.tasks, t]}); };
  const updateTask = async (uT) => { setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === uT.id ? uT : t) })); await fetch(`${API_URL}/tasks/${uT.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(uT) }); };

  // --- ACTIONS DE CRÉATION DEPUIS LA SIDEBAR ---
  const createSite = async (e) => {
      e.preventDefault();
      if(!newSiteName) return;
      
      try {
          console.log("Tentative de création site:", newSiteName, "par", user.id); // Pour le debug
          
          const res = await fetch(`${API_URL}/sites`, {
              method:'POST', 
              headers:{'Content-Type':'application/json'}, 
              body:JSON.stringify({name: newSiteName, owner_id: user.id})
          });

          if (!res.ok) {
              const errorText = await res.text();
              throw new Error(errorText); // Si le serveur dit non, on déclenche l'erreur
          }

          setNewSiteName(""); 
          loadData(); // On recharge la liste
          
      } catch (err) {
          alert("Erreur lors de la création : " + err.message);
          console.error(err);
      }
  };

  const createProject = async (e, siteId) => {
      e.preventDefault(); if(!newProjectName) return;
      const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id: user.id, site_id: siteId})});
      const newProj = await res.json();
      setNewProjectName(""); setCreatingProjectForSite(null); loadData(); navToProject(newProj);
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw'}}>
        {editingTask && <TaskModal task={editingTask} projectMembers={projectData.members} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

        <div className="sidebar" style={{width:'250px', flexShrink:0, overflowY:'auto'}}>
            <div className="sidebar-header"><span style={{background:'#f06a6a', width:'24px', height:'24px', borderRadius:'6px', display:'inline-block', marginRight:'10px'}}></span>MedinaOS</div>
            <div className="sidebar-section">Général</div>
            <div className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>🏠 Accueil</div>
            {user.role === 'admin' && <div className={`nav-item ${activeTab==='members'?'active':''}`} onClick={()=>{setActiveTab('members'); setSelectedProject(null)}}>👥 Membres</div>}
            
            {/* LISTE DES SITES ET PROJETS */}
            {sites.map(site => {
                const sp = projects.filter(p => p.site_id === site.id);
                return (
                    <div key={site.id}>
                        <div className="sidebar-section" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <span>🏢 {site.name}</span>
                            {user.role === 'admin' && <button onClick={()=>setCreatingProjectForSite(creatingProjectForSite===site.id ? null : site.id)} style={{background:'none', border:'none', color:'#666', cursor:'pointer', fontWeight:'bold'}} title="Créer un projet ici">+</button>}
                        </div>
                        {/* FORMULAIRE CRÉATION PROJET (Si cliqué sur +) */}
                        {creatingProjectForSite === site.id && (
                            <form onSubmit={(e)=>createProject(e, site.id)} style={{padding:'0 20px 10px'}}>
                                <input autoFocus placeholder="Nom du projet..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'5px', fontSize:'12px', background:'#333', border:'1px solid #555', color:'white', borderRadius:'4px'}} />
                            </form>
                        )}
                        {/* LISTE DES PROJETS */}
                        {sp.map(p => (
                            <div key={p.id} className={`nav-item ${activeTab===`project-${p.id}`?'active':''}`} onClick={() => navToProject(p)}>
                                <span style={{width:'8px', height:'8px', borderRadius:'50%', background: activeTab===`project-${p.id}`?'#f06a6a':'#666'}}></span>{p.name}
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* FORMULAIRE CRÉATION SITE */}
            {user.role === 'admin' && (
                <div style={{padding:'10px 20px', marginTop:'10px', borderTop:'1px solid #333'}}>
                    <div className="sidebar-section" style={{marginTop:0, marginBottom:'5px'}}>NOUVEL ESPACE</div>
                    <form onSubmit={createSite} style={{display:'flex', gap:'5px'}}>
                        <input 
                            placeholder="Nom (ex: Cuisine)" 
                            value={newSiteName} 
                            onChange={e=>setNewSiteName(e.target.value)} 
                            style={{width:'100%', padding:'8px', background:'#222', border:'1px solid #444', color:'white', borderRadius:'4px', fontSize:'12px'}} 
                        />
                        <button type="submit" style={{background:'#f06a6a', border:'none', borderRadius:'4px', color:'white', cursor:'pointer', padding:'0 10px'}}>
                            ➜
                        </button>
                    </form>
                </div>
            )}

            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{background:'transparent', border:'1px solid #444', color:'#aaa', width:'100%', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>Déconnexion</button></div>
        </div>

        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            {activeTab === 'home' && <Dashboard user={user} onOpenProject={navToProject} />}
            {activeTab === 'members' && <MembersView user={user} />}
            {activeTab.startsWith('project-') && selectedProject && (
                <ProjectView project={selectedProject} tasks={projectData.tasks} members={projectData.members} viewMode={viewMode} setViewMode={setViewMode} onAddTask={createTask} onEditTask={setEditingTask} onUpdateTask={updateTask} onInvite={()=>setActiveTab('members')} user={user} />
            )}
        </div>
    </div>
  )
}