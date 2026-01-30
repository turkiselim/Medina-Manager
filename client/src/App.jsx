import { useEffect, useState } from 'react'
import Login from './Login'

const API_URL = 'https://medina-api.onrender.com'; // <--- VOTRE URL RENDER

// --- COMPOSANT DASHBOARD (ACCUEIL) ---
function Dashboard({ user, onOpenProject }) {
    const [myTasks, setMyTasks] = useState([]);
    const [stats, setStats] = useState({ projects: 0, pending: 0, completed: 0 });
    const [recentProjects, setRecentProjects] = useState([]);

    useEffect(() => {
        // 1. Charger mes tâches
        fetch(`${API_URL}/users/${user.id}/tasks`).then(res=>res.json()).then(setMyTasks);
        // 2. Charger les stats
        fetch(`${API_URL}/stats/${user.id}`).then(res=>res.json()).then(setStats);
        // 3. Charger projets récents (On prend juste les 3 premiers pour l'exemple)
        fetch(`${API_URL}/projects`).then(res=>res.json()).then(data => setRecentProjects(data.slice(0, 4)));
    }, [user]);

    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hour = new Date().getHours();
    const greeting = hour < 18 ? "Bonjour" : "Bonsoir";

    return (
        <div style={{overflowY:'auto', height:'100%'}}>
            {/* EN-TÊTE ACCUEIL */}
            <div className="dash-header">
                <div className="date-sub">{today}</div>
                <div className="greeting">{greeting}, {user.username}</div>
                <div style={{display:'flex', gap:'20px', marginTop:'20px'}}>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.pending}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase'}}>Tâches à faire</div>
                    </div>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#333'}}>{stats.projects}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase'}}>Projets actifs</div>
                    </div>
                    <div style={{background:'white', padding:'15px', borderRadius:'10px', border:'1px solid #e0e0e0', flex:1, textAlign:'center'}}>
                        <div style={{fontSize:'24px', fontWeight:'bold', color:'#10b981'}}>{stats.completed}</div>
                        <div style={{fontSize:'12px', color:'#888', textTransform:'uppercase'}}>Tâches terminées</div>
                    </div>
                </div>
            </div>

            {/* GRILLE WIDGETS */}
            <div className="dash-grid">
                
                {/* WIDGET 1: MES TÂCHES */}
                <div className="widget-card">
                    <div className="widget-header">
                        <span>📋 Mes tâches prioritaires</span>
                        <span style={{fontSize:'12px', color:'#888'}}>Voir tout</span>
                    </div>
                    <div style={{flex:1}}>
                        {myTasks.length === 0 ? (
                            <div style={{padding:'20px', textAlign:'center', color:'#888'}}>Rien à faire, bravo ! 🎉</div>
                        ) : (
                            myTasks.map(t => (
                                <div key={t.id} className="task-row">
                                    <div className="task-check"></div>
                                    <div style={{flex:1}}>
                                        <div style={{fontSize:'14px', fontWeight:'500'}}>{t.title}</div>
                                        <div style={{fontSize:'11px', color:'#888'}}>Projet: {t.project_name} • {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'Pas de date'}</div>
                                    </div>
                                    <div style={{fontSize:'12px', padding:'2px 8px', borderRadius:'4px', background: t.priority==='high'?'#fee2e2':'#f1f5f9', color: t.priority==='high'?'#ef4444':'#64748b'}}>
                                        {t.priority === 'high' ? 'Urgent' : 'Normal'}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* WIDGET 2: PROJETS RÉCENTS */}
                <div className="widget-card">
                    <div className="widget-header">
                        <span>📂 Projets Récents</span>
                    </div>
                    <div style={{padding:'10px'}}>
                        {recentProjects.map(p => (
                            <div key={p.id} onClick={() => onOpenProject(p)} style={{padding:'10px', display:'flex', alignItems:'center', gap:'10px', cursor:'pointer', borderRadius:'6px', transition:'background 0.2s'}} onMouseOver={e=>e.currentTarget.style.background='#f5f5f5'} onMouseOut={e=>e.currentTarget.style.background='white'}>
                                <div style={{width:'30px', height:'30px', background: 'var(--primary)', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'14px'}}>
                                    {p.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{fontSize:'14px', fontWeight:'500'}}>{p.name}</div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

// --- COMPOSANT PROJET (VOTRE ANCIENNE VUE) ---
// Note: J'ai simplifié le code ici pour la lisibilité, mais vous pouvez réintégrer 
// tout votre code Kanban/Liste complexe dans ce composant.
function ProjectView({ project, tasks, members, viewMode, setViewMode, onAddTask, onEditTask, onInvite, user }) {
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const handleDragStart = (e, taskId) => e.dataTransfer.setData("taskId", taskId);
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e, newStatus) => {
        // Logique simplifiée pour l'exemple (à connecter avec votre fonction updateTask du parent)
        console.log("Drop", newStatus);
    };

    return (
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column'}}>
            {/* HEADER PROJET */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'15px'}}>
                    <div style={{width:'40px', height:'40px', background:'var(--primary)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'18px', fontWeight:'bold'}}>
                        {project.name.charAt(0)}
                    </div>
                    <div>
                        <h1 style={{margin:0, fontSize:'20px'}}>{project.name}</h1>
                        <div style={{fontSize:'13px', color:'#888'}}>Projet • {members.length} membres</div>
                    </div>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <div style={{background:'white', border:'1px solid #ddd', borderRadius:'6px', display:'flex', padding:'2px'}}>
                        <button onClick={()=>setViewMode('board')} style={{padding:'5px 10px', border:'none', background: viewMode==='board'?'#eee':'white', cursor:'pointer'}}>Kanban</button>
                        <button onClick={()=>setViewMode('list')} style={{padding:'5px 10px', border:'none', background: viewMode==='list'?'#eee':'white', cursor:'pointer'}}>Liste</button>
                    </div>
                    <button onClick={onInvite} style={{background:'white', border:'1px solid #ddd', padding:'5px 10px', borderRadius:'6px', cursor:'pointer'}}>👤 Inviter</button>
                </div>
            </div>

            {/* VUE KANBAN */}
            {viewMode === 'board' && (
                <div style={{display:'flex', gap:'20px', overflowX:'auto', height:'100%', alignItems:'flex-start'}}>
                    {['todo', 'doing', 'done'].map(status => (
                        <div key={status} style={{minWidth:'300px', background:'#f6f8f9', borderRadius:'10px', padding:'15px'}}>
                            <div style={{fontSize:'12px', fontWeight:'bold', color:'#6d6e70', marginBottom:'15px', textTransform:'uppercase', display:'flex', justifyContent:'space-between'}}>
                                {status === 'todo' ? 'À faire' : status === 'doing' ? 'En cours' : 'Terminé'}
                                <span>{tasks.filter(t=>t.status===status).length}</span>
                            </div>
                            
                            {status === 'todo' && (
                                <form onSubmit={(e)=>{e.preventDefault(); onAddTask(newTaskTitle); setNewTaskTitle("");}} style={{marginBottom:'10px'}}>
                                    <input placeholder="+ Ajouter une tâche" value={newTaskTitle} onChange={e=>setNewTaskTitle(e.target.value)} style={{width:'100%', padding:'10px', border:'1px solid white', borderRadius:'8px', outline:'none', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}} />
                                </form>
                            )}

                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {tasks.filter(t=>t.status===status).map(t => {
                                    const assignee = members.find(m => m.id === t.assignee_id);
                                    return (
                                        <div key={t.id} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', borderRadius:'8px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', cursor:'pointer', borderLeft: `3px solid ${t.priority==='high'?'red':'transparent'}`}}>
                                            <div style={{fontSize:'14px', marginBottom:'5px'}}>{t.title}</div>
                                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                <span style={{fontSize:'11px', color:'#888'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString().slice(0,5) : ''}</span>
                                                {assignee && <div className="avatar" style={{width:'20px', height:'20px', fontSize:'10px'}}>{assignee.username.charAt(0)}</div>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// --- APP PRINCIPALE ---
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  
  // DONNÉES
  const [sites, setSites] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // UI NAVIGATION
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'mytasks', 'project-{id}'
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectData, setProjectData] = useState({ tasks: [], members: [] });
  const [viewMode, setViewMode] = useState('board');
  
  // LOGIN
  const handleLogin = (tok, usr) => { setToken(tok); setUser(usr); localStorage.setItem('hotel_token', tok); };

  // CHARGEMENT INITIAL
  useEffect(() => {
    if (token) {
        // On charge tous les sites et tous les projets d'un coup pour construire la Sidebar
        Promise.all([
            fetch(`${API_URL}/sites`).then(res=>res.json()),
            fetch(`${API_URL}/projects`).then(res=>res.json())
        ]).then(([sitesData, projectsData]) => {
            setSites(sitesData);
            setProjects(projectsData);
        });
    }
  }, [token]);

  // CHARGEMENT PROJET SPÉCIFIQUE
  useEffect(() => {
    if (selectedProject) {
        Promise.all([
            fetch(`${API_URL}/tasks/${selectedProject.id}`).then(res=>res.json()),
            fetch(`${API_URL}/projects/${selectedProject.id}/members`).then(res=>res.json())
        ]).then(([tasks, members]) => {
            setProjectData({ tasks, members });
        });
    }
  }, [selectedProject]);

  // NAVIGATION HANDLER
  const navToProject = (project) => {
      setSelectedProject(project);
      setActiveTab(`project-${project.id}`);
  };

  const createTask = async (title) => {
     const res = await fetch(`${API_URL}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id: selectedProject.id, title})});
     const task = await res.json();
     setProjectData({...projectData, tasks: [...projectData.tasks, task]});
  };

  if (!token) return <Login onLogin={handleLogin} />;

  return (
    <div style={{display:'flex', height:'100vh', width:'100vw'}}>
        
        {/* --- SIDEBAR ASANA STYLE --- */}
        <div className="sidebar" style={{width:'240px', flexShrink:0}}>
            <div className="sidebar-header">
                <span style={{background:'#f06a6a', width:'24px', height:'24px', borderRadius:'6px'}}></span>
                MedinaOS
            </div>

            {/* SECTION HAUTE */}
            <div className="sidebar-section">Accueil</div>
            <div className={`nav-item ${activeTab==='home'?'active':''}`} onClick={()=>{setActiveTab('home'); setSelectedProject(null)}}>
                🏠 Accueil
            </div>
            <div className={`nav-item ${activeTab==='mytasks'?'active':''}`} onClick={()=>{setActiveTab('mytasks'); setSelectedProject(null)}}>
                ✅ Mes tâches
            </div>

            {/* SECTION SITES & PROJETS */}
            {sites.map(site => {
                // On filtre les projets de ce site
                const siteProjects = projects.filter(p => p.site_id === site.id);
                if (siteProjects.length === 0) return null;

                return (
                    <div key={site.id}>
                        <div className="sidebar-section">🏢 {site.name}</div>
                        {siteProjects.map(proj => (
                            <div 
                                key={proj.id} 
                                className={`nav-item ${activeTab===`project-${proj.id}`?'active':''}`}
                                onClick={() => navToProject(proj)}
                            >
                                <span style={{width:'8px', height:'8px', borderRadius:'50%', background: activeTab===`project-${proj.id}`?'var(--primary)':'#666'}}></span>
                                {proj.name}
                            </div>
                        ))}
                    </div>
                );
            })}

            <div style={{marginTop:'auto', padding:'20px'}}>
                <button onClick={()=>{setToken(null); localStorage.removeItem('hotel_token')}} style={{background:'transparent', border:'1px solid #444', color:'white', width:'100%', padding:'8px', borderRadius:'6px', cursor:'pointer'}}>Déconnexion</button>
            </div>
        </div>

        {/* --- CONTENU CENTRAL --- */}
        <div style={{flex:1, overflow:'hidden', background:'white'}}>
            
            {/* VUE ACCUEIL (DASHBOARD) */}
            {activeTab === 'home' && (
                <Dashboard user={user} onOpenProject={navToProject} />
            )}

            {/* VUE MES TÂCHES (À implémenter plus tard, pour l'instant redirige vers Accueil) */}
            {activeTab === 'mytasks' && (
                <div style={{padding:'40px'}}>
                    <h1>Mes Tâches</h1>
                    <p>Liste consolidée de toutes vos tâches sur tous les projets.</p>
                </div>
            )}

            {/* VUE PROJET */}
            {activeTab.startsWith('project-') && selectedProject && (
                <ProjectView 
                    project={selectedProject} 
                    tasks={projectData.tasks} 
                    members={projectData.members} 
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    onAddTask={createTask}
                    onEditTask={(t) => console.log("Edit", t)} // Réutiliser votre modale ici
                    onInvite={() => console.log("Invite")} // Réutiliser votre invite ici
                    user={user}
                />
            )}

        </div>
    </div>
  )
}
