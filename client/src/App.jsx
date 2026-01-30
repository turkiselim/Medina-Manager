import { useEffect, useState } from 'react'
import Login from './Login'

// --- CONFIGURATION ---
const API_URL = 'https://medina-api.onrender.com'; // <--- REMPLACEZ PAR VOTRE LIEN RENDER

// --- PETITS COMPOSANTS ICONES (Pour faire pro) ---
const Icon = ({ name }) => {
    const icons = {
        trash: <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />,
        check: <path d="M20 6L9 17l-5-5" />,
        plus: <path d="M12 4v16m8-8H4" />,
        user: <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />,
        calendar: <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
        kanban: <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />,
        list: <path d="M4 6h16M4 12h16M4 18h16" />
    };
    return <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">{icons[name]}</svg>;
}

// --- SOUS-TÂCHE ---
function SubtaskItem({ subtask, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(subtask.title);

    const handleBlur = () => { setIsEditing(false); if(title !== subtask.title) onUpdate({...subtask, title}); }

    return (
        <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'6px 0', borderBottom:'1px dashed #f1f5f9'}}>
            <input type="checkbox" checked={subtask.is_completed} onChange={(e) => onUpdate({...subtask, is_completed: e.target.checked})} style={{cursor:'pointer', width:'16px', height:'16px', accentColor:'var(--primary)'}} />
            {isEditing ? (
                <input autoFocus value={title} onChange={e => setTitle(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && handleBlur()} className="input-field" style={{padding:'4px'}} />
            ) : (
                <span onClick={() => setIsEditing(true)} style={{flex:1, textDecoration: subtask.is_completed ? 'line-through' : 'none', color: subtask.is_completed ? '#94a3b8' : 'inherit', cursor:'text', fontSize:'14px'}}>
                    {subtask.title}
                </span>
            )}
            <button onClick={() => onDelete(subtask.id)} className="btn-ghost" style={{padding:'4px', color:'#ef4444'}}><Icon name="trash"/></button>
        </div>
    )
}

// --- MODALE ---
function TaskModal({ task, projectMembers, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => { fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(res => res.json()).then(setSubtasks); }, [task]);

  const handleSaveMain = () => { onUpdate(formData); onClose(); };
  
  const addSubtask = async (e) => {
      e.preventDefault(); if(!newSubtaskTitle) return;
      const res = await fetch(`${API_URL}/subtasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, title: newSubtaskTitle})});
      const json = await res.json(); setSubtasks([...subtasks, json]); setNewSubtaskTitle("");
  };

  const updateSubtask = async (updatedSt) => {
      setSubtasks(subtasks.map(st => st.id === updatedSt.id ? updatedSt : st));
      await fetch(`${API_URL}/subtasks/${updatedSt.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updatedSt)});
  };

  const deleteSubtask = async (id) => {
      setSubtasks(subtasks.filter(st => st.id !== id)); await fetch(`${API_URL}/subtasks/${id}`, { method:'DELETE' });
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{width:'800px', height:'85vh', display:'flex', flexDirection:'column', overflow:'hidden'}}>
        
        {/* Header Modale */}
        <div style={{padding:'20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input className="input-field" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'18px', fontWeight:'bold', border:'none', padding:'0'}} />
             <button onClick={onClose} className="btn-ghost" style={{fontSize:'20px'}}>✕</button>
        </div>
        
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            {/* Gauche */}
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid var(--border)'}}>
                <label className="text-muted" style={{fontSize:'12px', fontWeight:'bold', textTransform:'uppercase'}}>Description</label>
                <textarea className="input-field" value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="5" style={{marginTop:'8px', marginBottom:'25px'}} placeholder="Ajouter des détails..." />

                <div className="card" style={{padding:'20px', background:'#f8fafc', border:'none'}}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'15px'}}>
                        <label style={{fontWeight:'600'}}>Sous-tâches</label>
                        <span style={{fontSize:'12px', color:'var(--text-muted)'}}>{Math.round((subtasks.filter(s=>s.is_completed).length / (subtasks.length || 1)) * 100)}%</span>
                    </div>
                    {subtasks.length > 0 && (
                        <div style={{height:'4px', background:'#e2e8f0', borderRadius:'2px', marginBottom:'15px', overflow:'hidden'}}>
                            <div style={{height:'100%', background:'var(--success)', width:`${(subtasks.filter(s=>s.is_completed).length / subtasks.length) * 100}%`, transition:'width 0.3s'}}></div>
                        </div>
                    )}
                    {subtasks.map(st => <SubtaskItem key={st.id} subtask={st} onUpdate={updateSubtask} onDelete={deleteSubtask} />)}
                    <form onSubmit={addSubtask} style={{marginTop:'10px'}}><input className="input-field" placeholder="+ Nouvelle étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} /></form>
                </div>
            </div>

            {/* Droite */}
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'20px'}}>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'var(--text-muted)', textTransform:'uppercase'}}>Statut</label>
                    <select className="input-field" value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})}>
                        <option value="todo">À Faire</option>
                        <option value="doing">En Cours</option>
                        <option value="done">Terminé</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'var(--text-muted)', textTransform:'uppercase'}}>Assigné à</label>
                    <select className="input-field" value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})}>
                        <option value="">-- Personne --</option>
                        {projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'var(--text-muted)', textTransform:'uppercase'}}>Échéance</label>
                    <input type="date" className="input-field" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} />
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'var(--text-muted)', textTransform:'uppercase'}}>Priorité</label>
                    <select className="input-field" value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})}>
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                    </select>
                </div>
            </div>
        </div>

        <div style={{padding:'20px', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:'10px'}}>
            <button onClick={onClose} className="btn btn-secondary">Annuler</button>
            <button onClick={handleSaveMain} className="btn btn-primary">Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPALE ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  
  // Data
  const [sites, setSites] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  // UI States
  const [isProjectLoading, setIsProjectLoading] = useState(false); // Indicateur chargement
  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  
  // Inputs
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");

  // Initial Load
  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/sites`).then(res=>res.json()).then(data => {
            setSites(data);
            if(data.length > 0) setCurrentSite(data[0]);
        }).catch(err => console.error("Erreur chargement sites", err));
    }
  }, [token]);

  // Load Projects
  useEffect(() => {
    if (currentSite) {
        fetch(`${API_URL}/sites/${currentSite.id}/projects`).then(res=>res.json()).then(setProjects);
        setSelectedProject(null);
    }
  }, [currentSite]);

  // Load Tasks (avec spinner)
  useEffect(() => {
      if(selectedProject) {
          setIsProjectLoading(true); // On commence le chargement
          Promise.all([
              fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()),
              fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json())
          ]).then(([tasksData, membersData]) => {
              setTasks(tasksData);
              setMembers(membersData);
              setEditedProjectName(selectedProject.name);
              setIsProjectLoading(false); // Fini !
          });
      }
  }, [selectedProject]);

  // --- Handlers ---
  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); };
  
  const createSite = async (e) => {
      e.preventDefault(); if(!newSiteName) return;
      const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id:1})});
      const site = await res.json(); setSites([...sites, site]); setCurrentSite(site); setNewSiteName("");
  };

  const createProject = async (e) => {
      e.preventDefault(); if(!newProjectName) return;
      const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id:1, site_id: currentSite.id})});
      const proj = await res.json(); setProjects([proj, ...projects]); setNewProjectName("");
  };

  const createTask = async (e) => {
      e.preventDefault(); if(!newTaskTitle) return;
      const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title: newTaskTitle})});
      const task = await res.json(); setTasks([...tasks, task]); setNewTaskTitle("");
  };

  const inviteMember = async () => {
      const res = await fetch(`${API_URL}/projects/${selectedProject.id}/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email: inviteEmail})});
      if(res.ok) { setInviteEmail(""); setShowInviteBox(false); fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json()).then(setMembers); } 
      else { alert("Utilisateur introuvable"); }
  };

  const updateTask = async (updatedTask) => {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      await fetch(`${API_URL}/tasks/${updatedTask.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedTask) });
  };

  const saveProjectName = async () => {
      setIsEditingProjectName(false);
      if(editedProjectName !== selectedProject.name) {
          const updatedProj = {...selectedProject, name: editedProjectName};
          setSelectedProject(updatedProj);
          setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
          await fetch(`${API_URL}/projects/${updatedProj.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: editedProjectName}) });
      }
  }

  const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e, newStatus) => {
      const taskId = e.dataTransfer.getData("taskId");
      const taskToMove = tasks.find(t => t.id.toString() === taskId.toString());
      if (taskToMove && taskToMove.status !== newStatus) {
          updateTask({ ...taskToMove, status: newStatus });
      }
  }

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {editingTask && <TaskModal task={editingTask} projectMembers={members} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

      {/* TOP BAR */}
      <div style={{background:'var(--bg-sidebar)', padding:'0 20px', height:'60px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 1px 3px rgba(0,0,0,0.2)', zIndex:10}}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <div style={{fontWeight:'bold', fontSize:'20px', color:'white', display:'flex', alignItems:'center', gap:'10px'}}>
                 <span style={{background:'var(--primary)', width:'32px', height:'32px', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center'}}>M</span>
                 MedinaOS
              </div>
              <div style={{height:'24px', width:'1px', background:'#475569'}}></div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span style={{fontSize:'13px', color:'#94a3b8', fontWeight:'600', textTransform:'uppercase'}}>Hôtel</span>
                  <select className="input-field" onChange={(e) => setCurrentSite(sites.find(s => s.id == e.target.value))} value={currentSite?.id} style={{background:'#334155', color:'white', border:'1px solid #475569', padding:'6px 12px'}}>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <form onSubmit={createSite} style={{display:'inline-flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'80px', padding:'6px', background:'#0f172a', border:'1px solid #334155', borderRadius:'4px', color:'white', fontSize:'13px'}}/></form>
              </div>
          </div>
          <button onClick={() => {setToken(null); localStorage.removeItem('hotel_token')}} className="btn-ghost" style={{fontSize:'13px'}}>Déconnexion</button>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* SIDEBAR */}
          <div style={{width:'260px', background:'var(--bg-sidebar)', color:'#cbd5e1', display:'flex', flexDirection:'column', borderTop:'1px solid #334155'}}>
            <div style={{padding:'20px 15px', paddingBottom:'10px', fontSize:'11px', fontWeight:'bold', textTransform:'uppercase', color:'#64748b', letterSpacing:'1px'}}>
                Projets
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'0 10px'}}>
                {projects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProject(p)} className={`sidebar-item ${selectedProject?.id===p.id ? 'active' : ''}`}>
                        <span style={{opacity:0.6}}>#</span> {p.name}
                    </div>
                ))}
                <form onSubmit={createProject} style={{marginTop:'10px', padding:'0 5px'}}>
                    <input className="input-field" placeholder="+ Nouveau Projet" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{background:'#0f172a', border:'1px solid #334155', color:'white'}} />
                </form>
            </div>
          </div>

          {/* MAIN CANVAS */}
          <div style={{flex:1, display:'flex', flexDirection:'column', background:'var(--bg-app)', position:'relative'}}>
              {!selectedProject ? (
                  <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', flexDirection:'column', gap:'15px', color:'var(--text-muted)'}}>
                      <div style={{fontSize:'60px', opacity:0.2}}>📂</div>
                      <div style={{fontSize:'18px'}}>Sélectionnez un projet pour démarrer</div>
                  </div>
              ) : (
                  <>
                    {/* Header Projet */}
                    <div style={{padding:'20px 30px', background:'white', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        <div style={{flex:1}}>
                            {isEditingProjectName ? (
                                <input autoFocus value={editedProjectName} onChange={e=>setEditedProjectName(e.target.value)} onBlur={saveProjectName} onKeyDown={e => e.key === 'Enter' && saveProjectName()} style={{fontSize:'24px', fontWeight:'bold', padding:'5px', width:'100%', border:'1px solid var(--primary)', borderRadius:'6px', outline:'none'}} />
                            ) : (
                                <h1 onClick={()=>setIsEditingProjectName(true)} style={{margin:0, fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}>
                                    {selectedProject.name} 
                                    <span className="btn-ghost" style={{padding:'4px'}}><Icon name="plus" /></span> 
                                </h1>
                            )}
                        </div>

                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                            <div style={{position:'relative'}}>
                                <button onClick={()=>setShowInviteBox(!showInviteBox)} className="btn btn-secondary">
                                    <Icon name="user" /> Membres ({members.length})
                                </button>
                                {showInviteBox && (
                                    <div className="card" style={{position:'absolute', top:'45px', right:0, padding:'15px', width:'280px', zIndex:50}}>
                                        <h4 style={{marginTop:0, marginBottom:'10px'}}>Inviter</h4>
                                        <input className="input-field" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Email..." style={{marginBottom:'10px'}} />
                                        <button onClick={inviteMember} className="btn btn-primary" style={{width:'100%'}}>Envoyer</button>
                                    </div>
                                )}
                            </div>
                            <div style={{background:'#f1f5f9', padding:'4px', borderRadius:'8px', display:'flex', border:'1px solid var(--border)'}}>
                                <button onClick={()=>setViewMode('board')} className={`btn ${viewMode==='board'?'btn-primary':'btn-ghost'}`} style={{padding:'6px 12px', borderRadius:'6px'}}><Icon name="kanban"/> Kanban</button>
                                <button onClick={()=>setViewMode('list')} className={`btn ${viewMode==='list'?'btn-primary':'btn-ghost'}`} style={{padding:'6px 12px', borderRadius:'6px'}}><Icon name="list"/> Liste</button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT AREA */}
                    <div style={{flex:1, overflowY:'auto', padding:'30px'}}>
                        
                        {isProjectLoading ? (
                             <div style={{display:'flex', justifyContent:'center', paddingTop:'50px', color:'var(--text-muted)'}}>Chargement du projet...</div>
                        ) : (
                            <>
                            {viewMode === 'board' && (
                                <div style={{display:'flex', gap:'25px', height:'100%', alignItems:'flex-start', overflowX:'auto'}}>
                                    {['todo', 'doing', 'done'].map(status => (
                                        <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} style={{width:'350px', flexShrink:0}}>
                                            <div style={{marginBottom:'15px', fontWeight:'bold', color:'var(--text-muted)', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px', display:'flex', justifyContent:'space-between'}}>
                                                {status === 'todo' ? 'À FAIRE' : status === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                                <span style={{background:'#e2e8f0', padding:'2px 8px', borderRadius:'10px', fontSize:'11px'}}>{tasks.filter(t=>t.status===status).length}</span>
                                            </div>
                                            
                                            {status==='todo' && (
                                                <form onSubmit={createTask}>
                                                    <input className="input-field" placeholder="+ Ajouter une tâche..." value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{marginBottom:'15px'}} />
                                                </form>
                                            )}
                                            
                                            <div style={{display:'flex', flexDirection:'column', gap:'12px', minHeight:'100px'}}>
                                                {tasks.filter(t=>t.status===status).map(t => {
                                                    const assignee = members.find(m => m.id === t.assignee_id);
                                                    return (
                                                        <div key={t.id} draggable="true" onDragStart={(e) => handleDragStart(e, t.id)} onClick={()=>setEditingTask(t)} className="card" style={{padding:'16px', cursor:'grab', borderLeft: `4px solid ${t.priority==='high'?'var(--danger)':t.priority==='medium'?'var(--warning)':'var(--success)'}`}}>
                                                            <div style={{fontWeight:'600', marginBottom:'10px'}}>{t.title}</div>
                                                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                                <div style={{fontSize:'12px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'5px'}}>
                                                                    <Icon name="calendar" /> {t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : '-'}
                                                                </div>
                                                                {assignee && (
                                                                    <div style={{width:'24px', height:'24px', background:'var(--primary)', color:'white', borderRadius:'50%', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}} title={assignee.username}>
                                                                        {assignee.username.charAt(0).toUpperCase()}
                                                                    </div>
                                                                )}
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
                                <div className="card" style={{overflow:'hidden'}}>
                                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                                        <thead style={{background:'#f8fafc', borderBottom:'1px solid var(--border)'}}>
                                            <tr>
                                                <th style={{padding:'15px', textAlign:'left', fontSize:'12px', textTransform:'uppercase', color:'var(--text-muted)'}}>Titre</th>
                                                <th style={{padding:'15px', textAlign:'left', fontSize:'12px', textTransform:'uppercase', color:'var(--text-muted)'}}>Statut</th>
                                                <th style={{padding:'15px', textAlign:'left', fontSize:'12px', textTransform:'uppercase', color:'var(--text-muted)'}}>Assigné</th>
                                                <th style={{padding:'15px', textAlign:'left', fontSize:'12px', textTransform:'uppercase', color:'var(--text-muted)'}}>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tasks.map(t => {
                                                const assignee = members.find(m => m.id === t.assignee_id);
                                                return (
                                                    <tr key={t.id} onClick={()=>setEditingTask(t)} style={{cursor:'pointer', borderBottom:'1px solid #f1f5f9', transition:'background 0.2s'}}>
                                                        <td style={{padding:'15px', fontWeight:'500'}}>{t.title}</td>
                                                        <td style={{padding:'15px'}}>
                                                            <span style={{padding:'4px 10px', borderRadius:'15px', fontSize:'11px', fontWeight:'700', textTransform:'uppercase', background: t.status==='done'?'#dcfce7':t.status==='doing'?'#dbeafe':'#f1f5f9', color: t.status==='done'?'#166534':t.status==='doing'?'#1e40af':'#475569'}}>
                                                                {t.status}
                                                            </span>
                                                        </td>
                                                        <td style={{padding:'15px'}}>{assignee ? assignee.username : '-'}</td>
                                                        <td style={{padding:'15px', color:'var(--text-muted)'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            </>
                        )}
                    </div>
                  </>
              )}
          </div>
      </div>
    </div>
  )
}

export default App