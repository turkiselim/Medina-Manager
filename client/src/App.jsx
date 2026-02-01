import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = "https://medina-api.onrender.com"; 

// ==========================================
// COMPOSANTS PAGES
// ==========================================
function MembersView({ users }) {
    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'24px', color:'#1e293b', marginBottom:'10px'}}>👥 L'Équipe Medina</h1>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'20px'}}>
                {users.map(u => (
                    <div key={u.id} style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'15px', border:'1px solid #f1f5f9'}}>
                        <div style={{width:'50px', height:'50px', background: u.role==='admin'?'#1e293b':'#3b82f6', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold'}}>{u.username.charAt(0).toUpperCase()}</div>
                        <div><div style={{fontWeight:'bold', color:'#1e293b', fontSize:'16px'}}>{u.username}</div><div style={{color: u.role==='admin'?'#ef4444':'#64748b', fontSize:'12px', textTransform:'uppercase', fontWeight:'bold'}}>{u.role==='admin'?'🛡️ Administrateur':'👤 Collaborateur'}</div></div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Dashboard({ projects, tasks, user, onOpenProject }) {
    if (user.role === 'admin') {
        const tasksUrgent = tasks.filter(t => t.priority === 'high' && t.status !== 'done' && !t.deleted_at);
        return (
            <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
                <h1 style={{fontSize:'26px', color:'#1e293b'}}>🏰 Tour de Contrôle</h1>
                <p style={{color:'#64748b', marginBottom:'30px'}}>Vue d'ensemble stratégique.</p>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                    <div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #2563eb', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}><div style={{fontSize:'12px', color:'#64748b', fontWeight:'700'}}>PROJETS</div><div style={{fontSize:'32px', fontWeight:'800', color:'#1e293b'}}>{projects.length}</div></div>
                    <div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #ef4444', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}><div style={{fontSize:'12px', color:'#64748b', fontWeight:'700'}}>URGENCES</div><div style={{fontSize:'32px', fontWeight:'800', color:'#ef4444'}}>{tasksUrgent.length}</div></div>
                </div>
                <h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155'}}>🔥 Alertes</h3>
                <div style={{background:'white', borderRadius:'16px', border:'1px solid #f1f5f9', overflow:'hidden', marginTop:'15px'}}>
                    {tasksUrgent.map(t => <div key={t.id} onClick={()=>onOpenProject(t.project_id)} style={{padding:'15px', borderBottom:'1px solid #f1f5f9', cursor:'pointer'}}>⚠️ {t.title}</div>)}
                </div>
            </div>
        );
    }
    const myTasks = tasks.filter(t => t.assignee_id === user.id && !t.deleted_at && t.status !== 'done');
    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'24px', color:'#1e293b'}}>Bonjour, {user.username} 👋</h1>
            <div style={{background:'white', borderRadius:'16px', marginTop:'20px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>
                {myTasks.length===0?<div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Rien à faire !</div>:myTasks.map(t=><div key={t.id} onClick={()=>onOpenProject(t.project_id)} style={{padding:'20px', borderBottom:'1px solid #f1f5f9', cursor:'pointer'}}>{t.title}</div>)}
            </div>
        </div>
    );
}

function ProjectView({ project, tasks, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");
    const getSortedTasks = (taskList) => [...taskList].sort((a, b) => (( {high:3,normal:2,low:1}[b.priority]||2) - ({high:3,normal:2,low:1}[a.priority]||2)));
    const getName = (id) => { const u = allUsers.find(x => x.id === id); return u ? u.username : '-'; };
    const exportPDF = () => { const doc = new jsPDF(); doc.text(`Rapport: ${project.name}`, 14, 20); autoTable(doc, { head:[['Tâche','Statut','Qui']], body:tasks.map(t=>[t.title,t.status,getName(t.assignee_id)]), startY:30 }); doc.save('rapport.pdf'); };

    return ( 
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}>
                <h2 style={{margin:0}}>{project.name}</h2>
                <div style={{display:'flex', gap:'10px'}}><button onClick={exportPDF}>📥 PDF</button>{user.role==='admin'&&<button onClick={()=>onDeleteProject(project.id)} style={{color:'red'}}>Supprimer</button>}</div>
            </div>
            <div style={{marginBottom:'20px'}}><button onClick={()=>setViewMode('board')}>Kanban</button> <button onClick={()=>setViewMode('list')}>Liste</button></div>
            {viewMode==='board' && <div style={{display:'flex', gap:'20px', overflowX:'auto', paddingBottom:'10px', height:'100%'}}>{['todo', 'doing', 'done'].map(s=>(
                <div key={s} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData("id"); const t=tasks.find(x=>x.id==id); if(t) onUpdateTask({...t, status:s});}} style={{flex:'0 0 300px', background:'#f8fafc', padding:'15px', borderRadius:'12px', border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold', marginBottom:'10px', textTransform:'uppercase'}}>{s}</div>
                    {s==='todo'&&<form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="+ Tâche..." style={{width:'100%', padding:'10px', marginBottom:'10px'}}/></form>}
                    {getSortedTasks(tasks.filter(t=>(t.status||'todo')===s)).map(t=><div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData("id",t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', marginBottom:'10px', borderRadius:'8px', borderLeft:t.priority==='high'?'4px solid red':'1px solid #eee', cursor:'pointer'}}>{t.title}<div style={{fontSize:'11px', color:'#888', marginTop:'5px'}}>{getName(t.assignee_id)}</div></div>)}
                </div>
            ))}</div>}
            {viewMode==='list' && <table><tbody>{tasks.map(t=><tr key={t.id} onClick={()=>onEditTask(t)} style={{cursor:'pointer'}}><td style={{padding:'10px'}}>{t.title}</td><td style={{padding:'10px'}}>{t.status}</td></tr>)}</tbody></table>}
        </div> 
    );
}

// ==========================================
// SIDEBAR (AVEC GESTION DES ESPACES)
// ==========================================
function Sidebar({ sites, projects, activeProject, setActiveProject, onLogout, onCreateProject, onCreateSite, onUpdateSite, onDeleteSite, user, setPage }) {
    const [expandedSites, setExpandedSites] = useState({});
    const toggleSite = (id) => setExpandedSites(prev => ({...prev, [id]: !prev[id]}));

    return (
        <div style={{width:'260px', background:'#1e293b', color:'white', display:'flex', flexDirection:'column', height:'100%', borderRight:'1px solid #334155'}}>
            <div style={{padding:'25px 20px', borderBottom:'1px solid #334155', fontWeight:'800', fontSize:'18px'}}>Medina Manager <span style={{color:'#3b82f6'}}>.</span></div>
            <div style={{padding:'20px 10px', flex:1, overflowY:'auto'}}>
                <div onClick={()=>setPage('dashboard')} style={{padding:'10px', cursor:'pointer', color:'#94a3b8', fontWeight:'bold'}}>🏠 Tableau de Bord</div>
                <div onClick={()=>setPage('members')} style={{padding:'10px', cursor:'pointer', color:'#94a3b8', fontWeight:'bold'}}>👥 Équipe</div>
                
                <div style={{margin:'20px 10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <span style={{fontSize:'11px', color:'#64748b', fontWeight:'bold'}}>ESPACES DE TRAVAIL</span>
                    {user.role==='admin' && <span onClick={()=>{const n=prompt("Nom du nouvel Espace ?"); if(n) onCreateSite(n);}} style={{cursor:'pointer', color:'#3b82f6', fontSize:'16px', fontWeight:'bold'}}>+</span>}
                </div>

                {sites.map(site => (
                    <div key={site.id} style={{marginBottom:'5px'}}>
                        <div style={{padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background:'#1e293b', ':hover':{background:'#334155'}}}
                             onMouseEnter={e=>e.currentTarget.style.background='#334155'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <div onClick={()=>toggleSite(site.id)} style={{display:'flex', alignItems:'center', gap:'10px', flex:1}}>
                                <span style={{fontSize:'10px', color:'#64748b'}}>{expandedSites[site.id]?'▼':'▶'}</span>
                                <span style={{fontWeight:'600', fontSize:'14px'}}>{site.name}</span>
                            </div>
                            {user.role==='admin' && (
                                <div style={{display:'flex', gap:'8px'}}>
                                    <span onClick={()=>{const n=prompt("Renommer l'espace ?", site.name); if(n) onUpdateSite(site.id, n);}} style={{cursor:'pointer', fontSize:'12px'}}>✏️</span>
                                    <span onClick={()=>{if(confirm("ATTENTION: Supprimer cet espace effacera TOUS les projets et tâches à l'intérieur !")) onDeleteSite(site.id);}} style={{cursor:'pointer', fontSize:'12px'}}>🗑️</span>
                                </div>
                            )}
                        </div>
                        {expandedSites[site.id] && (
                            <div style={{paddingLeft:'28px', marginTop:'2px'}}>
                                {projects.filter(p=>p.site_id===site.id).map(p=>(
                                    <div key={p.id} onClick={()=>{setActiveProject(p.id); setPage('project');}} style={{padding:'8px', color:activeProject===p.id?'#60a5fa':'#cbd5e1', fontSize:'13px', cursor:'pointer'}}>{p.name}</div>
                                ))}
                                {user.role==='admin' && <div onClick={()=>{const n=prompt("Nouveau projet ?"); if(n) onCreateProject(site.id, n);}} style={{padding:'8px', color:'#64748b', fontSize:'12px', fontStyle:'italic', cursor:'pointer'}}>+ Nouveau projet</div>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={{padding:'20px', borderTop:'1px solid #334155', background:'#0f172a'}}>
                <div style={{fontWeight:'bold'}}>{user.username}</div>
                <button onClick={onLogout} style={{width:'100%', marginTop:'10px', border:'1px solid #ef4444', background:'none', color:'#ef4444', cursor:'pointer', borderRadius:'4px'}}>Déconnexion</button>
            </div>
        </div>
    );
}

// ==========================================
// APP
// ==========================================
function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [sites, setSites] = useState([]); const [projects, setProjects] = useState([]); const [tasks, setTasks] = useState([]); const [allUsers, setAllUsers] = useState([]);
    const [activeProject, setActiveProject] = useState(null); const [viewMode, setViewMode] = useState('board'); const [editingTask, setEditingTask] = useState(null);
    const isMobile = window.innerWidth < 768; const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => { if (user) fetchData(); }, [user]);
    const fetchData = async () => {
        try { const h={headers:{'Authorization':user.token}}; const [s,p,t,u]=await Promise.all([fetch(`${API_BASE}/sites`,h), fetch(`${API_BASE}/projects`,h), fetch(`${API_BASE}/tasks`,h), fetch(`${API_BASE}/users`,h)]);
        if(s.ok) setSites(await s.json()); if(p.ok) setProjects(await p.json()); if(t.ok) setTasks(await t.json()); if(u.ok) setAllUsers(await u.json()); } catch(e){}
    };

    const handleLogin = async (e) => { e.preventDefault(); const res = await fetch(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value }) }); const data = await res.json(); if (res.ok) { setUser(data); localStorage.setItem('user', JSON.stringify(data)); } else alert(data.message); };

    if (!user) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center'}}><form onSubmit={handleLogin} style={{padding:'40px', boxShadow:'0 0 20px #ccc'}}><input name="email" placeholder="Email" style={{display:'block', marginBottom:'10px', padding:'10px'}}/><input name="password" type="password" placeholder="Pass" style={{display:'block', marginBottom:'10px', padding:'10px'}}/><button type="submit">Go</button></form></div>;

    const activeProjectData = projects.find(p => p.id === activeProject);
    const activeProjectTasks = tasks.filter(t => t.project_id === activeProject && !t.deleted_at);

    return (
        <div style={{display:'flex', height:'100vh', fontFamily:'Segoe UI, sans-serif', overflow:'hidden'}}>
            {isMobile && <button onClick={()=>setIsMenuOpen(!isMenuOpen)} style={{position:'fixed', top:10, left:10, zIndex:1000}}>☰</button>}
            <div style={{position:isMobile?'fixed':'relative', zIndex:999, height:'100%', transform:(isMobile&&!isMenuOpen)?'translateX(-100%)':'translateX(0)', transition:'0.3s'}}>
                <Sidebar sites={sites} projects={projects} activeProject={activeProject} user={user} setActiveProject={setActiveProject} setPage={(p)=>{setCurrentPage(p); if(p!=='project') setActiveProject(null); setIsMenuOpen(false);}} onLogout={()=>{setUser(null); localStorage.removeItem('user');}} 
                    onCreateProject={async (s,n)=>{await fetch(`${API_BASE}/projects`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site_id:s,name:n,owner_id:user.id})}); fetchData();}}
                    onCreateSite={async (n)=>{await fetch(`${API_BASE}/sites`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})}); fetchData();}}
                    onUpdateSite={async (id,n)=>{await fetch(`${API_BASE}/sites/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})}); fetchData();}}
                    onDeleteSite={async (id)=>{await fetch(`${API_BASE}/sites/${id}`,{method:'DELETE'}); fetchData();}}
                />
            </div>
            <div style={{flex:1, overflowY:'auto', background:'#f8fafc'}}>
                {currentPage==='members' && <MembersView users={allUsers}/>}
                {currentPage==='dashboard' && <Dashboard projects={projects} tasks={tasks} user={user} onOpenProject={(id)=>{setActiveProject(id); setCurrentPage('project');}} />}
                {currentPage==='project' && activeProject && <ProjectView project={activeProjectData} tasks={activeProjectTasks} allUsers={allUsers} user={user} viewMode={viewMode} setViewMode={setViewMode} 
                    onAddTask={async(t)=>{await fetch(`${API_BASE}/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:activeProject,title:t,status:'todo',priority:'normal',assignee_id:user.id})}); fetchData();}} 
                    onEditTask={setEditingTask} 
                    onUpdateTask={async(t)=>{await fetch(`${API_BASE}/tasks/${t.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}); fetchData();}} 
                    onDeleteProject={async(id)=>{if(confirm("Supprimer?")) await fetch(`${API_BASE}/projects/${id}`,{method:'DELETE'}); setActiveProject(null); setCurrentPage('dashboard'); fetchData();}} />}
            </div>
            {editingTask && <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center'}}><div style={{background:'white', padding:'30px', width:'400px', borderRadius:'10px'}}>
                <h3>Modifier</h3>
                <input value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} style={{width:'100%', padding:'10px', marginBottom:'10px'}}/>
                <div style={{display:'flex', gap:'10px', marginBottom:'10px'}}><select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} style={{flex:1}}><option value="todo">À faire</option><option value="doing">En cours</option><option value="done">Terminé</option></select><select value={editingTask.priority} onChange={e=>setEditingTask({...editingTask, priority:e.target.value})} style={{flex:1}}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute</option></select></div>
                {user.role==='admin' && <select value={editingTask.assignee_id||''} onChange={e=>setEditingTask({...editingTask, assignee_id:e.target.value})} style={{width:'100%', marginBottom:'10px'}}><option value="">Assigner à...</option>{allUsers.map(u=><option key={u.id} value={u.id}>{u.username}</option>)}</select>}
                <div style={{display:'flex', justifyContent:'space-between'}}><button onClick={async()=>{if(confirm("Supprimer?")){await fetch(`${API_BASE}/tasks/${editingTask.id}`,{method:'DELETE'}); fetchData(); setEditingTask(null);}}} style={{color:'red'}}>Supprimer</button><div><button onClick={()=>setEditingTask(null)}>Annuler</button> <button onClick={async()=>{await fetch(`${API_BASE}/tasks/${editingTask.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(editingTask)}); fetchData(); setEditingTask(null);}}>Sauver</button></div></div>
            </div></div>}
        </div>
    );
}
export default App;