import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION ---
const API_BASE = "https://medina-api.onrender.com"; 

// ==========================================
// COMPOSANT 1 : PAGE ÉQUIPE (MEMBRES)
// ==========================================
function MembersView({ users }) {
    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'24px', color:'#1e293b', marginBottom:'10px'}}>👥 L'Équipe Medina</h1>
            <p style={{color:'#64748b', marginBottom:'30px'}}>Gestion des accès et des collaborateurs.</p>

            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                {users.map(u => (
                    <div key={u.id} style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'15px', border:'1px solid #f1f5f9'}}>
                        <div style={{width:'50px', height:'50px', background: u.role==='admin'?'#1e293b':'#3b82f6', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold'}}>
                            {u.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div style={{fontWeight:'bold', color:'#1e293b', fontSize:'16px'}}>{u.username}</div>
                            <div style={{color: u.role==='admin'?'#ef4444':'#64748b', fontSize:'12px', textTransform:'uppercase', fontWeight:'bold', marginTop:'2px'}}>
                                {u.role === 'admin' ? '🛡️ Administrateur' : '👤 Collaborateur'}
                            </div>
                            <div style={{fontSize:'12px', color:'#94a3b8', marginTop:'2px'}}>{u.email}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ==========================================
// COMPOSANT 2 : DASHBOARD
// ==========================================
function Dashboard({ projects, tasks, user, onOpenProject, allUsers }) {
    // Mode ADMIN
    if (user.role === 'admin') {
        const totalProjects = projects.length;
        const totalTasks = tasks.filter(t => !t.deleted_at).length;
        const tasksUrgent = tasks.filter(t => t.priority === 'high' && t.status !== 'done' && !t.deleted_at);
        const globalProgress = totalTasks === 0 ? 0 : Math.round((tasks.filter(t=>t.status==='done').length / totalTasks) * 100);

        return (
            <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
                <h1 style={{fontSize:'26px', color:'#1e293b', marginBottom:'5px'}}>🏰 Tour de Contrôle</h1>
                <p style={{color:'#64748b', marginBottom:'30px'}}>Vue d'ensemble stratégique.</p>

                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'40px'}}>
                    <div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #2563eb', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'700', letterSpacing:'0.5px'}}>PROJETS ACTIFS</div>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'#1e293b', marginTop:'5px'}}>{totalProjects}</div>
                    </div>
                    <div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #ef4444', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'700', letterSpacing:'0.5px'}}>URGENCES</div>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'#ef4444', marginTop:'5px'}}>{tasksUrgent.length}</div>
                    </div>
                    <div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #10b981', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'700', letterSpacing:'0.5px'}}>PROGRESSION</div>
                        <div style={{fontSize:'32px', fontWeight:'800', color:'#10b981', marginTop:'5px'}}>{globalProgress}%</div>
                    </div>
                </div>

                <h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155', marginBottom:'20px'}}>🔥 Alertes Prioritaires</h3>
                <div style={{background:'white', borderRadius:'16px', border:'1px solid #f1f5f9', overflow:'hidden'}}>
                    {tasksUrgent.length === 0 ? (
                        <div style={{padding:'30px', textAlign:'center', color:'#94a3b8'}}>Tout est calme. Aucune urgence signalée. 🍵</div>
                    ) : (
                        tasksUrgent.map(t => (
                            <div key={t.id} onClick={() => onOpenProject(t.project_id)} style={{padding:'15px 25px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', transition:'0.2s', ':hover':{background:'#f8fafc'}}}>
                                <div>
                                    <div style={{fontWeight:'600', color:'#334155'}}>{t.title}</div>
                                    <div style={{fontSize:'12px', color:'#ef4444', marginTop:'2px'}}>⚠️ Urgent • Projet #{t.project_id}</div>
                                </div>
                                <button style={{fontSize:'12px', padding:'6px 12px', background:'#fee2e2', color:'#b91c1c', border:'none', borderRadius:'6px', fontWeight:'600', cursor:'pointer'}}>Traiter ➔</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }

    // Mode COLLABORATEUR
    const myTasks = tasks.filter(t => t.assignee_id === user.id && !t.deleted_at && t.status !== 'done');
    const getProjectName = (pid) => { const p = projects.find(proj => proj.id === pid); return p ? p.name : 'Projet inconnu'; };

    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'24px', color:'#1e293b'}}>Bonjour, {user.username} 👋</h1>
            <p style={{color:'#64748b', marginBottom:'30px'}}>Voici votre feuille de route.</p>

            <h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155', marginBottom:'15px'}}>🎯 Vos Tâches ({myTasks.length})</h3>
            <div style={{background:'white', borderRadius:'16px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)', overflow:'hidden'}}>
                {myTasks.length === 0 ? (
                    <div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Aucune tâche en attente. Bon travail ! 🎉</div>
                ) : (
                    myTasks.map(t => (
                        <div key={t.id} onClick={() => onOpenProject(t.project_id)} style={{padding:'20px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                            <div>
                                <div style={{fontWeight:'600', color:'#334155', fontSize:'15px'}}>{t.title}</div>
                                <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>📁 {getProjectName(t.project_id)}</div>
                            </div>
                            {t.priority==='high' && <span style={{fontSize:'11px', background:'#fee2e2', color:'#ef4444', padding:'4px 8px', borderRadius:'6px', fontWeight:'bold'}}>URGENT</span>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ==========================================
// COMPOSANT 3 : VUE PROJET (KANBAN)
// ==========================================
function ProjectView({ project, tasks, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");

    const getSortedTasks = (taskList) => {
        return [...taskList].sort((a, b) => {
            const prio = { high: 3, normal: 2, low: 1 };
            return (prio[b.priority] || 2) - (prio[a.priority] || 2);
        });
    };

    const dragStart = (e, id) => e.dataTransfer.setData("taskId", id);
    const drop = (e, status) => { 
        const id = e.dataTransfer.getData("taskId"); 
        const t = tasks.find(x => x.id.toString() === id); 
        if (t && t.status !== status) onUpdateTask({...t, status}); 
    };
    
    const getName = (id) => { const u = allUsers.find(x => x.id === id); return u ? u.username : '-'; };

    const exportPDF = () => { 
        const doc = new jsPDF(); 
        doc.text(`Rapport: ${project.name}`, 14, 20); 
        const tableData = tasks.map(t => [t.title, t.status, getName(t.assignee_id), t.due_date||'-']); 
        autoTable(doc, { head: [['Tâche', 'Statut', 'Qui', 'Date']], body: tableData, startY: 30 }); 
        doc.save(`${project.name}.pdf`); 
    };

    return ( 
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'25px', borderBottom:'1px solid #f1f5f9', paddingBottom:'15px'}}>
                <div>
                    <h2 style={{margin:0, fontSize:'22px', color:'#1e293b'}}>{project.name}</h2>
                    <span style={{fontSize:'13px', color:'#64748b'}}>{tasks.length} tâches actives</span>
                </div>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={exportPDF} style={{background:'white', border:'1px solid #cbd5e1', padding:'8px 15px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', color:'#475569'}}>📥 Exporter</button>
                    {user.role==='admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'#ef4444', border:'none', padding:'8px 15px', borderRadius:'8px', fontSize:'13px', cursor:'pointer', fontWeight:'bold'}}>Supprimer</button>}
                </div>
            </div>

            <div style={{display:'flex', gap:'5px', marginBottom:'20px'}}>
                <button onClick={()=>setViewMode('board')} style={{padding:'8px 16px', border:'none', borderRadius:'6px', background:viewMode==='board'?'#e2e8f0':'transparent', fontWeight:viewMode==='board'?'bold':'normal', color:'#334155', cursor:'pointer'}}>Kanban</button>
                <button onClick={()=>setViewMode('list')} style={{padding:'8px 16px', border:'none', borderRadius:'6px', background:viewMode==='list'?'#e2e8f0':'transparent', fontWeight:viewMode==='list'?'bold':'normal', color:'#334155', cursor:'pointer'}}>Liste</button>
            </div>

            {viewMode==='board' && 
                <div style={{display:'flex', gap:'20px', overflowX:'auto', paddingBottom:'10px', height:'100%'}}>
                    {['todo', 'doing', 'done'].map(s => {
                        const columnTasks = getSortedTasks(tasks.filter(t => (t.status || 'todo').toLowerCase() === s));
                        return (
                        <div key={s} onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,s)} style={{flex:'0 0 320px', background:'#f8fafc', padding:'15px', borderRadius:'12px', height:'fit-content', maxHeight:'100%', overflowY:'auto', border:'1px solid #f1f5f9'}}>
                            <div style={{fontWeight:'700', marginBottom:'15px', textTransform:'uppercase', color:'#64748b', fontSize:'11px', display:'flex', justifyContent:'space-between', letterSpacing:'1px'}}>
                                {s === 'todo' ? 'À FAIRE' : s === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                <span style={{background:'#e2e8f0', borderRadius:'20px', padding:'2px 8px', fontSize:'10px', color:'#475569'}}>{columnTasks.length}</span>
                            </div>
                            
                            {(s==='todo' || user.role === 'admin') && 
                                <form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}>
                                    <input placeholder="+ Ajouter une tâche..." value={newTask} onChange={e=>setNewTask(e.target.value)} style={{width:'100%', padding:'12px', marginBottom:'15px', border:'1px solid #e2e8f0', borderRadius:'8px', fontSize:'14px', boxShadow:'0 1px 2px rgba(0,0,0,0.05)'}}/>
                                </form>
                            }

                            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                {columnTasks.map(t => {
                                    const isUrgent = t.priority === 'high';
                                    return (
                                        <div key={t.id} draggable onDragStart={e=>dragStart(e,t.id)} onClick={()=>onEditTask(t)} 
                                             style={{
                                                 background: 'white',
                                                 border: '1px solid #e2e8f0',
                                                 borderLeft: isUrgent ? '4px solid #ef4444' : '1px solid #e2e8f0',
                                                 padding:'15px', borderRadius:'8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                                 cursor: 'pointer', transition:'0.2s'
                                             }}>
                                            <div style={{fontWeight:'600', fontSize:'14px', color:'#334155', lineHeight:'1.4'}}>{t.title}</div>
                                            <div style={{fontSize:'11px', color:'#94a3b8', marginTop:'8px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                                    <div style={{width:'16px', height:'16px', borderRadius:'50%', background:'#cbd5e1', color:'white', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center'}}>{getName(t.assignee_id).charAt(0)}</div>
                                                    <span>{getName(t.assignee_id)}</span>
                                                </div>
                                                {t.due_date && <span style={{background:'#f1f5f9', padding:'2px 6px', borderRadius:'4px'}}>📅 {new Date(t.due_date).toLocaleDateString().slice(0,5)}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            }
            {viewMode==='list' && <div style={{overflowX:'auto'}}><table style={{width:'100%', fontSize:'14px', borderCollapse:'collapse'}}><tbody>{tasks.map(t=>(<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #f1f5f9', cursor:'pointer'}}><td style={{padding:'15px', color:'#334155'}}>{t.title}</td><td style={{padding:'15px', color:'#64748b'}}>{t.status}</td><td style={{padding:'15px', color:'#64748b'}}>{getName(t.assignee_id)}</td></tr>))}</tbody></table></div>}
        </div> 
    );
}

// ==========================================
// COMPOSANT 4 : SIDEBAR (ACCORDÉON)
// ==========================================
function Sidebar({ sites, projects, activeProject, setActiveProject, onLogout, onCreateProject, user, currentPage, setPage }) {
    // État pour savoir quels sites sont ouverts (Accordéon)
    const [expandedSites, setExpandedSites] = useState({});

    const toggleSite = (siteId) => {
        setExpandedSites(prev => ({...prev, [siteId]: !prev[siteId]}));
    };

    return (
        <div style={{width:'260px', background:'#1e293b', color:'white', display:'flex', flexDirection:'column', height:'100%', borderRight:'1px solid #334155'}}>
            {/* Header */}
            <div style={{padding:'25px 20px', borderBottom:'1px solid #334155'}}>
                <div style={{fontSize:'18px', fontWeight:'800', letterSpacing:'-0.5px', color:'white'}}>Medina Manager <span style={{color:'#3b82f6'}}>.</span></div>
                <div style={{fontSize:'12px', color:'#64748b', marginTop:'5px'}}>v1.0 Executive</div>
            </div>

            {/* Menu Principal */}
            <div style={{padding:'20px 10px', flex:1, overflowY:'auto'}}>
                <div style={{fontSize:'11px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', padding:'0 10px', marginBottom:'10px'}}>Général</div>
                
                <div onClick={()=>setPage('dashboard')} 
                     style={{padding:'10px', borderRadius:'8px', cursor:'pointer', background:currentPage==='dashboard'?'#334155':'transparent', color:currentPage==='dashboard'?'white':'#94a3b8', fontWeight:currentPage==='dashboard'?'bold':'normal', display:'flex', alignItems:'center', gap:'10px', marginBottom:'5px'}}>
                    🏠 Tableau de Bord
                </div>
                <div onClick={()=>setPage('members')} 
                     style={{padding:'10px', borderRadius:'8px', cursor:'pointer', background:currentPage==='members'?'#334155':'transparent', color:currentPage==='members'?'white':'#94a3b8', fontWeight:currentPage==='members'?'bold':'normal', display:'flex', alignItems:'center', gap:'10px'}}>
                    👥 Équipe
                </div>

                <div style={{height:'1px', background:'#334155', margin:'20px 10px'}}></div>

                <div style={{fontSize:'11px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', padding:'0 10px', marginBottom:'10px'}}>Espaces de Travail</div>
                
                {/* Liste des SITES (Accordéon) */}
                {sites.map(site => {
                    const siteProjects = projects.filter(p => p.site_id === site.id);
                    const isOpen = expandedSites[site.id];

                    return (
                        <div key={site.id} style={{marginBottom:'5px'}}>
                            {/* Titre du Site (Cliquable pour ouvrir) */}
                            <div onClick={()=>toggleSite(site.id)} 
                                 style={{padding:'10px', borderRadius:'8px', cursor:'pointer', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center', fontWeight:'600', fontSize:'14px', ':hover':{background:'#334155'}}}>
                                <span>📂 {site.name}</span>
                                <span style={{fontSize:'10px', color:'#64748b'}}>{isOpen ? '▼' : '▶'}</span>
                            </div>

                            {/* Liste des Projets (Si ouvert) */}
                            {isOpen && (
                                <div style={{paddingLeft:'15px', marginTop:'5px', borderLeft:'1px solid #334155', marginLeft:'15px'}}>
                                    {siteProjects.map(p => (
                                        <div key={p.id} onClick={()=>{setActiveProject(p.id); setPage('project');}} 
                                             style={{padding:'8px 10px', borderRadius:'6px', cursor:'pointer', color:activeProject===p.id?'#60a5fa':'#cbd5e1', fontSize:'13px', background:activeProject===p.id?'rgba(59, 130, 246, 0.1)':'transparent', marginBottom:'2px'}}>
                                            {p.name}
                                        </div>
                                    ))}
                                    {/* Bouton Ajouter Projet */}
                                    {user.role === 'admin' && (
                                        <div onClick={()=>{ const n = prompt("Nouveau projet pour "+site.name+" ?"); if(n) onCreateProject(site.id, n); }} 
                                             style={{padding:'8px 10px', cursor:'pointer', color:'#64748b', fontSize:'12px', fontStyle:'italic', display:'flex', alignItems:'center', gap:'5px'}}>
                                            + Nouveau projet
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer User */}
            <div style={{padding:'20px', borderTop:'1px solid #334155', background:'#0f172a'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'15px'}}>
                    <div style={{width:'35px', height:'35px', borderRadius:'50%', background:'#3b82f6', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{user.username.charAt(0)}</div>
                    <div>
                        <div style={{fontSize:'13px', fontWeight:'bold'}}>{user.username}</div>
                        <div style={{fontSize:'11px', color:'#64748b'}}>{user.role}</div>
                    </div>
                </div>
                <button onClick={onLogout} style={{width:'100%', padding:'8px', background:'transparent', border:'1px solid #ef4444', color:'#ef4444', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}>Déconnexion</button>
            </div>
        </div>
    );
}

// ==========================================
// MAIN APP
// ==========================================
function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [currentPage, setCurrentPage] = useState('dashboard'); // 'dashboard', 'members', 'project'
    const [sites, setSites] = useState([]); 
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [viewMode, setViewMode] = useState('board');
    const [editingTask, setEditingTask] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const isMobile = window.innerWidth < 768;

    useEffect(() => { if (user) fetchData(); }, [user]);

    const fetchData = async () => {
        try {
            const h = { headers: { 'Authorization': user.token } };
            const [resSites, resProjs, resTasks, resUsers] = await Promise.all([
                fetch(`${API_BASE}/sites`, h), fetch(`${API_BASE}/projects`, h),
                fetch(`${API_BASE}/tasks`, h), fetch(`${API_BASE}/users`, h)
            ]);
            if(resSites.ok) setSites(await resSites.json());
            if(resProjs.ok) setProjects(await resProjs.json());
            if(resTasks.ok) setTasks(await resTasks.json());
            if(resUsers.ok) setAllUsers(await resUsers.json());
        } catch (err) { console.error(err); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value }) });
            const data = await res.json();
            if (res.ok) { setUser(data); localStorage.setItem('user', JSON.stringify(data)); } else alert(data.message);
        } catch (err) { alert("Erreur connexion"); }
    };

    if (!user) return (
        <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9'}}>
            <form onSubmit={handleLogin} style={{background:'white', padding:'40px', borderRadius:'20px', boxShadow:'0 20px 40px rgba(0,0,0,0.05)', width:'320px'}}>
                <h2 style={{textAlign:'center', color:'#1e293b', marginBottom:'30px', fontWeight:'800'}}>Medina OS 🏨</h2>
                <input name="email" placeholder="Email" style={{width:'100%', padding:'15px', marginBottom:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'14px'}} />
                <input name="password" type="password" placeholder="Mot de passe" style={{width:'100%', padding:'15px', marginBottom:'25px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'14px'}} />
                <button type="submit" style={{width:'100%', padding:'15px', background:'#1e293b', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', fontSize:'15px'}}>Connexion</button>
            </form>
        </div>
    );

    const activeProjectData = projects.find(p => p.id === activeProject);
    const activeProjectTasks = tasks.filter(t => t.project_id === activeProject && !t.deleted_at);

    return (
        <div style={{display:'flex', height:'100vh', fontFamily:'"Inter", "Segoe UI", sans-serif', overflow:'hidden'}}>
            {/* Mobile Toggle */}
            {isMobile && <button onClick={()=>setIsMobileMenuOpen(!isMobileMenuOpen)} style={{position:'fixed', top:10, left:10, zIndex:1000, background:'#1e293b', color:'white', border:'none', padding:'10px', borderRadius:'8px'}}>☰</button>}

            {/* Sidebar Container */}
            <div style={{
                position: isMobile ? 'fixed' : 'relative', zIndex:999, height:'100%',
                transform: (isMobile && !isMobileMenuOpen) ? 'translateX(-100%)' : 'translateX(0)', transition:'transform 0.3s'
            }}>
                <Sidebar 
                    sites={sites} projects={projects} activeProject={activeProject} user={user}
                    setActiveProject={setActiveProject} currentPage={currentPage} setPage={(p)=>{setCurrentPage(p); if(p!=='project') setActiveProject(null); if(isMobile) setIsMobileMenuOpen(false);}}
                    onLogout={()=>{setUser(null); localStorage.removeItem('user');}}
                    onCreateProject={async (sid, n)=>{ await fetch(`${API_BASE}/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({site_id:sid, name:n, owner_id:user.id})}); fetchData(); }}
                />
            </div>

            {/* Main Content */}
            <div style={{flex:1, overflowY:'auto', background:'#f8fafc', position:'relative'}}>
                {currentPage === 'members' && <MembersView users={allUsers} />}
                
                {currentPage === 'dashboard' && (
                    <Dashboard projects={projects} tasks={tasks} user={user} allUsers={allUsers} onOpenProject={(pid)=>{setActiveProject(pid); setCurrentPage('project');}} />
                )}

                {currentPage === 'project' && activeProject && (
                    <ProjectView 
                        project={activeProjectData} tasks={activeProjectTasks} allUsers={allUsers} user={user}
                        viewMode={viewMode} setViewMode={setViewMode}
                        onAddTask={async (t)=>{ await fetch(`${API_BASE}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id:activeProject, title:t, status:'todo', priority:'normal', assignee_id:user.id})}); fetchData(); }}
                        onEditTask={setEditingTask}
                        onUpdateTask={async (t)=>{ await fetch(`${API_BASE}/tasks/${t.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(t)}); fetchData(); }}
                        onDeleteProject={async (id)=>{ if(confirm("Supprimer ?")) { await fetch(`${API_BASE}/projects/${id}`, {method:'DELETE'}); setActiveProject(null); setCurrentPage('dashboard'); fetchData(); } }}
                    />
                )}
            </div>

            {/* Modal Edit Task (Avec bouton Supprimer) */}
            {editingTask && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                    <div style={{background:'white', padding:'30px', borderRadius:'16px', width:'100%', maxWidth:'450px', display:'flex', flexDirection:'column', gap:'20px', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                        <h3 style={{margin:0, color:'#1e293b', fontSize:'20px'}}>Modifier la tâche</h3>
                        <input value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} style={{padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', fontSize:'15px'}} />
                        
                        <div style={{display:'flex', gap:'15px'}}>
                            <select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                                <option value="todo">À faire</option>
                                <option value="doing">En cours</option>
                                <option value="done">Terminé</option>
                            </select>
                            <select value={editingTask.priority || 'normal'} onChange={e=>setEditingTask({...editingTask, priority:e.target.value})} style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                                <option value="low">Basse</option>
                                <option value="normal">Normale</option>
                                <option value="high">Haute 🔥</option>
                            </select>
                        </div>
                        
                        {user.role === 'admin' && (
                            <select value={editingTask.assignee_id || ''} onChange={e=>setEditingTask({...editingTask, assignee_id:parseInt(e.target.value)})} style={{padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1'}}>
                                <option value="">-- Assigner à --</option>
                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        )}

                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'10px'}}>
                            <button onClick={async ()=>{ if(confirm("Supprimer ?")) { await fetch(`${API_BASE}/tasks/${editingTask.id}`, { method:'DELETE' }); fetchData(); setEditingTask(null); }}} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontWeight:'bold', fontSize:'13px'}}>🗑️ Supprimer</button>
                            <div style={{display:'flex', gap:'10px'}}>
                                <button onClick={()=>setEditingTask(null)} style={{padding:'10px 20px', border:'none', background:'#f1f5f9', color:'#64748b', borderRadius:'8px', cursor:'pointer', fontWeight:'600'}}>Annuler</button>
                                <button onClick={async ()=>{ await fetch(`${API_BASE}/tasks/${editingTask.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editingTask)}); fetchData(); setEditingTask(null); }} style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'600'}}>Enregistrer</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;