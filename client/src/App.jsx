import { useEffect, useState } from 'react'
import Login from './Login'

// --- CONFIGURATION ---
const API_URL = 'https://medina-api.onrender.com'; // <--- REMPLACEZ PAR VOTRE LIEN RENDER

// --- COMPOSANT SOUS-TÂCHE ---
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
                    autoFocus value={title} onChange={e => setTitle(e.target.value)} onBlur={handleBlur} onKeyDown={e => e.key === 'Enter' && handleBlur()}
                    style={{flex:1, padding:'5px', border:'1px solid #3b82f6', outline:'none', borderRadius:'3px'}}
                />
            ) : (
                <span onClick={() => setIsEditing(true)} style={{flex:1, textDecoration: subtask.is_completed ? 'line-through' : 'none', color: subtask.is_completed ? '#aaa' : 'black', cursor:'text'}}>
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

  useEffect(() => {
      fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(res => res.json()).then(setSubtasks);
  }, [task]);

  const handleSaveMain = () => { onUpdate(formData); onClose(); };

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
      <div style={{background:'white', width:'800px', padding:'30px', borderRadius:'10px', display:'flex', flexDirection:'column', gap:'20px', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
        
        {/* EN-TÊTE MODALE */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
             <input 
                type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} 
                style={{fontSize:'22px', fontWeight:'bold', padding:'5px', border:'1px transparent', borderRadius:'5px', flex:1}} 
                placeholder="Titre de la tâche"
            />
            <button onClick={onClose} style={{background:'none', border:'none', fontSize:'20px', cursor:'pointer', color:'#64748b'}}>✕</button>
        </div>
        
        <div style={{display:'flex', gap:'30px'}}>
            {/* COLONNE GAUCHE (Description & Sous-tâches) */}
            <div style={{flex:2, display:'flex', flexDirection:'column', gap:'20px'}}>
                <div>
                    <label style={{fontWeight:'600', display:'block', marginBottom:'5px', color:'#475569'}}>Description</label>
                    <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="4" style={{width:'100%', padding:'10px', border:'1px solid #e2e8f0', borderRadius:'6px'}} placeholder="Ajouter des détails..." />
                </div>

                <div style={{background:'#f8fafc', padding:'20px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px'}}>
                        <label style={{fontWeight:'600', color:'#475569'}}>✅ Sous-tâches</label>
                        <span style={{fontSize:'12px', color:'#64748b'}}>{subtasks.filter(s=>s.is_completed).length}/{subtasks.length}</span>
                    </div>
                    
                    {subtasks.length > 0 && (
                        <div style={{height:'6px', background:'#e2e8f0', borderRadius:'3px', marginBottom:'15px', overflow:'hidden'}}>
                            <div style={{height:'100%', background:'#10b981', width:`${(subtasks.filter(s=>s.is_completed).length / subtasks.length) * 100}%`, transition:'width 0.3s'}}></div>
                        </div>
                    )}

                    <div style={{marginBottom:'10px'}}>
                        {subtasks.map(st => <SubtaskItem key={st.id} subtask={st} onUpdate={updateSubtask} onDelete={deleteSubtask} />)}
                    </div>
                    <form onSubmit={addSubtask} style={{display:'flex'}}><input placeholder="+ Ajouter une étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{flex:1, padding:'8px', fontSize:'13px', border:'1px solid #cbd5e1', borderRadius:'4px'}} /></form>
                </div>
            </div>

            {/* COLONNE DROITE (Détails techniques) */}
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:'15px', background:'#f1f5f9', padding:'20px', borderRadius:'8px', height:'fit-content'}}>
                <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Statut</label>
                    <select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="todo">À FAIRE</option>
                        <option value="doing">EN COURS</option>
                        <option value="done">TERMINÉ</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Assigné à</label>
                    <select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="">-- Personne --</option>
                        {projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Date Limite</label>
                    <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #cbd5e1', marginTop:'5px'}} />
                </div>
                <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Priorité</label>
                    <select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'4px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Avancement ({formData.progress||0}%)</label>
                    <input type="range" value={formData.progress||0} onChange={e=>setFormData({...formData, progress:e.target.value})} style={{width:'100%', marginTop:'5px'}} />
                </div>
            </div>
        </div>

        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'auto', paddingTop:'20px', borderTop:'1px solid #e2e8f0'}}>
            <button onClick={onClose} style={{padding:'10px 20px', cursor:'pointer', border:'1px solid #cbd5e1', background:'white', borderRadius:'5px', fontWeight:'600', color:'#475569'}}>Annuler</button>
            <button onClick={handleSaveMain} style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:'5px', cursor:'pointer', fontWeight:'600'}}>Enregistrer les modifications</button>
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

  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editedProjectName, setEditedProjectName] = useState("");

  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

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
          setEditedProjectName(selectedProject.name);
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

  const saveProjectName = async () => {
      setIsEditingProjectName(false);
      if(editedProjectName !== selectedProject.name) {
          const updatedProj = {...selectedProject, name: editedProjectName};
          setSelectedProject(updatedProj);
          setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
          await fetch(`${API_URL}/projects/${updatedProj.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: editedProjectName}) });
      }
  }

  // --- LOGIQUE DRAG & DROP (GLISSER DÉPOSER) ---
  const handleDragStart = (e, taskId) => {
      e.dataTransfer.setData("taskId", taskId);
  }

  const handleDragOver = (e) => {
      e.preventDefault();
  }

  const handleDrop = (e, newStatus) => {
      const taskId = e.dataTransfer.getData("taskId");
      const taskToMove = tasks.find(t => t.id.toString() === taskId.toString());
      
      if (taskToMove && taskToMove.status !== newStatus) {
          const updatedTask = { ...taskToMove, status: newStatus };
          updateTask(updatedTask);
      }
  }

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-container" style={{display:'flex', flexDirection:'column', height:'100vh', fontFamily:'Segoe UI, sans-serif', color:'#334155'}}>
      {editingTask && <TaskModal task={editingTask} projectMembers={members} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

      {/* NAVBAR */}
      <div style={{background:'#1e293b', padding:'0 20px', height:'55px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between', boxShadow:'0 2px 4px rgba(0,0,0,0.1)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
              <span style={{fontWeight:'bold', fontSize:'18px', color:'#38bdf8', letterSpacing:'0.5px'}}>MEDINA MANAGER</span>
              <div style={{height:'25px', width:'1px', background:'#475569'}}></div>
              <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                  <span style={{fontSize:'13px', color:'#94a3b8'}}>SITE ACTUEL</span>
                  <select onChange={(e) => setCurrentSite(sites.find(s => s.id == e.target.value))} value={currentSite?.id} style={{background:'#334155', color:'white', border:'1px solid #475569', padding:'5px 10px', borderRadius:'4px', cursor:'pointer', fontSize:'14px'}}>
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <form onSubmit={createSite} style={{display:'inline-flex'}}><input placeholder="+ Créer Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'90px', fontSize:'12px', padding:'5px', background:'#0f172a', border:'1px solid #334155', borderRadius:'4px', color:'white'}}/></form>
              </div>
          </div>
          <div onClick={() => {setToken(null); localStorage.removeItem('hotel_token')}} style={{cursor:'pointer', fontSize:'13px', opacity:0.8, fontWeight:'600'}}>DÉCONNEXION</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* SIDEBAR */}
          <div style={{width:'260px', background:'#f8fafc', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column'}}>
            <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0'}}>
                <h3 style={{margin:0, fontSize:'12px', color:'#64748b', textTransform:'uppercase', letterSpacing:'1px', fontWeight:'700'}}>Projets</h3>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
                {projects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProject(p)} style={{padding:'10px 15px', margin:'4px 0', background: selectedProject?.id===p.id ? '#e0f2fe' : 'transparent', color: selectedProject?.id===p.id ? '#0284c7' : '#475569', borderRadius:'6px', cursor:'pointer', fontSize:'14px', fontWeight: selectedProject?.id===p.id ? '600' : '500', display:'flex', alignItems:'center', gap:'10px'}}>
                        <span style={{fontSize:'16px'}}>#</span> {p.name}
                    </div>
                ))}
            </div>
            <div style={{padding:'15px', borderTop:'1px solid #e2e8f0'}}>
                <form onSubmit={createProject}><input placeholder="+ Nouveau Projet" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1', outline:'none', fontSize:'14px'}} /></form>
            </div>
          </div>

          {/* MAIN */}
          <div style={{flex:1, display:'flex', flexDirection:'column', background:'white'}}>
              {!selectedProject ? (
                  <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', color:'#94a3b8', flexDirection:'column', gap:'10px'}}>
                      <div style={{fontSize:'40px'}}>📂</div>
                      <div>Sélectionnez un projet à gauche pour commencer</div>
                  </div>
              ) : (
                  <>
                    {/* HEADER PROJET */}
                    <div style={{padding:'20px 30px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center', background:'white'}}>
                        <div style={{flex:1}}>
                            {isEditingProjectName ? (
                                <input 
                                    autoFocus value={editedProjectName} onChange={e=>setEditedProjectName(e.target.value)} onBlur={saveProjectName} onKeyDown={e => e.key === 'Enter' && saveProjectName()}
                                    style={{fontSize:'24px', fontWeight:'bold', padding:'5px', width:'100%', border:'1px solid #3b82f6', borderRadius:'5px'}}
                                />
                            ) : (
                                <h1 onClick={()=>setIsEditingProjectName(true)} style={{margin:0, fontSize:'24px', cursor:'pointer', display:'flex', alignItems:'center', gap:'10px', color:'#1e293b'}}>
                                    {selectedProject.name} 
                                    <span style={{fontSize:'14px', color:'#cbd5e1'}}>✎</span>
                                </h1>
                            )}
                        </div>

                        <div style={{display:'flex', gap:'15px', alignItems:'center'}}>
                            <div style={{position:'relative'}}>
                                <button onClick={()=>setShowInviteBox(!showInviteBox)} style={{background:'white', color:'#475569', border:'1px solid #cbd5e1', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:'600', display:'flex', alignItems:'center', gap:'8px'}}>
                                    👥 Membres ({members.length})
                                </button>
                                {showInviteBox && (
                                    <div style={{position:'absolute', top:'45px', right:0, background:'white', border:'1px solid #e2e8f0', padding:'20px', boxShadow:'0 10px 25px -5px rgba(0,0,0,0.1)', width:'300px', zIndex:50, borderRadius:'8px'}}>
                                        <h4 style={{marginTop:0, marginBottom:'10px'}}>Inviter un collègue</h4>
                                        <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="Email (ex: chayma@hotel.com)" style={{width:'100%', padding:'10px', marginBottom:'10px', border:'1px solid #cbd5e1', borderRadius:'4px'}} />
                                        <button onClick={inviteMember} style={{width:'100%', background:'#0ea5e9', color:'white', border:'none', padding:'8px', borderRadius:'4px', cursor:'pointer', fontWeight:'bold'}}>Envoyer l'invitation</button>
                                    </div>
                                )}
                            </div>
                            <div style={{background:'#f1f5f9', padding:'4px', borderRadius:'8px', display:'flex', gap:'4px'}}>
                                <button onClick={()=>setViewMode('board')} style={{padding:'8px 16px', border:'none', background:viewMode==='board'?'white':'transparent', boxShadow:viewMode==='board'?'0 1px 2px rgba(0,0,0,0.1)':'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:viewMode==='board'?'600':'500', color:viewMode==='board'?'#0f172a':'#64748b'}}>Kanban</button>
                                <button onClick={()=>setViewMode('list')} style={{padding:'8px 16px', border:'none', background:viewMode==='list'?'white':'transparent', boxShadow:viewMode==='list'?'0 1px 2px rgba(0,0,0,0.1)':'none', borderRadius:'6px', cursor:'pointer', fontSize:'13px', fontWeight:viewMode==='list'?'600':'500', color:viewMode==='list'?'#0f172a':'#64748b'}}>Liste</button>
                            </div>
                        </div>
                    </div>

                    {/* CONTENU PRINCIPAL */}
                    <div style={{flex:1, padding:'25px', overflowY:'auto', background:'#f8fafc'}}>
                        
                        {/* VUE KANBAN INTERACTIVE */}
                        {viewMode === 'board' && (
                            <div style={{display:'flex', gap:'25px', height:'100%', overflowX:'auto', alignItems:'flex-start'}}>
                                {['todo', 'doing', 'done'].map(status => (
                                    <div 
                                        key={status} 
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, status)}
                                        style={{width:'320px', flexShrink:0, background:'#f1f5f9', borderRadius:'10px', padding:'15px', border:'1px solid #e2e8f0'}}
                                    >
                                        <div style={{marginBottom:'15px', fontWeight:'700', color:'#475569', textTransform:'uppercase', fontSize:'12px', letterSpacing:'1px', display:'flex', justifyContent:'space-between'}}>
                                            {status === 'todo' ? 'À FAIRE' : status === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                            <span style={{background:'#e2e8f0', padding:'2px 8px', borderRadius:'10px', fontSize:'11px'}}>{tasks.filter(t=>t.status===status).length}</span>
                                        </div>
                                        
                                        {status==='todo' && (
                                            <form onSubmit={createTask}>
                                                <input placeholder="+ Ajouter une tâche..." value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'12px', border:'1px solid transparent', borderRadius:'8px', marginBottom:'15px', boxShadow:'0 1px 3px rgba(0,0,0,0.05)', fontSize:'14px', outline:'none'}} />
                                            </form>
                                        )}
                                        
                                        <div style={{display:'flex', flexDirection:'column', gap:'12px', minHeight:'50px'}}>
                                            {tasks.filter(t=>t.status===status).map(t => {
                                                const assignee = members.find(m => m.id === t.assignee_id);
                                                return (
                                                    <div 
                                                        key={t.id} 
                                                        draggable="true"
                                                        onDragStart={(e) => handleDragStart(e, t.id)}
                                                        onClick={()=>setEditingTask(t)} 
                                                        style={{background:'white', padding:'15px', borderRadius:'8px', border:'1px solid #e2e8f0', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'grab', borderLeft: `4px solid ${t.priority==='high'?'#ef4444':t.priority==='medium'?'#f59e0b':'#10b981'}`, transition:'transform 0.1s'}}
                                                    >
                                                        <div style={{fontWeight:'600', color:'#1e293b', marginBottom:'8px', fontSize:'15px'}}>{t.title}</div>
                                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                            <div style={{fontSize:'12px', color:'#94a3b8', background:'#f8fafc', padding:'3px 8px', borderRadius:'4px', display:'flex', alignItems:'center', gap:'5px'}}>
                                                                📅 {t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : '-'}
                                                            </div>
                                                            {assignee && (
                                                                <div style={{width:'26px', height:'26px', background:'#3b82f6', color:'white', borderRadius:'50%', fontSize:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold', border:'2px solid white', boxShadow:'0 0 0 1px #e2e8f0'}} title={assignee.username}>
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

                        {/* VUE LISTE */}
                        {viewMode === 'list' && (
                            <table style={{width:'100%', borderCollapse:'separate', borderSpacing:'0', background:'white', borderRadius:'8px', border:'1px solid #e2e8f0', overflow:'hidden'}}>
                                <thead style={{background:'#f8fafc'}}>
                                    <tr>
                                        <th style={{padding:'15px', textAlign:'left', color:'#64748b', fontSize:'13px', textTransform:'uppercase'}}>Titre</th>
                                        <th style={{padding:'15px', textAlign:'left', color:'#64748b', fontSize:'13px', textTransform:'uppercase'}}>Statut</th>
                                        <th style={{padding:'15px', textAlign:'left', color:'#64748b', fontSize:'13px', textTransform:'uppercase'}}>Assigné à</th>
                                        <th style={{padding:'15px', textAlign:'left', color:'#64748b', fontSize:'13px', textTransform:'uppercase'}}>Échéance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map(t => {
                                        const assignee = members.find(m => m.id === t.assignee_id);
                                        return (
                                            <tr key={t.id} onClick={()=>setEditingTask(t)} style={{cursor:'pointer', borderBottom:'1px solid #f1f5f9'}}>
                                                <td style={{padding:'15px', borderBottom:'1px solid #f1f5f9', fontWeight:'500'}}>{t.title}</td>
                                                <td style={{padding:'15px', borderBottom:'1px solid #f1f5f9'}}>
                                                    <span style={{padding:'4px 10px', borderRadius:'15px', fontSize:'12px', fontWeight:'600', background: t.status==='done'?'#dcfce7':t.status==='doing'?'#dbeafe':'#f1f5f9', color: t.status==='done'?'#166534':t.status==='doing'?'#1e40af':'#475569'}}>
                                                        {t.status === 'todo' ? 'À FAIRE' : t.status === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                                    </span>
                                                </td>
                                                <td style={{padding:'15px', borderBottom:'1px solid #f1f5f9'}}>{assignee ? assignee.username : '-'}</td>
                                                <td style={{padding:'15px', borderBottom:'1px solid #f1f5f9'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
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
