import { useEffect, useState } from 'react'
import Login from './Login'

const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE URL ICI

// --- COMPOSANT SOUS-TÂCHE (LIGNE ÉDITABLE) ---
function SubtaskItem({ subtask, onUpdate, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(subtask.title);

    const handleBlur = () => {
        setIsEditing(false);
        if(title !== subtask.title) onUpdate({...subtask, title});
    }

    return (
        <div style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0'}}>
            <input 
                type="checkbox" 
                checked={subtask.is_completed} 
                onChange={(e) => onUpdate({...subtask, is_completed: e.target.checked})}
                style={{cursor:'pointer', width:'16px', height:'16px'}}
            />
            {isEditing ? (
                <input 
                    autoFocus
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    onBlur={handleBlur}
                    onKeyDown={e => e.key === 'Enter' && handleBlur()}
                    style={{flex:1, padding:'5px'}}
                />
            ) : (
                <span 
                    onClick={() => setIsEditing(true)} 
                    style={{flex:1, textDecoration: subtask.is_completed ? 'line-through' : 'none', color: subtask.is_completed ? '#aaa' : 'black', cursor:'text'}}
                >
                    {subtask.title}
                </span>
            )}
            <button onClick={() => onDelete(subtask.id)} style={{border:'none', background:'transparent', color:'#e53935', cursor:'pointer'}}>🗑</button>
        </div>
    )
}

// --- MODALE TÂCHE ---
function TaskModal({ task, projectMembers, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Charger les sous-tâches à l'ouverture
  useEffect(() => {
      fetch(`${API_URL}/tasks/${task.id}/subtasks`)
        .then(res => res.json())
        .then(setSubtasks);
  }, [task]);

  const handleSaveMain = () => { onUpdate(formData); onClose(); };

  // Gestion Sous-Tâches
  const addSubtask = async (e) => {
      e.preventDefault();
      if(!newSubtaskTitle) return;
      const res = await fetch(`${API_URL}/subtasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({task_id: task.id, title: newSubtaskTitle})});
      const json = await res.json();
      setSubtasks([...subtasks, json]); setNewSubtaskTitle("");
  };

  const updateSubtask = async (updatedSt) => {
      setSubtasks(subtasks.map(st => st.id === updatedSt.id ? updatedSt : st));
      await fetch(`${API_URL}/subtasks/${updatedSt.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(updatedSt)});
  };

  const deleteSubtask = async (id) => {
      setSubtasks(subtasks.filter(st => st.id !== id));
      await fetch(`${API_URL}/subtasks/${id}`, { method:'DELETE' });
  };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
      <div style={{background:'white', width:'700px', padding:'30px', borderRadius:'10px', display:'flex', flexDirection:'column', gap:'15px', maxHeight:'90vh', overflowY:'auto'}}>
        
        {/* TITRE DE LA TÂCHE (RENOMMABLE) */}
        <input 
            type="text" 
            value={formData.title} 
            onChange={e=>setFormData({...formData, title:e.target.value})} 
            style={{fontSize:'24px', fontWeight:'bold', padding:'5px', border:'1px dashed #ccc', borderRadius:'5px'}} 
        />
        
        <div style={{display:'flex', gap:'20px'}}>
            <div style={{flex:2, display:'flex', flexDirection:'column', gap:'15px'}}>
                <div>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'5px'}}>Description</label>
                    <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="4" style={{width:'100%', padding:'10px'}} placeholder="Ajouter plus de détails..." />
                </div>

                {/* SECTION SOUS-TÂCHES */}
                <div style={{background:'#f8fafc', padding:'15px', borderRadius:'8px'}}>
                    <label style={{fontWeight:'bold', display:'block', marginBottom:'10px'}}>✅ Sous-tâches</label>
                    
                    {/* Barre de progression sous-tâches */}
                    {subtasks.length > 0 && (
                        <div style={{height:'5px', background:'#ddd', borderRadius:'3px', marginBottom:'10px'}}>
                            <div style={{height:'100%', background:'#10b981', width:`${(subtasks.filter(s=>s.is_completed).length / subtasks.length) * 100}%`, transition:'width 0.3s'}}></div>
                        </div>
                    )}

                    <div style={{marginBottom:'10px'}}>
                        {subtasks.map(st => (
                            <SubtaskItem key={st.id} subtask={st} onUpdate={updateSubtask} onDelete={deleteSubtask} />
                        ))}
                    </div>
                    <form onSubmit={addSubtask} style={{display:'flex'}}>
                        <input placeholder="+ Ajouter une étape..." value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{flex:1, padding:'5px', fontSize:'13px'}} />
                    </form>
                </div>
            </div>

            {/* COLONNE DE DROITE (META-DATA) */}
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:'15px', background:'#f1f5f9', padding:'15px', borderRadius:'8px'}}>
                <div>
                    <label style={{fontSize:'12px', color:'#666'}}>Assigné à</label>
                    <select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'5px'}}>
                        <option value="">-- Personne --</option>
                        {projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'12px', color:'#666'}}>Date Limite</label>
                    <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'5px'}} />
                </div>
                <div>
                    <label style={{fontSize:'12px', color:'#666'}}>Priorité</label>
                    <select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'5px'}}>
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'12px', color:'#666'}}>Avancement ({formData.progress||0}%)</label>
                    <input type="range" value={formData.progress||0} onChange={e=>setFormData({...formData, progress:e.target.value})} style={{width:'100%'}} />
                </div>
            </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'auto'}}>
            <button onClick={onClose} style={{padding:'10px 20px', cursor:'pointer', border:'1px solid #ddd', background:'white', borderRadius:'5px'}}>Annuler</button>
            <button onClick={handleSaveMain} style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPALE ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  
  const [sites, setSites] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);

  // États pour renommage Projet
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");

  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // Initialisation
  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/sites`).then(res=>res.json()).then(data => {
            setSites(data);
            if(data.length > 0) setCurrentSite(data[0]);
        });
    }
  }, [token]);

  useEffect(() => {
    if (currentSite) {
        fetch(`${API_URL}/sites/${currentSite.id}/projects`).then(res=>res.json()).then(setProjects);
        setSelectedProject(null);
    }
  }, [currentSite]);

  useEffect(() => {
      if(selectedProject) {
          fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()).then(setTasks);
          fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json()).then(setMembers);
          setEditedProjectName(selectedProject.name); // Prépare le renommage
      }
  }, [selectedProject]);

  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); };
  
  const createSite = async (e) => {
      e.preventDefault();
      const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id:1})});
      const site = await res.json();
      setSites([...sites, site]); setCurrentSite(site); setNewSiteName("");
  };

  const createProject = async (e) => {
      e.preventDefault();
      const res = await fetch(`${API_URL}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newProjectName, owner_id:1, site_id: currentSite.id})});
      const proj = await res.json();
      setProjects([proj, ...projects]); setNewProjectName("");
  };

  const createTask = async (e) => {
      e.preventDefault();
      const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title: newTaskTitle})});
      const task = await res.json();
      setTasks([...tasks, task]); setNewTaskTitle("");
  };

  const inviteMember = async () => {
      const res = await fetch(`${API_URL}/projects/${selectedProject.id}/invite`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email: inviteEmail})});
      if(res.ok) {
          setInviteEmail(""); setShowInviteBox(false);
          fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json()).then(setMembers);
      } else { alert("Utilisateur introuvable"); }
  };

  const updateTask = async (updatedTask) => {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      await fetch(`${API_URL}/tasks/${updatedTask.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedTask) });
  };

  // RENOMMER PROJET
  const saveProjectName = async () => {
      setIsEditingProjectName(false);
      if(editedProjectName !== selectedProject.name) {
          const updatedProj = {...selectedProject, name: editedProjectName};
          setSelectedProject(updatedProj);
          setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
          await fetch(`${API_URL}/projects/${updatedProj.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: editedProjectName}) });
      }
  }

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-container" style={{display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Segoe UI, sans-serif'}}>
      {editingTask && <TaskModal task={editingTask} projectMembers={members} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

      {/* HEADER TOP */}
      <div style={{background:'#1e293b', padding:'0 20px', height:'50px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <span style={{fontWeight:'bold', fontSize:'18px', color:'#38bdf8'}}>MedinaApp</span>
              <div style={{height:'20px', width:'1px', background:'#475569'}}></div>
              <span style={{fontSize:'14px'}}>🌍 Site :</span>
              <select onChange={(e) => setCurrentSite(sites.find(s => s.id == e.target.value))} value={currentSite?.id} style={{background:'#334155', color:'white', border:'none', padding:'5px', borderRadius:'4px', cursor:'pointer'}}>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <form onSubmit={createSite} style={{display:'inline-flex'}}><input placeholder="+ Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'80px', fontSize:'12px', padding:'3px', background:'#0f172a', border:'none', color:'white'}}/></form>
          </div>
          <div onClick={() => {setToken(null); localStorage.removeItem('hotel_token')}} style={{cursor:'pointer', fontSize:'13px', opacity:0.8}}>Déconnexion</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* SIDEBAR */}
          <div style={{width:'240px', background:'#f8fafc', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column'}}>
            <div style={{padding:'20px 15px', borderBottom:'1px solid #e2e8f0'}}>
                <h3 style={{margin:0, fontSize:'14px', color:'#64748b', textTransform:'uppercase'}}>Projets</h3>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
                {projects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProject(p)} style={{padding:'8px 12px', margin:'2px 0', background: selectedProject?.id===p.id ? '#e0f2fe' : 'transparent', color: selectedProject?.id===p.id ? '#0284c7' : '#334155', borderRadius:'6px', cursor:'pointer', fontSize:'14px', fontWeight: selectedProject?.id===p.id ? '600' : '400'}}>
                        # {p.name}
                    </div>
                ))}
            </div>
            <div style={{padding:'15px'}}>
                <form onSubmit={createProject}><input placeholder="+ Nouveau Projet" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1'}} /></form>
            </div>
          </div>

          {/* MAIN */}
          <div style={{flex:1, display:'flex', flexDirection:'column', background:'white'}}>
              {!selectedProject ? (
                  <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', color:'#94a3b8'}}>Sélectionnez un projet pour commencer</div>
              ) : (
                  <>
                    {/* HEADER PROJET */}
                    <div style={{padding:'20px 30px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                        
                        {/* TITRE PROJET ÉDITABLE */}
                        <div style={{flex:1}}>
                            {isEditingProjectName ? (
                                <input 
                                    autoFocus 
                                    value={editedProjectName} 
                                    onChange={e=>setEditedProjectName(e.target.value)} 
                                    onBlur={saveProjectName}
                                    onKeyDown={e => e.key === 'Enter' && saveProjectName()}
                                    style={{fontSize:'24px', fontWeight:'bold', padding:'5px', width:'300px'}}
                                />
                            ) : (
                                <h1 onClick={()=>setIsEditingProjectName(true)} style={{margin:0, fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px'}}>
                                    {selectedProject.name} 
                                    <span style={{fontSize:'12px', color:'#94a3b8', fontWeight:'normal'}}>✎</span>
                                </h1>
                            )}
                        </div>

                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            <div style={{position:'relative'}}>
                                <button onClick={()=>setShowInviteBox(!showInviteBox)} style={{background:'white', color:'#475569', border:'1px solid #cbd5e1', padding:'6px 12px', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'600'}}>👥 Membres ({members.length})</button>
                                {showInviteBox && (
                                    <div style={{position:'absolute', top:'40px', right:0, background:'white', border:'1px solid #e2e8f0', padding:'15px', boxShadow:'0 10px 15px -3px rgba(0,0,0,0.1)', width:'250px', zIndex:50, borderRadius:'8px'}}>
                                        <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Email du collaborateur" style={{width:'100%', padding:'8px', marginBottom:'8px', border:'1px solid #cbd5e1', borderRadius:'4px'}} />
                                        <button onClick={inviteMember} style={{width:'100%', background:'#0ea5e9', color:'white', border:'none', padding:'6px', borderRadius:'4px', cursor:'pointer'}}>Inviter</button>
                                    </div>
                                )}
                            </div>
                            <div style={{background:'#f1f5f9', padding:'4px', borderRadius:'6px', display:'flex', gap:'2px'}}>
                                <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', background:viewMode==='board'?'white':'transparent', boxShadow:viewMode==='board'?'0 1px 2px rgba(0,0,0,0.1)':'none', borderRadius:'4px', cursor:'pointer', fontSize:'13px'}}>Tableau</button>
                                <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', background:viewMode==='list'?'white':'transparent', boxShadow:viewMode==='list'?'0 1px 2px rgba(0,0,0,0.1)':'none', borderRadius:'4px', cursor:'pointer', fontSize:'13px'}}>Liste</button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENU (KANBAN / LISTE) */}
                    <div style={{flex:1, padding:'20px', overflowY:'auto', background:'#f8fafc'}}>
                        {viewMode === 'board' && (
                            <div style={{display:'flex', gap:'20px', height:'100%', overflowX:'auto', alignItems:'flex-start'}}>
                                {['todo', 'doing', 'done'].map(status => (
                                    <div key={status} style={{width:'300px', flexShrink:0}}>
                                        <div style={{marginBottom:'10px', fontWeight:'600', color:'#475569', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px'}}>{status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}</div>
                                        {status==='todo' && <form onSubmit={createTask}><input placeholder="+ Ajouter une tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', marginBottom:'10px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}/></form>}
                                        
                                        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                            {tasks.filter(t=>t.status===status).map(t => {
                                                const assignee = members.find(m => m.id === t.assignee_id);
                                                return (
                                                    <div key={t.id} onClick={()=>setEditingTask(t)} style={{background:'white', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', cursor:'pointer', borderLeft: `4px solid ${t.priority==='high'?'#ef4444':t.priority==='medium'?'#f59e0b':'#10b981'}`}}>
                                                        <div style={{fontWeight:'500', color:'#1e293b', marginBottom:'8px'}}>{t.title}</div>
                                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                            <div style={{fontSize:'11px', color:'#94a3b8', background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Pas de date'}</div>
                                                            {assignee && <div style={{width:'24px', height:'24px', background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}} title={assignee.username}>{assignee.username.charAt(0).toUpperCase()}</div>}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* ... La vue Liste reste similaire ... */}
                    </div>
                  </>
              )}
          </div>
      </div>
    </div>
  )
}

export default App