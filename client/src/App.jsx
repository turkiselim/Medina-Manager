import { useEffect, useState } from 'react'
import Login from './Login'

// --- CONFIGURATION ---
const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE BACKEND
const SITE_URL = 'https://medina-app.onrender.com'; // <--- VOTRE FRONTEND (SITE WEB)

// --- MODALE TÂCHE (AVEC COMMENTAIRES) ---
function TaskModal({ task, projectMembers, currentUser, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]); // Nouveau : Commentaires
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
      fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(res => res.json()).then(setSubtasks).catch(e=>console.log(e));
      fetch(`${API_URL}/tasks/${task.id}/comments`).then(res => res.json()).then(setComments).catch(e=>console.log(e));
  }, [task]);

  const handleSaveMain = () => { onUpdate(formData); onClose(); };

  // Logique Sous-tâches (inchangée)
  const addSubtask = async (e) => { e.preventDefault(); if(!newSubtaskTitle) return; const res = await fetch(`${API_URL}/subtasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, title: newSubtaskTitle})}); const json = await res.json(); setSubtasks([...subtasks, json]); setNewSubtaskTitle(""); };
  const updateSubtask = async (updatedSt) => { setSubtasks(subtasks.map(st => st.id === updatedSt.id ? updatedSt : st)); await fetch(`${API_URL}/subtasks/${updatedSt.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updatedSt)}); };
  const deleteSubtask = async (id) => { setSubtasks(subtasks.filter(st => st.id !== id)); await fetch(`${API_URL}/subtasks/${id}`, { method:'DELETE' }); };

  // Logique Commentaires (NOUVEAU)
  const sendComment = async (e) => {
      e.preventDefault(); if(!newComment) return;
      const res = await fetch(`${API_URL}/comments`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, user_id: currentUser.id, content: newComment})});
      const json = await res.json();
      setComments([json, ...comments]); // Ajoute en haut
      setNewComment("");
  };

  const handleFileUpload = async (e) => {
      const file = e.target.files[0]; if (!file) return;
      const data = new FormData(); data.append('file', file);
      try { const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: data }); const json = await res.json(); setFormData({ ...formData, attachment_url: json.url }); } catch (err) { alert("Erreur upload"); }
  };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
      <div style={{background:'white', width:'900px', height:'90vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
        
        <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'20px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#64748b'}}>✕</button>
        </div>
        
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            {/* GAUCHE : Description, Sous-tâches, Commentaires */}
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#94a3b8', textTransform:'uppercase'}}>Description</label>
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="3" style={{width:'100%', padding:'10px', marginTop:'8px', marginBottom:'20px', border:'1px solid #e2e8f0', borderRadius:'6px'}} placeholder="Détails..." />

                {/* Sous-tâches */}
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

                {/* Commentaires (CHAT) */}
                <div style={{marginTop:'20px'}}>
                    <label style={{fontWeight:'bold', color:'#475569', display:'block', marginBottom:'10px'}}>💬 Commentaires</label>
                    <div style={{background:'#f1f5f9', padding:'15px', borderRadius:'8px', maxHeight:'200px', overflowY:'auto', marginBottom:'10px'}}>
                        {comments.length === 0 && <div style={{fontSize:'12px', color:'#aaa', textAlign:'center'}}>Aucun commentaire. Écrivez quelque chose...</div>}
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

            {/* DROITE : Attributs */}
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'15px'}}>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>STATUT</label>
                    <select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                        <option value="todo">À Faire</option><option value="doing">En Cours</option><option value="done">Terminé</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>ASSIGNÉ À</label>
                    <select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                        <option value="">-- Personne --</option>
                        {projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>ÉCHÉANCE</label>
                    <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} />
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b'}}>PIÈCE JOINTE</label>
                    <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                        <label style={{padding:'6px 10px', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', background:'white', fontSize:'12px'}}>📎 Upload<input type="file" onChange={handleFileUpload} style={{display:'none'}} /></label>
                        {formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{color:'#3b82f6', fontSize:'12px'}}>📄 Voir</a>}
                    </div>
                </div>
                <div style={{marginTop:'auto', paddingTop:'20px', display:'flex', gap:'10px'}}>
                     <button onClick={handleSaveMain} style={{width:'100%', padding:'10px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Enregistrer</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// --- VUE MEMBRES (ADMIN ONLY) ---
function MembersView({ user }) {
    const [email, setEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");

    const handleInvite = async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/admin/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email}) });
        const json = await res.json();
        // On remplace le lien local par le lien du site si besoin
        const finalLink = json.link.replace('http://localhost:5000', SITE_URL);
        setInviteLink(finalLink);
    };

    if (user.role !== 'admin') return <div style={{padding:'40px'}}>⛔ Accès réservé à la Direction.</div>;

    return (
        <div style={{padding:'40px'}}>
            <h1>Gestion des Membres</h1>
            <p>Invitez vos collaborateurs en générant un lien unique.</p>
            
            <div style={{background:'white', padding:'30px', borderRadius:'10px', border:'1px solid #eee', maxWidth:'500px', marginTop:'20px'}}>
                <h3>Envoyer une invitation</h3>
                <form onSubmit={handleInvite} style={{display:'flex', gap:'10px', flexDirection:'column'}}>
                    <label>Email du collaborateur</label>
                    <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="employe@medina.tn" style={{padding:'10px', border:'1px solid #ccc', borderRadius:'6px'}} required />
                    <button type="submit" style={{padding:'10px', background:'#10b981', color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontWeight:'bold'}}>Générer le lien d'invitation</button>
                </form>

                {inviteLink && (
                    <div style={{marginTop:'20px', background:'#f0fdf4', padding:'15px', borderRadius:'6px', border:'1px solid #bbf7d0'}}>
                        <div style={{fontWeight:'bold', color:'#166534', marginBottom:'5px'}}>✅ Lien généré !</div>
                        <div style={{fontSize:'12px', marginBottom:'10px'}}>Copiez ce lien et envoyez-le par WhatsApp ou Email :</div>
                        <input readOnly value={inviteLink} style={{width:'100%', padding:'10px', border:'1px solid #ccc', borderRadius:'4px', background:'white'}} />
                    </div>
                )}
            </div>
        </div>
    );
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

  // Login/Logout
  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); localStorage.setItem('hotel_user', JSON.stringify(usr)); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user'); };

  useEffect(() => {
    if (token) {
        Promise.all([fetch(`${API_URL}/sites`).then(res=>res.json()), fetch(`${API_URL}/projects`).then(res=>res.json())])
        .then(([s, p]) => { setSites(s); setProjects(p); }).catch(e=>console.error(e));
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
        Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json())])
        .then(([t, m]) => { setProjectData({ tasks: t, members: m }); });
    }
  }, [selectedProject]);

  const navToProject = (p) => { setSelectedProject(p); setActiveTab(`project-${p.id}`); };
  const createTask = async (title) => { const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})}); const t = await res.json(); setProjectData({...projectData, tasks: [...projectData.tasks, t]}); };
  const updateTask = async (uT) => { setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === uT.id ? uT : t) })); await fetch(`${API_URL}/tasks/${uT.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(uT) }); };

  // Drag & Drop
  const handleDragStart = (e, id) => e.dataTransfer.setData("taskId", id);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, status) => { const id = e.dataTransfer.getData("taskId"); const task = projectData.tasks.find(t => t.id.toString() === id); if (task && task.status !== status) updateTask({ ...task, status }); };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw'}}>
        {editingTask && <TaskModal task={editingTask} projectMembers={projectData.members} currentUser={user} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

        {/* SIDEBAR */}
        <div className="sidebar" style={{width:'240px', flexShrink:0}}>
            <div className="sidebar-header"><span style={{background:'#f06a6a', width:'24px', height:'24px', borderRadius:'6px', display:'inline-block', marginRight:'10px'}}></span>MedinaOS</div>
            <div className="sidebar-section">Général</div>
            <div className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>🏠 Accueil</div>
            
            {/* BOUTON MEMBRES (ADMIN SEULEMENT) */}
            {user.role === 'admin' && (
                <div className={`nav-item ${activeTab==='members'?'active':''}`} onClick={()=>{setActiveTab('members'); setSelectedProject(null)}}>👥 Membres</div>
            )}

            {sites.map(site => {
                const sp = projects.filter(p => p.site_id === site.id);
                if (sp.length === 0) return null;
                return (
                    <div key={site.id}>
                        <div className="sidebar-section">🏢 {site.name}</div>
                        {sp.map(p => (
                            <div key={p.id} className={`nav-item ${activeTab===`project-${p.id}`?'active':''}`} onClick={() => navToProject(p)}>
                                <span style={{width:'8px', height:'8px', borderRadius:'50%', background: activeTab===`project-${p.id}`?'#f06a6a':'#666'}}></span>{p.name}
                            </div>
                        ))}
                    </div>
                );
            })}
            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{background:'transparent', border:'1px solid #444', color:'#aaa', width:'100%', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>Déconnexion</button></div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            {activeTab === 'home' && <div style={{padding:'40px'}}><h1>Bienvenue {user.username}</h1></div>}
            
            {/* VUE MEMBRES */}
            {activeTab === 'members' && <MembersView user={user} />}

            {/* VUE PROJET */}
            {activeTab.startsWith('project-') && selectedProject && (
                <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                        <h1 style={{margin:0}}>{selectedProject.name}</h1>
                        <div style={{display:'flex', gap:'10px'}}>
                             {/* BOUTON VUES */}
                            <div style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', display:'flex', padding:'2px'}}>
                                <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', background:viewMode==='board'?'#eee':'white', cursor:'pointer'}}>Kanban</button>
                                <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', background:viewMode==='list'?'#eee':'white', cursor:'pointer'}}>Liste</button>
                            </div>
                        </div>
                    </div>

                    {/* VUE KANBAN */}
                    {viewMode === 'board' && (
                        <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                            {['todo', 'doing', 'done'].map(status => (
                                <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'320px', background:'#f7f8f9', borderRadius:'10px', padding:'15px', border:'1px solid #e0e0e0'}}>
                                    <div style={{fontWeight:'bold', color:'#6d6e70', marginBottom:'15px', textTransform:'uppercase'}}>{status}</div>
                                    
                                    {/* INPUT CREATION (ADMIN SEULEMENT) */}
                                    {status === 'todo' && user.role === 'admin' && (
                                        <form onSubmit={(e)=>{e.preventDefault(); const t=e.target.elements[0].value; if(t) createTask(t); e.target.reset();}} style={{marginBottom:'10px'}}>
                                            <input placeholder="+ Tâche (Admin)" style={{width:'100%', padding:'10px', border:'1px solid transparent', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}} />
                                        </form>
                                    )}

                                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                        {projectData.tasks.filter(t=>t.status===status).map(t => (
                                            <div key={t.id} draggable="true" onDragStart={(e)=>handleDragStart(e, t.id)} onClick={()=>setEditingTask(t)} style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'grab', borderLeft: `3px solid ${t.priority==='high'?'#ef4444':'transparent'}`}}>
                                                <div style={{fontWeight:'500'}}>{t.title}</div>
                                                <div style={{fontSize:'12px', color:'#888', marginTop:'5px'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
  )
}