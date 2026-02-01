import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION ---
// Assurez-vous que cette adresse est EXACTEMENT celle de votre API Render (pas .app !)
const API_BASE = "https://medina-api.onrender.com"; 

// ==========================================
// COMPOSANT 1 : DASHBOARD (INTELLIGENT & ADMIN)
// ==========================================
function Dashboard({ projects, tasks, user, onOpenProject, allUsers }) {
    
    // --- MODE DIRECTEUR (ADMIN) ---
    if (user.role === 'admin') {
        // Statistiques globales
        const totalProjects = projects.length;
        const totalTasks = tasks.filter(t => !t.deleted_at).length;
        const tasksDone = tasks.filter(t => t.status === 'done' && !t.deleted_at).length;
        const tasksUrgent = tasks.filter(t => t.priority === 'high' && t.status !== 'done' && !t.deleted_at);
        const globalProgress = totalTasks === 0 ? 0 : Math.round((tasksDone / totalTasks) * 100);

        return (
            <div style={{padding:'20px', background:'#f8fafc', minHeight:'100vh'}}>
                <h1 style={{fontSize:'24px', color:'#1e293b', marginBottom:'5px'}}>🏰 Tour de Contrôle</h1>
                <p style={{color:'#64748b', marginBottom:'30px'}}>Vue d'ensemble stratégique de l'hôtel Medina Bélisaire & Thalasso.</p>

                {/* KPI GLOBAL */}
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                    <div style={{background:'white', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #2563eb', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>PROJETS ACTIFS</div>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'#1e293b'}}>{totalProjects}</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #ef4444', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>URGENCES EN COURS</div>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'#ef4444'}}>{tasksUrgent.length}</div>
                    </div>
                    <div style={{background:'white', padding:'20px', borderRadius:'12px', borderLeft:'5px solid #10b981', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                        <div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>AVANCEMENT GLOBAL</div>
                        <div style={{fontSize:'28px', fontWeight:'800', color:'#10b981'}}>{globalProgress}%</div>
                    </div>
                </div>

                {/* ALERTES URGENTES */}
                <h3 style={{fontSize:'16px', fontWeight:'bold', color:'#334155', marginTop:'30px'}}>🔥 Points d'attention (Urgences)</h3>
                <div style={{background:'white', borderRadius:'12px', overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', marginTop:'15px'}}>
                    {tasksUrgent.length === 0 ? (
                        <div style={{padding:'20px', color:'#94a3b8', textAlign:'center'}}>R.A.S. Tout est sous contrôle.</div>
                    ) : (
                        tasksUrgent.map(t => (
                            <div key={t.id} onClick={() => onOpenProject(t.project_id)} style={{padding:'15px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                <div>
                                    <div style={{fontWeight:'600', color:'#334155'}}>{t.title}</div>
                                    <div style={{fontSize:'12px', color:'#ef4444'}}>Projet ID: {t.project_id}</div>
                                </div>
                                <button style={{fontSize:'12px', padding:'5px 10px', background:'#fee2e2', color:'#ef4444', border:'none', borderRadius:'5px'}}>Voir</button>
                            </div>
                        ))
                    )}
                </div>

                {/* VUE ÉQUIPE */}
                <h3 style={{fontSize:'16px', fontWeight:'bold', color:'#334155', marginTop:'30px'}}>👥 Charge de travail par membre</h3>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:'15px', marginTop:'15px'}}>
                    {allUsers.map(u => {
                        const userTasks = tasks.filter(t => t.assignee_id === u.id && t.status !== 'done' && !t.deleted_at);
                        return (
                            <div key={u.id} style={{background:'white', padding:'15px', borderRadius:'10px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                                <div style={{fontWeight:'bold', color:'#1e293b'}}>{u.username}</div>
                                <div style={{fontSize:'12px', color:'#64748b'}}>{u.role === 'admin' ? 'Directeur' : 'Collaborateur'}</div>
                                <div style={{marginTop:'10px', height:'4px', background:'#f1f5f9', borderRadius:'2px'}}>
                                    <div style={{width:`${Math.min(userTasks.length * 10, 100)}%`, height:'100%', background: userTasks.length > 5 ? '#ef4444' : '#3b82f6'}}></div>
                                </div>
                                <div style={{marginTop:'5px', fontSize:'11px', textAlign:'right', color:'#64748b'}}>{userTasks.length} tâches actives</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    // --- MODE UTILISATEUR STANDARD (Employé) ---
    const myTasks = tasks.filter(t => t.assignee_id === user.id && !t.deleted_at);
    const myPending = myTasks.filter(t => t.status !== 'done');
    const myUrgent = myPending.filter(t => t.priority === 'high');
    const myDone = myTasks.filter(t => t.status === 'done');
    const total = myTasks.length;
    const progress = total === 0 ? 0 : Math.round((myDone.length / total) * 100);

    const getProjectName = (pid) => { const p = projects.find(proj => proj.id === pid); return p ? p.name : 'Projet inconnu'; };

    return (
        <div style={{padding:'20px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'22px', color:'#1e293b'}}>Bonjour, {user.username} 👋</h1>
            <p style={{color:'#64748b', fontSize:'14px', marginBottom:'20px'}}>Voici votre mission du jour.</p>

            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'10px', marginBottom:'20px'}}>
                <div style={{background:'white', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'24px', fontWeight:'bold', color:'#3b82f6'}}>{myPending.length}</div>
                    <div style={{fontSize:'10px', color:'#64748b', textTransform:'uppercase'}}>À faire</div>
                </div>
                <div style={{background:'white', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'24px', fontWeight:'bold', color:'#ef4444'}}>{myUrgent.length}</div>
                    <div style={{fontSize:'10px', color:'#64748b', textTransform:'uppercase'}}>Urgences</div>
                </div>
                <div style={{background:'white', padding:'15px', borderRadius:'10px', textAlign:'center', border:'1px solid #e2e8f0'}}>
                    <div style={{fontSize:'24px', fontWeight:'bold', color:'#10b981'}}>{progress}%</div>
                    <div style={{fontSize:'10px', color:'#64748b', textTransform:'uppercase'}}>Efficacité</div>
                </div>
            </div>

            <h3 style={{fontSize:'16px', fontWeight:'bold', color:'#334155', marginBottom:'10px'}}>🎯 Mes Tâches</h3>
            <div style={{background:'white', borderRadius:'10px', overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                {myPending.length === 0 ? (
                    <div style={{padding:'30px', textAlign:'center', color:'#cbd5e1'}}>Aucune tâche. Profitez-en ! ☕</div>
                ) : (
                    myPending.map(t => (
                        <div key={t.id} onClick={() => onOpenProject(t.project_id)} style={{padding:'15px', borderBottom:'1px solid #f1f5f9', cursor:'pointer'}}>
                            <div style={{display:'flex', justifyContent:'space-between'}}>
                                <span style={{fontWeight:'600', color:'#334155'}}>{t.title}</span>
                                {t.priority === 'high' && <span style={{fontSize:'10px', background:'#fee2e2', color:'#ef4444', padding:'2px 6px', borderRadius:'4px'}}>URGENT</span>}
                            </div>
                            <div style={{fontSize:'12px', color:'#64748b', marginTop:'5px'}}>
                                📁 {getProjectName(t.project_id)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

// ==========================================
// COMPOSANT 2 : VUE PROJET (KANBAN INTELLIGENT)
// ==========================================
function ProjectView({ project, tasks, members, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");

    // TRI INTELLIGENT
    const getSortedTasks = (taskList) => {
        return [...taskList].sort((a, b) => {
            // L'Admin voit les urgences en premier, pas "ses" tâches (puisqu'il supervise)
            if (user.role === 'admin') {
                const prioScore = { high: 3, normal: 2, low: 1 };
                return (prioScore[b.priority] || 2) - (prioScore[a.priority] || 2);
            }
            // Logic pour utilisateur normal
            const isMineA = a.assignee_id === user.id;
            const isMineB = b.assignee_id === user.id;
            const prioScore = { high: 3, normal: 2, low: 1 };
            if (isMineA && !isMineB) return -1;
            if (!isMineA && isMineB) return 1;
            return (prioScore[b.priority] || 2) - (prioScore[a.priority] || 2);
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
        doc.text(`Rapport Projet: ${project.name}`, 14, 20); 
        doc.setFontSize(10); 
        const tableData = tasks.map(t => [t.title, t.status, getName(t.assignee_id), t.due_date ? new Date(t.due_date).toLocaleDateString() : '-']); 
        autoTable(doc, { head: [['Tâche', 'Statut', 'Assigné à', 'Échéance']], body: tableData, startY: 35 }); 
        doc.save(`${project.name}_rapport.pdf`); 
    };

    return ( 
        <div style={{padding:'20px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'32px', height:'32px', background:'#2563eb', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>{project.name.charAt(0)}</div>
                    <h2 style={{margin:0, fontSize:'18px'}}>{project.name}</h2>
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={exportPDF} style={{background:'#fff', border:'1px solid #ccc', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer'}}>📄 PDF</button>
                    {user.role==='admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer'}}>🗑️</button>}
                </div>
            </div>

            <div style={{display:'flex', gap:'5px', marginBottom:'15px', background:'#f8fafc', padding:'3px', borderRadius:'6px', width:'fit-content'}}>
                <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background:viewMode==='board'?'white':'transparent', fontWeight:viewMode==='board'?'bold':'normal', boxShadow:viewMode==='board'?'0 1px 2px rgba(0,0,0,0.1)':'none', cursor:'pointer'}}>Kanban</button>
                <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background:viewMode==='list'?'white':'transparent', fontWeight:viewMode==='list'?'bold':'normal', boxShadow:viewMode==='list'?'0 1px 2px rgba(0,0,0,0.1)':'none', cursor:'pointer'}}>Liste</button>
            </div>

            {viewMode==='board' && 
                <div style={{display:'flex', gap:'15px', overflowX:'auto', paddingBottom:'10px'}}>
                    {['todo', 'doing', 'done'].map(s => {
                        const columnTasks = getSortedTasks(tasks.filter(t => (t.status || 'todo').toLowerCase() === s));
                        return (
                        <div key={s} className="kanban-col" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,s)} style={{flex:'0 0 280px', minWidth:'280px', background:'#f8fafc', padding:'10px', borderRadius:'8px', minHeight:'200px'}}>
                            <div style={{fontWeight:'700', marginBottom:'10px', textTransform:'uppercase', color:'#475569', fontSize:'11px', display:'flex', justifyContent:'space-between'}}>
                                {s === 'todo' ? 'À FAIRE' : s === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                <span style={{background:'#e2e8f0', borderRadius:'10px', padding:'0 6px'}}>{columnTasks.length}</span>
                            </div>
                            
                            {(s==='todo' || user.role === 'admin') && 
                                <form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}>
                                    <input placeholder="+ Tâche..." value={newTask} onChange={e=>setNewTask(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'13px'}}/>
                                </form>
                            }

                            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                {columnTasks.map(t => {
                                    const isMine = t.assignee_id === user.id;
                                    const isUrgent = t.priority === 'high';
                                    const canMove = isMine || user.role === 'admin';

                                    return (
                                        <div key={t.id} draggable={canMove} onDragStart={e=>dragStart(e,t.id)} onClick={()=>onEditTask(t)} 
                                             style={{
                                                 background: 'white',
                                                 borderLeft: isUrgent ? '4px solid #ef4444' : (isMine ? '4px solid #3b82f6' : '4px solid #cbd5e1'),
                                                 padding:'10px', borderRadius:'6px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                 opacity: (user.role === 'admin' || isMine) ? 1 : 0.7, 
                                                 cursor: 'pointer'
                                             }}>
                                            <div style={{fontWeight:'600', fontSize:'13px', color:'#1e293b'}}>{t.title}</div>
                                            <div style={{fontSize:'10px', color:'#64748b', marginTop:'4px', display:'flex', justifyContent:'space-between'}}>
                                                <span>{getName(t.assignee_id)}</span>
                                                {t.due_date && <span>📅 {new Date(t.due_date).toLocaleDateString().slice(0,5)}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )})}
                </div>
            }
            {viewMode==='list' && 
                 <div style={{overflowX:'auto'}}><table style={{width:'100%', fontSize:'13px'}}><tbody>{tasks.map(t=>(<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee'}}><td style={{padding:'8px'}}>{t.title}</td><td style={{padding:'8px'}}>{getName(t.assignee_id)}</td></tr>))}</tbody></table></div>
            }
        </div> 
    );
}

// ==========================================
// COMPOSANT 3 : APPLICATION PRINCIPALE
// ==========================================
function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [sites, setSites] = useState([]); 
    const [projects, setProjects] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeProject, setActiveProject] = useState(null);
    const [viewMode, setViewMode] = useState('board');
    const [editingTask, setEditingTask] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false); // Pour le mobile

    // Détection Mobile
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
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value })
            });
            const data = await res.json();
            if (res.ok) { setUser(data); localStorage.setItem('user', JSON.stringify(data)); } 
            else alert(data.message);
        } catch (err) { alert("Erreur connexion"); }
    };

    const handleCreateProject = async (siteId, name) => {
        if(user.role !== 'admin') return alert("Seul le Directeur peut créer des projets.");
        await fetch(`${API_BASE}/projects`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ site_id: siteId, name, owner_id: user.id }) });
        fetchData();
    };

    // --- RENDER ---
    if (!user) {
        return (
            <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9', padding:'20px'}}>
                <form onSubmit={handleLogin} style={{background:'white', padding:'30px', borderRadius:'15px', boxShadow:'0 10px 25px rgba(0,0,0,0.05)', width:'100%', maxWidth:'350px'}}>
                    <h2 style={{textAlign:'center', color:'#1e293b', marginBottom:'20px'}}>Medina OS 🏨</h2>
                    <input name="email" placeholder="Email" style={{width:'100%', padding:'12px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc'}} />
                    <input name="password" type="password" placeholder="Mot de passe" style={{width:'100%', padding:'12px', marginBottom:'20px', borderRadius:'8px', border:'1px solid #e2e8f0', background:'#f8fafc'}} />
                    <button type="submit" style={{width:'100%', padding:'12px', background:'#1e293b', color:'white', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer'}}>Se connecter</button>
                </form>
            </div>
        );
    }

    const activeProjectData = projects.find(p => p.id === activeProject);
    const activeProjectTasks = tasks.filter(t => t.project_id === activeProject && !t.deleted_at);

    return (
        <div style={{display:'flex', height:'100vh', fontFamily:'Segoe UI, sans-serif', overflow:'hidden'}}>
            
            {/* BOUTON MENU MOBILE (VISIBLE SEULEMENT SUR PETITS ÉCRANS) */}
            <div style={{position:'fixed', top:'10px', left:'10px', zIndex:1000, display: isMobile ? 'block' : 'none'}}>
                <button onClick={() => setShowSidebar(!showSidebar)} style={{background:'#1e293b', color:'white', border:'none', padding:'10px', borderRadius:'8px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>
                    ☰
                </button>
            </div>

            {/* SIDEBAR (Responsive) */}
            <div style={{
                width:'260px', background:'#1e293b', color:'white', display:'flex', flexDirection:'column',
                position: isMobile ? 'fixed' : 'relative',
                height: '100%',
                zIndex: 999,
                transform: (isMobile && !showSidebar) ? 'translateX(-100%)' : 'translateX(0)',
                transition: 'transform 0.3s ease'
            }}>
                <div style={{padding:'20px', paddingLeft: isMobile ? '60px' : '20px', fontSize:'18px', fontWeight:'bold', borderBottom:'1px solid #334155', cursor:'pointer'}} onClick={()=>{setActiveProject(null); setShowSidebar(false);}}>
                    🏨 Medina Manager
                </div>
                <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
                    <div style={{padding:'10px', cursor:'pointer', color:activeProject===null?'#60a5fa':'#94a3b8', fontWeight:'bold', background: activeProject===null?'rgba(255,255,255,0.1)':'transparent', borderRadius:'6px'}} onClick={()=>{setActiveProject(null); setShowSidebar(false);}}>
                        🏠 Tableau de Bord
                    </div>
                    {sites.map(site => (
                        <div key={site.id} style={{marginTop:'15px'}}>
                            <div style={{padding:'5px 10px', fontSize:'11px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
                                {site.name}
                                {user.role === 'admin' && <span style={{cursor:'pointer', fontSize:'14px'}} onClick={()=>{ const n = prompt("Nom du projet ?"); if(n) handleCreateProject(site.id, n); }}>+</span>}
                            </div>
                            {projects.filter(p => p.site_id === site.id).map(p => (
                                <div key={p.id} onClick={()=>{setActiveProject(p.id); setShowSidebar(false);}} 
                                     style={{padding:'8px 10px', margin:'2px 0', borderRadius:'6px', cursor:'pointer', background:activeProject===p.id?'#334155':'transparent', color:activeProject===p.id?'white':'#cbd5e1', fontSize:'14px', display:'flex', alignItems:'center', gap:'8px'}}>
                                    📁 {p.name}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{padding:'15px', borderTop:'1px solid #334155'}}>
                    <div style={{fontSize:'12px', color:'#94a3b8', marginBottom:'5px'}}>{user.username} <span style={{color:'#facc15'}}>{user.role === 'admin' ? '★' : ''}</span></div>
                    <button onClick={()=>{setUser(null); localStorage.removeItem('user');}} style={{background:'rgba(239, 68, 68, 0.1)', width:'100%', border:'1px solid #ef4444', color:'#ef4444', fontSize:'12px', cursor:'pointer', padding:'5px', borderRadius:'4px'}}>Déconnexion</button>
                </div>
            </div>

            {/* CONTENU PRINCIPAL */}
            <div style={{flex:1, overflowY:'auto', background:'#f8fafc', width:'100%'}}>
                {activeProject ? (
                    <ProjectView 
                        project={activeProjectData} tasks={activeProjectTasks} members={[]} allUsers={allUsers}
                        viewMode={viewMode} setViewMode={setViewMode}
                        onAddTask={async (t)=>{
                             await fetch(`${API_BASE}/tasks`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({project_id:activeProject, title:t, status:'todo', priority:'normal', assignee_id:user.id})}); fetchData();
                        }}
                        onEditTask={setEditingTask}
                        onUpdateTask={async (t)=>{
                            await fetch(`${API_BASE}/tasks/${t.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(t)}); fetchData();
                        }}
                        onDeleteProject={async (id)=>{ if(confirm("Supprimer ?")) { await fetch(`${API_BASE}/projects/${id}`, {method:'DELETE'}); setActiveProject(null); fetchData(); } }}
                        user={user}
                    />
                ) : (
                    <Dashboard projects={projects} tasks={tasks} user={user} onOpenProject={setActiveProject} allUsers={allUsers} />
                )}
            </div>

            {/* MODAL ÉDITION */}
            {editingTask && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
                    <div style={{background:'white', padding:'25px', borderRadius:'12px', width:'100%', maxWidth:'400px', display:'flex', flexDirection:'column', gap:'15px', boxShadow:'0 20px 25px -5px rgba(0, 0, 0, 0.1)'}}>
                        <h3 style={{margin:0, color:'#1e293b'}}>Modifier la tâche</h3>
                        <input value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}} />
                        
                        <div style={{display:'flex', gap:'10px'}}>
                            <select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                                <option value="todo">À faire</option>
                                <option value="doing">En cours</option>
                                <option value="done">Terminé</option>
                            </select>
                            <select value={editingTask.priority || 'normal'} onChange={e=>setEditingTask({...editingTask, priority:e.target.value})} style={{flex:1, padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                                <option value="low">Basse</option>
                                <option value="normal">Normale</option>
                                <option value="high">Haute 🔥</option>
                            </select>
                        </div>

                        {/* Seul l'admin peut réassigner une tâche */}
                        {user.role === 'admin' && (
                            <select value={editingTask.assignee_id || ''} onChange={e=>setEditingTask({...editingTask, assignee_id:parseInt(e.target.value)})} style={{padding:'10px', borderRadius:'6px', border:'1px solid #cbd5e1'}}>
                                <option value="">-- Assigner à --</option>
                                {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                            </select>
                        )}
                        
                        <label style={{fontSize:'12px', color:'#64748b', marginBottom:'-10px'}}>Date d'échéance</label>
                        <input type="date" value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''} onChange={e=>setEditingTask({...editingTask, due_date:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}} />

                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'10px'}}>
                            <button onClick={()=>setEditingTask(null)} style={{padding:'10px 20px', border:'none', background:'#f1f5f9', color:'#475569', borderRadius:'6px', cursor:'pointer'}}>Annuler</button>
                            <button onClick={async ()=>{ await fetch(`${API_BASE}/tasks/${editingTask.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(editingTask)}); fetchData(); setEditingTask(null); }} style={{padding:'10px 20px', background:'#2563eb', color:'white', border:'none', borderRadius:'6px', cursor:'pointer'}}>Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;