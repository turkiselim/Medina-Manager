import { useEffect, useState } from 'react'
import Login from './Login'

// --- COMPOSANT MODAL (LA FENÊTRE DE DÉTAIL TYPE ASANA) ---
function TaskModal({ task, onClose, onUpdate }) {
  const [formData, setFormData] = useState(task);

  // Sauvegarder les changements
  const handleSave = () => {
    onUpdate(formData);
    onClose();
  };

  if (!task) return null;

  return (
    <div style={{position: 'fixed', top:0, left:0, right:0, bottom:0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
      <div style={{background: 'white', width: '600px', height: '80%', padding: '30px', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto'}}>
        
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <h2>Détails de la tâche</h2>
          <button onClick={onClose} style={{border:'none', background:'transparent', fontSize:'20px', cursor:'pointer'}}>✖</button>
        </div>

        {/* Titre */}
        <label><b>Titre de la tâche</b></label>
        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{padding: '10px', fontSize: '16px'}} />

        {/* Description */}
        <label><b>Description complète</b></label>
        <textarea rows="5" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} style={{padding: '10px'}} placeholder="Détails, consignes..." />

        {/* Ligne : Priorité, Date, Progression */}
        <div style={{display: 'flex', gap: '20px'}}>
            <div style={{flex:1}}>
                <label><b>Priorité</b></label>
                <select value={formData.priority || 'medium'} onChange={e => setFormData({...formData, priority: e.target.value})} style={{width: '100%', padding: '8px'}}>
                    <option value="low">🟢 Basse</option>
                    <option value="medium">🟡 Moyenne</option>
                    <option value="high">🔴 Haute</option>
                </select>
            </div>
            <div style={{flex:1}}>
                <label><b>Échéance</b></label>
                <input type="date" value={formData.due_date ? formData.due_date.split('T')[0] : ''} onChange={e => setFormData({...formData, due_date: e.target.value})} style={{width: '100%', padding: '8px'}} />
            </div>
            <div style={{flex:1}}>
                <label><b>Avancement ({formData.progress || 0}%)</b></label>
                <input type="range" min="0" max="100" value={formData.progress || 0} onChange={e => setFormData({...formData, progress: e.target.value})} style={{width: '100%'}} />
            </div>
        </div>

        {/* Pièce jointe (URL pour l'instant) */}
        <label><b>Fichier / Photo (Lien URL)</b></label>
        <input type="text" placeholder="https://..." value={formData.attachment_url || ''} onChange={e => setFormData({...formData, attachment_url: e.target.value})} style={{padding: '8px'}} />
        {formData.attachment_url && <a href={formData.attachment_url} target="_blank" style={{color: 'blue'}}>Voir le document joint</a>}

        <div style={{marginTop: 'auto', display: 'flex', gap: '10px'}}>
            <button onClick={handleSave} style={{flex:1, padding: '15px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold'}}>ENREGISTRER</button>
        </div>
      </div>
    </div>
  );
}

// --- APP PRINCIPALE ---
function App() {
  const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE URL ICI

  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  // NOUVEAU : GESTION DES VUES
  const [viewMode, setViewMode] = useState('board'); // 'board', 'list', 'gantt'
  const [editingTask, setEditingTask] = useState(null); // La tâche en cours d'édition (pour la modale)

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  // Chargement initial
  useEffect(() => {
    if (token) {
      fetch(`${API_URL}/projects`).then(res => res.json()).then(data => setProjects(data)).catch(console.error)
    }
  }, [token]);

  // Auth Handlers
  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); };
  const handleLogout = () => { setToken(null); setUser(null); localStorage.removeItem('hotel_token'); setSelectedProject(null); };

  // Project Handlers
  const openProject = (project) => {
    setSelectedProject(project);
    fetch(`${API_URL}/tasks/${project.id}`).then(res => res.json()).then(data => setTasks(data));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName) return;
    const res = await fetch(`${API_URL}/projects`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name: newProjectName, owner_id: 1 }) });
    const json = await res.json();
    setProjects([...projects, json]); setNewProjectName("");
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    const res = await fetch(`${API_URL}/tasks`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ project_id: selectedProject.id, title: newTaskTitle }) });
    const json = await res.json();
    setTasks([...tasks, json]); setNewTaskTitle("");
  };

  // NOUVEAU : MISE À JOUR TÂCHE
  const updateTask = async (updatedTask) => {
    // 1. Mise à jour Optimiste (On change l'écran tout de suite)
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    
    // 2. Envoi au serveur
    await fetch(`${API_URL}/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(updatedTask)
    });
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-container">
      {/* MODALE (Si une tâche est ouverte) */}
      {editingTask && <TaskModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={updateTask} />}

      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🏨 Medina Manager V2</h2>
        {selectedProject && <div onClick={() => setSelectedProject(null)} className="menu-item" style={{color: '#aaa', cursor:'pointer'}}>⬅ Retour Projets</div>}
        <div className="menu-item">📊 Dashboard</div>
        <div onClick={handleLogout} className="menu-item" style={{marginTop:'auto', background:'#e53935', textAlign:'center', cursor:'pointer'}}>Déconnexion</div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        {!selectedProject ? (
          <>
            <div className="header"><h1>Vos Projets</h1></div>
            <div style={{background:'white', padding:'20px', borderRadius:'8px', marginBottom:'20px'}}>
                <form onSubmit={handleCreateProject} style={{display:'flex', gap:'10px'}}>
                    <input type="text" placeholder="Nouveau projet..." value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} style={{flex:1, padding:'10px'}} />
                    <button type="submit" style={{background:'#10b981', color:'white', border:'none', padding:'10px 20px', borderRadius:'5px'}}>Créer</button>
                </form>
            </div>
            <div className="projects-grid">
              {projects.map(p => (
                <div key={p.id} className="project-card" onClick={() => openProject(p)}>
                  <div className="project-title">{p.name}</div>
                  <div className="project-desc">{p.description}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <h1>{selectedProject.name}</h1>
              {/* SÉLECTEUR DE VUES (ONGLETS) */}
              <div style={{display:'flex', gap:'5px', background:'#ddd', padding:'5px', borderRadius:'5px'}}>
                <button onClick={() => setViewMode('board')} style={{padding:'5px 15px', border:'none', background: viewMode==='board'?'white':'transparent', cursor:'pointer'}}>Kanban</button>
                <button onClick={() => setViewMode('list')} style={{padding:'5px 15px', border:'none', background: viewMode==='list'?'white':'transparent', cursor:'pointer'}}>Liste (Tableau)</button>
                <button onClick={() => setViewMode('gantt')} style={{padding:'5px 15px', border:'none', background: viewMode==='gantt'?'white':'transparent', cursor:'pointer'}}>Planning</button>
              </div>
            </div>

            {/* --- VUE 1 : KANBAN --- */}
            {viewMode === 'board' && (
                <div style={{display: 'flex', gap: '20px', overflowX: 'auto'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} style={{flex: 1, minWidth: '280px', background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                            <h4 style={{textTransform:'uppercase', marginBottom:'10px'}}>{status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}</h4>
                            {status === 'todo' && (
                                <form onSubmit={handleAddTask} style={{marginBottom:'10px'}}>
                                    <input type="text" placeholder="+ Tâche..." value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'93%', padding:'8px'}} />
                                </form>
                            )}
                            {tasks.filter(t => t.status === status).map(t => (
                                <div key={t.id} onClick={() => setEditingTask(t)} style={{background:'white', padding:'10px', marginBottom:'10px', borderRadius:'5px', cursor:'pointer', borderLeft: `4px solid ${t.priority === 'high' ? 'red' : t.priority === 'low' ? 'green' : 'orange'}`}}>
                                    <div>{t.title}</div>
                                    <div style={{fontSize:'12px', color:'#666', marginTop:'5px', display:'flex', justifyContent:'space-between'}}>
                                        <span>{t.due_date ? new Date(t.due_date).toLocaleDateString() : ''}</span>
                                        <span>{t.progress}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* --- VUE 2 : TABLEAU (LISTE EXCEL) --- */}
            {viewMode === 'list' && (
                <table style={{width:'100%', borderCollapse:'collapse', background:'white'}}>
                    <thead>
                        <tr style={{background:'#f3f4f6', textAlign:'left'}}>
                            <th style={{padding:'10px'}}>Titre</th>
                            <th style={{padding:'10px'}}>Priorité</th>
                            <th style={{padding:'10px'}}>Échéance</th>
                            <th style={{padding:'10px'}}>Progression</th>
                            <th style={{padding:'10px'}}>Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(t => (
                            <tr key={t.id} onClick={() => setEditingTask(t)} style={{borderBottom:'1px solid #eee', cursor:'pointer'}}>
                                <td style={{padding:'10px'}}>{t.title}</td>
                                <td style={{padding:'10px'}}><span style={{color: t.priority==='high'?'red':'orange'}}>{t.priority}</span></td>
                                <td style={{padding:'10px'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td>
                                <td style={{padding:'10px'}}>
                                    <div style={{width:'100px', height:'6px', background:'#eee', borderRadius:'3px'}}>
                                        <div style={{width:`${t.progress}%`, height:'100%', background:'blue', borderRadius:'3px'}}></div>
                                    </div>
                                </td>
                                <td style={{padding:'10px'}}>{t.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* --- VUE 3 : GANTT SIMPLIFIÉ --- */}
            {viewMode === 'gantt' && (
                <div style={{background:'white', padding:'20px', borderRadius:'10px'}}>
                    <h3>Chronologie (Planning)</h3>
                    {tasks.length === 0 && <p>Créez des tâches avec des dates pour voir le planning.</p>}
                    {tasks.filter(t => t.due_date).map(t => (
                        <div key={t.id} style={{display:'flex', alignItems:'center', marginBottom:'10px'}}>
                            <div style={{width:'200px', fontWeight:'bold'}}>{t.title}</div>
                            <div style={{flex:1, background:'#f0f0f0', height:'30px', position:'relative', borderRadius:'5px'}}>
                                {/* Simulation visuelle de la durée (pour l'exemple) */}
                                <div style={{
                                    position:'absolute', 
                                    left: '10%', // Position arbitraire pour la démo
                                    width: `${Math.max(20, Math.random() * 50)}%`, 
                                    background: t.status==='done'?'#10b981':'#3b82f6', 
                                    height:'100%', 
                                    borderRadius:'5px',
                                    color:'white', display:'flex', alignItems:'center', paddingLeft:'10px', fontSize:'12px'
                                }}>
                                    {t.progress}%
                                </div>
                            </div>
                            <div style={{width:'100px', textAlign:'right'}}>{new Date(t.due_date).toLocaleDateString()}</div>
                        </div>
                    ))}
                </div>
            )}

          </>
        )}
      </div>
    </div>
  )
}

export default App