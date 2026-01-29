import { useEffect, useState } from 'react'
import Login from './Login'

// --- COMPOSANT MODAL TÂCHE (AVEC ASSIGNATION) ---
function TaskModal({ task, projectMembers, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);

  const handleSave = () => { onUpdate(formData); onClose(); };

  return (
    <div style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
      <div style={{background:'white', width:'600px', padding:'30px', borderRadius:'10px', display:'flex', flexDirection:'column', gap:'15px', maxHeight:'90vh', overflowY:'auto'}}>
        <h2>Modifier la tâche</h2>
        
        <label>Titre</label>
        <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{padding:'10px'}} />
        
        <label>Description</label>
        <textarea value={formData.description||''} onChange={e=>setFormData({...formData, description:e.target.value})} rows="4" style={{padding:'10px'}} />

        <div style={{display:'flex', gap:'10px'}}>
            <div style={{flex:1}}>
                <label>Assigné à :</label>
                <select value={formData.assignee_id || ''} onChange={e=>setFormData({...formData, assignee_id: e.target.value})} style={{width:'100%', padding:'8px'}}>
                    <option value="">-- Personne --</option>
                    {projectMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                </select>
            </div>
            <div style={{flex:1}}>
                <label>Priorité</label>
                <select value={formData.priority||'medium'} onChange={e=>setFormData({...formData, priority:e.target.value})} style={{width:'100%', padding:'8px'}}>
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                </select>
            </div>
        </div>

        <div style={{display:'flex', gap:'10px'}}>
            <div style={{flex:1}}>
                <label>Date Limite</label>
                <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e=>setFormData({...formData, due_date: e.target.value})} style={{width:'100%', padding:'8px'}} />
            </div>
            <div style={{flex:1}}>
                <label>Progression ({formData.progress||0}%)</label>
                <input type="range" value={formData.progress||0} onChange={e=>setFormData({...formData, progress:e.target.value})} style={{width:'100%'}} />
            </div>
        </div>

        <button onClick={handleSave} style={{padding:'15px', background:'#3b82f6', color:'white', border:'none', borderRadius:'5px', cursor:'pointer'}}>Enregistrer</button>
        <button onClick={onClose} style={{padding:'10px', background:'transparent', border:'none', cursor:'pointer', color:'#888'}}>Annuler</button>
      </div>
    </div>
  );
}

// --- APP PRINCIPALE ---
function App() {
  const API_URL = 'https://medina-api.onrender.com'; // <--- URL RENDER ICI

  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  
  // DONNÉES
  const [sites, setSites] = useState([]);
  const [currentSite, setCurrentSite] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]); // Membres du projet actif

  // ÉTATS UI
  const [viewMode, setViewMode] = useState('board');
  const [editingTask, setEditingTask] = useState(null);
  const [showInviteBox, setShowInviteBox] = useState(false);
  
  // FORMULAIRES
  const [newSiteName, setNewSiteName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  // 1. Charger les sites au démarrage
  useEffect(() => {
    if (token) {
        fetch(`${API_URL}/sites`).then(res=>res.json()).then(data => {
            setSites(data);
            if(data.length > 0) setCurrentSite(data[0]); // Sélectionner le 1er site par défaut
        });
    }
  }, [token]);

  // 2. Charger les projets quand le SITE change
  useEffect(() => {
    if (currentSite) {
        fetch(`${API_URL}/sites/${currentSite.id}/projects`)
            .then(res=>res.json())
            .then(data => setProjects(data));
        setSelectedProject(null); // Reset projet quand on change de site
    }
  }, [currentSite]);

  // 3. Charger les tâches et membres quand le PROJET change
  useEffect(() => {
      if(selectedProject) {
          fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()).then(setTasks);
          fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json()).then(setMembers);
      }
  }, [selectedProject]);

  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); };
  
  // ACTIONS CRÉATION
  const createSite = async (e) => {
      e.preventDefault();
      const res = await fetch(`${API_URL}/sites`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name: newSiteName, owner_id:1})});
      const site = await res.json();
      setSites([...sites, site]); setCurrentSite(site); setNewSiteName("");
  };

  const createProject = async (e) => {
      e.preventDefault();
      // On passe l'ID du site maintenant !
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
          alert("Membre ajouté ! (S'il existe)");
          setInviteEmail(""); setShowInviteBox(false);
          // Recharger les membres
          fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json()).then(setMembers);
      } else {
          alert("Erreur : Utilisateur introuvable ?");
      }
  };

  const updateTask = async (updatedTask) => {
      setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      await fetch(`${API_URL}/tasks/${updatedTask.id}`, { method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(updatedTask) });
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-container" style={{display:'flex', flexDirection:'column', height:'100vh'}}>
      {editingTask && <TaskModal task={editingTask} projectMembers={members} onClose={()=>setEditingTask(null)} onUpdate={updateTask} />}

      {/* --- BARRE DE NAVIGATION (SITES) --- */}
      <div style={{background:'#1e293b', padding:'10px 20px', color:'white', display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
              <span style={{fontWeight:'bold', fontSize:'18px'}}>🌍 {currentSite ? currentSite.name : 'Chargement...'}</span>
              <select onChange={(e) => setCurrentSite(sites.find(s => s.id == e.target.value))} value={currentSite?.id} style={{background:'#334155', color:'white', border:'none', padding:'5px', borderRadius:'4px'}}>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <form onSubmit={createSite} style={{display:'inline-flex', gap:'5px'}}>
                  <input placeholder="+ Nouveau Site" value={newSiteName} onChange={e=>setNewSiteName(e.target.value)} style={{width:'100px', fontSize:'12px', padding:'4px'}}/>
              </form>
          </div>
          <div onClick={() => {setToken(null); localStorage.removeItem('hotel_token')}} style={{cursor:'pointer', fontSize:'14px'}}>Déconnexion</div>
      </div>

      <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* SIDEBAR */}
          <div className="sidebar" style={{width:'250px', background:'#f8fafc', borderRight:'1px solid #ddd', padding:'20px', display:'flex', flexDirection:'column'}}>
            <h3>Projets ({currentSite?.name})</h3>
            <div className="projects-list" style={{flex:1, overflowY:'auto'}}>
                {projects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProject(p)} style={{padding:'10px', margin:'5px 0', background: selectedProject?.id===p.id ? '#e0f2fe' : 'white', borderRadius:'5px', cursor:'pointer', border:'1px solid #ddd'}}>
                        {p.name}
                    </div>
                ))}
            </div>
            <form onSubmit={createProject} style={{marginTop:'10px'}}>
                <input placeholder="+ Nouveau Projet" value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{width:'100%', padding:'8px'}} />
            </form>
          </div>

          {/* MAIN */}
          <div className="main" style={{flex:1, padding:'20px', overflowY:'auto', background:'#fff'}}>
              {!selectedProject ? (
                  <div style={{textAlign:'center', marginTop:'100px', color:'#888'}}>Selectionnez un projet à gauche</div>
              ) : (
                  <>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                        <h1>{selectedProject.name}</h1>
                        <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                            {/* BOUTON ÉQUIPE */}
                            <div style={{position:'relative'}}>
                                <button onClick={()=>setShowInviteBox(!showInviteBox)} style={{background:'#8b5cf6', color:'white', border:'none', padding:'8px 15px', borderRadius:'5px', cursor:'pointer'}}>👥 Équipe ({members.length})</button>
                                {showInviteBox && (
                                    <div style={{position:'absolute', top:'40px', right:0, background:'white', border:'1px solid #ddd', padding:'15px', boxShadow:'0 5px 15px rgba(0,0,0,0.2)', width:'250px', zIndex:100}}>
                                        <h4>Inviter un membre</h4>
                                        <p style={{fontSize:'12px', color:'#666'}}>Entrez l'email d'un compte existant.</p>
                                        <input value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="email@hotel.com" style={{width:'100%', padding:'8px', marginBottom:'10px'}} />
                                        <button onClick={inviteMember} style={{width:'100%', background:'#10b981', color:'white', border:'none', padding:'5px'}}>Inviter</button>
                                        <div style={{marginTop:'10px', maxHeight:'100px', overflowY:'auto'}}>
                                            {members.map(m => <div key={m.id} style={{fontSize:'12px', borderBottom:'1px solid #eee', padding:'5px'}}>👤 {m.username}</div>)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* BOUTONS VUES */}
                            <button onClick={()=>setViewMode('board')} style={{padding:'8px 15px'}}>Kanban</button>
                            <button onClick={()=>setViewMode('list')} style={{padding:'8px 15px'}}>Liste</button>
                        </div>
                    </div>

                    {/* VUE KANBAN */}
                    {viewMode === 'board' && (
                        <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'80%'}}>
                             {['todo', 'doing', 'done'].map(status => (
                                <div key={status} style={{flex:1, minWidth:'280px', background:'#f1f5f9', padding:'10px', borderRadius:'8px'}}>
                                    <h4 style={{textTransform:'uppercase'}}>{status}</h4>
                                    {status==='todo' && <form onSubmit={createTask}><input placeholder="+ Tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'90%', padding:'8px', margin:'10px 0'}}/></form>}
                                    
                                    {tasks.filter(t=>t.status===status).map(t => {
                                        const assignee = members.find(m => m.id === t.assignee_id);
                                        return (
                                            <div key={t.id} onClick={()=>setEditingTask(t)} style={{background:'white', padding:'15px', marginBottom:'10px', borderRadius:'6px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', cursor:'pointer', borderLeft: `4px solid ${t.priority==='high'?'red':'orange'}`}}>
                                                <div style={{fontWeight:'bold'}}>{t.title}</div>
                                                <div style={{display:'flex', justifyContent:'space-between', marginTop:'10px', fontSize:'12px', color:'#666'}}>
                                                    <span>{t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : ''}</span>
                                                    {/* AVATAR ASSIGNÉ */}
                                                    {assignee ? (
                                                        <span style={{background:'#3b82f6', color:'white', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px'}}>{assignee.username.charAt(0).toUpperCase()}</span>
                                                    ) : <span>👤 ?</span>}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                             ))}
                        </div>
                    )}

                    {/* VUE LISTE */}
                    {viewMode === 'list' && (
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                            <thead style={{background:'#f1f5f9'}}><tr><th style={{padding:'10px'}}>Titre</th><th>Assigné à</th><th>Statut</th><th>Date</th></tr></thead>
                            <tbody>
                                {tasks.map(t => {
                                    const assignee = members.find(m => m.id === t.assignee_id);
                                    return (
                                        <tr key={t.id} onClick={()=>setEditingTask(t)} style={{borderBottom:'1px solid #eee', cursor:'pointer'}}>
                                            <td style={{padding:'10px'}}>{t.title}</td>
                                            <td>{assignee ? assignee.username : '-'}</td>
                                            <td>{t.status}</td>
                                            <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                  </>
              )}
          </div>
      </div>
    </div>
  )
}

export default App