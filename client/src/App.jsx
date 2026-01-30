import { useEffect, useState } from 'react'
import Login from './Login'

// --- CONFIGURATION ---
const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE URL RENDER ICI

// --- MODALE TÂCHE (COMPLÈTE) ---
function TaskModal({ task, projectMembers, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  useEffect(() => {
      fetch(`${API_URL}/tasks/${task.id}/subtasks`).then(res => res.json()).then(setSubtasks).catch(e=>console.log(e));
  }, [task]);

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

  // UPLOAD FICHIER
  const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const data = new FormData(); data.append('file', file);
      try {
          const res = await fetch(`${API_URL}/upload`, { method: 'POST', body: data });
          const json = await res.json();
          setFormData({ ...formData, attachment_url: json.url });
      } catch (err) { alert("Erreur upload"); }
  };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000}}>
      <div style={{background:'white', width:'800px', height:'85vh', borderRadius:'12px', display:'flex', flexDirection:'column', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
        
        {/* Header Modale */}
        <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <input value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{fontSize:'20px', fontWeight:'bold', border:'none', width:'100%', outline:'none'}} />
             <button onClick={onClose} style={{background:'none', border:'none', fontSize:'24px', cursor:'pointer', color:'#64748b'}}>✕</button>
        </div>
        
        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
            {/* Gauche */}
            <div style={{flex:2, padding:'25px', overflowY:'auto', borderRight:'1px solid #e2e8f0'}}>
                <label style={{fontSize:'12px', fontWeight:'bold', color:'#94a3b8', textTransform:'uppercase'}}>Description</label>
                <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="5" style={{width:'100%', padding:'10px', marginTop:'8px', marginBottom:'20px', border:'1px solid #e2e8f0', borderRadius:'6px'}} placeholder="Ajouter des détails..." />

                {/* Zone Sous-tâches */}
                <div style={{background:'#f8fafc', padding:'20px', borderRadius:'8px', border:'1px solid #e2e8f0'}}>
                    <label style={{fontWeight:'bold', color:'#475569', display:'block', marginBottom:'10px'}}>✅ Sous-tâches</label>
                    {subtasks.length > 0 && (
                        <div style={{height:'4px', background:'#e2e8f0', borderRadius:'2px', marginBottom:'15px', overflow:'hidden'}}>
                            <div style={{height:'100%', background:'#10b981', width:`${(subtasks.filter(s=>s.is_completed).length / subtasks.length) * 100}%`, transition:'width 0.3s'}}></div>
                        </div>
                    )}
                    {subtasks.map(st => (
                        <div key={st.id} style={{display:'flex', alignItems:'center', gap:'10px', padding:'5px 0', borderBottom:'1px dashed #e2e8f0'}}>
                            <input type="checkbox" checked={st.is_completed} onChange={(e)=>updateSubtask({...st, is_completed:e.target.checked})} style={{cursor:'pointer'}}/>
                            <input value={st.title} onChange={(e)=>updateSubtask({...st, title:e.target.value})} style={{border:'none', background:'transparent', flex:1, textDecoration: st.is_completed?'line-through':'none', color: st.is_completed?'#94a3b8':'inherit'}} />
                            <button onClick={()=>deleteSubtask(st.id)} style={{border:'none', background:'transparent', color:'#ef4444', cursor:'pointer'}}>🗑</button>
                        </div>
                    ))}
                    <form onSubmit={addSubtask} style={{marginTop:'10px'}}><input placeholder="+ Nouvelle étape" value={newSubtaskTitle} onChange={e=>setNewSubtaskTitle(e.target.value)} style={{width:'100%', padding:'8px', border:'1px solid #cbd5e1', borderRadius:'4px'}} /></form>
                </div>

                {/* Zone Fichier */}
                <div style={{marginTop:'20px'}}>
                     <label style={{fontSize:'12px', fontWeight:'bold', color:'#94a3b8', textTransform:'uppercase'}}>Pièce jointe</label>
                     <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
                        <label style={{padding:'6px 12px', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer', background:'white', fontSize:'13px'}}>
                            📎 Joindre
                            <input type="file" onChange={handleFileUpload} style={{display:'none'}} />
                        </label>
                        {formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{color:'#3b82f6', fontSize:'13px', textDecoration:'none'}}>📄 Voir le document</a>}
                     </div>
                </div>
            </div>

            {/* Droite */}
            <div style={{flex:1, padding:'25px', background:'#f9fafb', display:'flex', flexDirection:'column', gap:'20px'}}>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Statut</label>
                    <select value={formData.status||'todo'} onChange={e=>setFormData({...formData, status: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="todo">À Faire</option>
                        <option value="doing">En Cours</option>
                        <option value="done">Terminé</option>
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Assigné à</label>
                    <select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="">-- Personne --</option>
                        {projectMembers.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                    </select>
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Échéance</label>
                    <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', marginTop:'5px'}} />
                </div>
                <div>
                    <label style={{fontSize:'11px', fontWeight:'bold', color:'#64748b', textTransform:'uppercase'}}>Priorité</label>
                    <select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'8px', borderRadius:'6px', border:'1px solid #cbd5e1', marginTop:'5px'}}>
                        <option value="low">🟢 Basse</option>
                        <option value="medium">🟡 Moyenne</option>
                        <option value="high">🔴 Haute</option>
                    </select>
                </div>
            </div>
        </div>

        <div style={{padding:'20px', borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'flex-end', gap:'10px', background:'white'}}>
            <button onClick={onClose} style={{padding:'10px 20px', background:'white', border:'1px solid #cbd5e1', borderRadius:'6px', cursor:'pointer'}}>Annuler</button>
            <button onClick={handleSaveMain} style={{padding:'10px 20px', background:'#3b82f6', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>Enregistrer</button>
        </div>
      </div>
    </div>
  );
}

// --- COMPOSANT DASHBOARD ---
function Dashboard({ user, onOpenProject }) {
    const [myTasks, setMyTasks] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        if (!user) return;
        fetch(`${API_URL}/users/${user.id}/tasks`).then(res=>res.json()).then(setMyTasks).catch(e=>console.error(e));
        fetch(`${API_URL}/stats/${user.id}`).then(res=>res.json()).then(setStats).catch(e=>console.error(e));
        fetch(`${API_URL}/projects`).then(res=>res.json()).then(data => setRecentProjects(data.slice(0, 4))).catch(e=>console.error(e));
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div style={{overflowY:'auto', height:'100%', background:'#f9f9f9'}}>
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
                    <div style={{background:'white', padding:'20px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'32px', fontWeight:'bold', color:'#10b981'}}>{stats.completed}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase', fontWeight:'bold'}}>Tâches terminées</div>
                    </div>
                </div>
            </div>

            <div className="dash-grid">
                <div className="widget-card">
                    <div className="widget-header"><span>📋 Mes tâches prioritaires</span></div>
                    <div style={{flex:1}}>
                        {myTasks.length === 0 ? <div style={{padding:'20px', textAlign:'center', color:'#888'}}>Rien à faire, bravo ! 🎉</div> : 
                            myTasks.map(t => (
                                <div key={t.id} className="task-row">
                                    <div className="task-check" style={{width:'18px', height:'18px', border:'2px solid #ccc', borderRadius:'50%'}}></div>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px', fontWeight:'500'}}>{t.title}</div>
                                        <div style={{fontSize:'11px', color:'#888'}}>Projet: {t.project_name}</div>
                                    </div>
                                    <div style={{fontSize:'12px', padding:'2px 8px', borderRadius:'4px', background: t.priority==='high'?'#fee2e2':'#f1f5f9', color: t.priority==='high'?'#ef4444':'#64748b'}}>
                                        {t.priority === 'high' ? 'Urgent' : 'Normal'}
                                    </div>
                                </div>
                            ))
                        }
                    </div>
                </div>
                <div className="widget-card">
                    <div className="widget-header"><span>📂 Projets Récents</span></div>
                    <div style={{padding:'10px'}}>
                        {recentProjects.map(p => (
                            <div key={p.id} onClick={() => onOpenProject(p)} style={{padding:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', borderRadius:'6px', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#f5f5f5'} onMouseOut={e=>e.currentTarget.style.background='white'}>
                                <div style={{width:'32px', height:'32px', background: '#f06a6a', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px', fontWeight:'bold'}}>{p.name.charAt(0).toUpperCase()}</div>
                                <div style={{fontSize:'14px', fontWeight:'500'}}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

// --- COMPOSANT PROJET (AVEC LOGIQUE DRAG & DROP et LISTE) ---
function ProjectView({ project, tasks, members, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // DRAG & DROP LOGIC
    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => {
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find(t => t.id.toString() === taskId);
        if (task && task.status !== newStatus) {
            onUpdateTask({ ...task, status: newStatus });
        }
    };

    return (
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{width:'40px', height:'40px', background:'#f06a6a', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px', fontWeight:'bold'}}>{project.name.charAt(0)}</div>
                    <div>
                        <h1 style={{margin:0, fontSize:'20px'}}>{project.name}</h1>
                        <div style={{fontSize:'13px', color:'#888'}}>Projet • {members.length} membres</div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', display:'flex', padding:'2px'}}>
                        <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background: viewMode==='board'?'#eee':'white', cursor:'pointer', fontWeight: viewMode==='board'?'bold':'normal'}}>Kanban</button>
                        <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background: viewMode==='list'?'#eee':'white', cursor:'pointer', fontWeight: viewMode==='list'?'bold':'normal'}}>Liste</button>
                    </div>
                    <button onClick={onInvite} style={{background:'white', border:'1px solid #ddd', padding:'6px 12px', borderRadius:'6px', cursor:'pointer'}}>👤 Inviter</button>
                </div>
            </div>

            {/* VUE KANBAN */}
            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} onDragOver={handleDragOver} onDrop={(e)=>handleDrop(e, status)} style={{minWidth:'320px', background:'#f7f8f9', borderRadius:'10px', padding:'15px', border:'1px solid #e0e0e0'}}>
                            <div style={{fontSize:'12px', fontWeight:'bold', color:'#6d6e70', marginBottom:'15px', textTransform:'uppercase', display:'flex', justifyContent:'space-between'}}>
                                {status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}
                                <span style={{background:'#eee', padding:'2px 8px', borderRadius:'10px'}}>{tasks.filter(t=>t.status===status).length}</span>
                            </div>
                            {status === 'todo' && (
                                <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}} style={{marginBottom:'10px'}}>
                                    <input placeholder="+ Ajouter une tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid transparent', borderRadius:'8px', outline:'none', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}} />
                                </form>
                            )}
                            <div style={{display:'flex', flexDirection:'column', gap:'10px', minHeight:'100px'}}>
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

            {/* VUE LISTE (RETOUR DE LA TABLE) */}
            {viewMode === 'list' && (
                <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden'}}>
                     <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead style={{background:'#f9f9f9', borderBottom:'1px solid #eee'}}>
                            <tr>
                                <th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Titre</th>
                                <th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Statut</th>
                                <th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Assigné</th>
                                <th style={{padding:'12px', textAlign:'left', fontSize:'12px', color:'#666', textTransform:'uppercase'}}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.map(t => {
                                const assignee = members.find(m => m.id === t.assignee_id);
                                return (
                                    <tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #f5f5f5', cursor:'pointer'}}>
                                        <td style={{padding:'12px', fontWeight:'500'}}>{t.title}</td>
                                        <td style={{padding:'12px'}}>
                                            <span style={{padding:'4px 10px', borderRadius:'12px', fontSize:'11px', fontWeight:'bold', background: t.status==='done'?'#dcfce7':t.status==='doing'?'#dbeafe':'#f3f4f6', color: t.status==='done'?'#166534':t.status==='doing'?'#1e40af':'#4b5563'}}>
                                                {t.status === 'todo' ? 'À faire' : t.status === 'doing' ? 'En cours' : 'Terminé'}
                                            </span>
                                        </td>
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

// --- APP PRINCIPALE ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(() => {
      const saved = localStorage.getItem('hotel_user');
      return saved ? JSON.parse(saved) : null;
  });
  
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState({ tasks: [], members: [] });
  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);

  const handleLogin = (tok, usr) => { 
      setToken(tok); setUser(usr); 
      localStorage.setItem('hotel_token', tok);
      localStorage.setItem('hotel_user', JSON.stringify(usr));
  };

  const handleLogout = () => {
      setToken(null); setUser(null);
      localStorage.removeItem('hotel_token'); localStorage.removeItem('hotel_user');
  };

  useEffect(() => {
    if (token) {
        Promise.all([fetch(`${API_URL}/sites`).then(res=>res.json()), fetch(`${API_URL}/projects`).then(res=>res.json())])
        .then(([sitesData, projectsData]) => { setSites(sitesData); setProjects(projectsData); })
        .catch(e => console.error(e));
    }
  }, [token]);

  useEffect(() => {
    if (selectedProject) {
        Promise.all([fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()), fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json())])
        .then(([tasks, members]) => { setProjectData({ tasks, members }); });
    }
  }, [selectedProject]);

  const navToProject = (project) => { setSelectedProject(project); setActiveTab(`project-${project.id}`); };
  
  const createTask = async (title) => {
     const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})});
     const task = await res.json();
     setProjectData({...projectData, tasks: [...projectData.tasks, task]});
  };

  const updateTask = async (updatedTask) => {
      // Optimistic update
      setProjectData(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === updatedTask.id ? updatedTask : t) }));
      await fetch(`${API_URL}/tasks/${updatedTask.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedTask) });
  };

  if (token && !user) { handleLogout(); return <Login onLogin={handleLogin} />; }
  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw'}}>
        {editingTask && <TaskModal task={editingTask} projectMembers={projectData.members} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

        <div className="sidebar" style={{width:'240px', flexShrink:0}}>
            <div className="sidebar-header"><span style={{background:'#f06a6a', width:'24px', height:'24px', borderRadius:'6px', display:'inline-block', marginRight:'10px'}}></span>MedinaOS</div>
            <div className="sidebar-section">Général</div>
            <div className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>🏠 Accueil</div>
            <div className={`nav-item ${activeTab==='mytasks'?'active':''}`} onClick={()=>{setActiveTab('mytasks'); setSelectedProject(null)}}>✅ Mes tâches</div>
            {sites.map(site => {
                const siteProjects = projects.filter(p => p.site_id === site.id);
                if (siteProjects.length === 0) return null;
                return (
                    <div key={site.id}>
                        <div className="sidebar-section">🏢 {site.name}</div>
                        {siteProjects.map(proj => (
                            <div key={proj.id} className={`nav-item ${activeTab===`project-${proj.id}`?'active':''}`} onClick={() => navToProject(proj)}>
                                <span style={{width:'8px', height:'8px', borderRadius:'50%', background: activeTab===`project-${proj.id}`?'#f06a6a':'#666'}}></span>{proj.name}
                            </div>
                        ))}
                    </div>
                );
            })}
            <div style={{marginTop:'auto', padding:'20px'}}><button onClick={handleLogout} style={{background:'transparent', border:'1px solid #444', color:'#aaa', width:'100%', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>Déconnexion</button></div>
        </div>

        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            {activeTab === 'home' && <Dashboard user={user} onOpenProject={navToProject} />}
            {activeTab === 'mytasks' && <div style={{padding:'40px'}}><h1>Mes Tâches</h1><p>Bientôt...</p></div>}
            {activeTab.startsWith('project-') && selectedProject && (
                <ProjectView 
                    project={selectedProject} 
                    tasks={projectData.tasks} 
                    members={projectData.members} 
                    viewMode={viewMode} 
                    setViewMode={setViewMode} 
                    onAddTask={createTask} 
                    onEditTask={setEditingTask} 
                    onUpdateTask={updateTask}
                    onInvite={() => console.log("Invite")} 
                />
            )}
        </div>
    </div>
  )
}