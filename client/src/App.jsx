import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- CONFIGURATION ---
// Si vous êtes en local, c'est localhost:5000. 
// Si vous publiez sur Render, il faudra mettre l'adresse https://....
const API_BASE = "https://medina-api.onrender.com"; 

// ==========================================
// COMPOSANT 1 : DASHBOARD (ACCUEIL COCKPIT)
// ==========================================
function Dashboard({ projects, tasks, user, onOpenProject }) {
    // 1. FILTRAGE INTELLIGENT : On ne garde que CE qui concerne l'utilisateur
    const myTasks = tasks.filter(t => t.assignee_id === user.id && !t.deleted_at);
    const myPending = myTasks.filter(t => t.status !== 'done');
    const myUrgent = myPending.filter(t => t.priority === 'high');
    const myDone = myTasks.filter(t => t.status === 'done');

    // Calcul de la performance
    const total = myTasks.length;
    const progress = total === 0 ? 0 : Math.round((myDone.length / total) * 100);

    const getProjectName = (pid) => {
        const p = projects.find(proj => proj.id === pid);
        return p ? p.name : 'Projet inconnu';
    };

    return (
        <div style={{padding:'30px', background:'#f8fafc', minHeight:'100vh'}}>
            {/* Header Dashboard */}
            <div style={{marginBottom:'30px', display:'flex', justifyContent:'space-between', alignItems:'end'}}>
                <div>
                    <h1 style={{fontSize:'28px', color:'#1e293b', marginBottom:'5px'}}>
                        Bonjour, {user.username} 👋
                    </h1>
                    <p style={{color:'#64748b'}}>Voici votre point de situation pour aujourd'hui.</p>
                </div>
                <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'12px', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'1px'}}>Date</div>
                    <div style={{fontWeight:'bold', color:'#334155'}}>{new Date().toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long'})}</div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'20px', marginBottom:'30px'}}>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', borderLeft:'5px solid #3b82f6'}}>
                    <div style={{fontSize:'12px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold'}}>À faire</div>
                    <div style={{fontSize:'32px', fontWeight:'800', color:'#1e293b', marginTop:'5px'}}>{myPending.length}</div>
                    <div style={{fontSize:'11px', color:'#94a3b8'}}>Tâches actives</div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', borderLeft:'5px solid #ef4444'}}>
                    <div style={{fontSize:'12px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold'}}>Urgences</div>
                    <div style={{fontSize:'32px', fontWeight:'800', color:'#ef4444', marginTop:'5px'}}>{myUrgent.length}</div>
                    <div style={{fontSize:'11px', color:'#94a3b8'}}>Priorité haute</div>
                </div>
                <div style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 4px 6px rgba(0,0,0,0.02)', borderLeft:'5px solid #10b981'}}>
                    <div style={{fontSize:'12px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold'}}>Performance</div>
                    <div style={{fontSize:'32px', fontWeight:'800', color:'#10b981', marginTop:'5px'}}>{progress}%</div>
                    <div style={{width:'100%', height:'4px', background:'#e2e8f0', borderRadius:'2px', marginTop:'10px'}}>
                        <div style={{width:`${progress}%`, height:'100%', background:'#10b981', borderRadius:'2px'}}></div>
                    </div>
                </div>
            </div>

            {/* Liste des Tâches */}
            <h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155', marginBottom:'15px'}}>🎯 Ma Mission du jour</h3>
            {myPending.length === 0 ? (
                <div style={{background:'white', padding:'40px', borderRadius:'12px', textAlign:'center', color:'#94a3b8', border:'2px dashed #e2e8f0'}}>
                    🎉 Vous êtes à jour ! Aucune tâche en attente.
                </div>
            ) : (
                <div style={{background:'white', borderRadius:'12px', boxShadow:'0 4px 15px rgba(0,0,0,0.05)', overflow:'hidden'}}>
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead style={{background:'#f8fafc', borderBottom:'1px solid #e2e8f0'}}>
                            <tr>
                                <th style={{textAlign:'left', padding:'15px', fontSize:'12px', color:'#64748b', textTransform:'uppercase'}}>Tâche</th>
                                <th style={{textAlign:'left', padding:'15px', fontSize:'12px', color:'#64748b', textTransform:'uppercase'}}>Projet</th>
                                <th style={{textAlign:'left', padding:'15px', fontSize:'12px', color:'#64748b', textTransform:'uppercase'}}>Priorité</th>
                                <th style={{textAlign:'right', padding:'15px', fontSize:'12px', color:'#64748b', textTransform:'uppercase'}}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myPending.map(t => (
                                <tr key={t.id} style={{borderBottom:'1px solid #f1f5f9'}}>
                                    <td style={{padding:'15px', fontWeight:'500', color:'#334155'}}>
                                        {t.title}
                                        {t.due_date && <div style={{fontSize:'11px', color:'#ef4444', marginTop:'2px'}}>📅 Échéance : {new Date(t.due_date).toLocaleDateString()}</div>}
                                    </td>
                                    <td style={{padding:'15px'}}>
                                        <span style={{background:'#e0f2fe', color:'#0369a1', padding:'4px 8px', borderRadius:'6px', fontSize:'11px', fontWeight:'bold'}}>
                                            {getProjectName(t.project_id)}
                                        </span>
                                    </td>
                                    <td style={{padding:'15px'}}>
                                        {t.priority === 'high' ? 
                                            <span style={{color:'#ef4444', fontWeight:'bold', display:'flex', alignItems:'center', gap:'5px'}}>🔥 Haute</span> : 
                                            <span style={{color:'#64748b'}}>Normale</span>
                                        }
                                    </td>
                                    <td style={{padding:'15px', textAlign:'right'}}>
                                        <button 
                                            onClick={() => onOpenProject(t.project_id)}
                                            style={{background: 'white', border:'1px solid #cbd5e1', color:'#475569', padding:'8px 15px', borderRadius:'6px', cursor:'pointer', fontSize:'12px', fontWeight:'600'}}
                                        >
                                            Ouvrir ➔
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ==========================================
// COMPOSANT 2 : VUE PROJET (KANBAN INTELLIGENT)
// ==========================================
function ProjectView({ project, tasks, members, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onInvite, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");

    // TRI INTELLIGENT : Moi > Urgent > Autres
    const getSortedTasks = (taskList) => {
        return [...taskList].sort((a, b) => {
            const isMineA = a.assignee_id === user.id;
            const isMineB = b.assignee_id === user.id;
            const prioScore = { high: 3, normal: 2, low: 1 };
            const scoreA = prioScore[a.priority] || 2;
            const scoreB = prioScore[b.priority] || 2;

            if (isMineA && !isMineB) return -1;
            if (!isMineA && isMineB) return 1;
            return scoreB - scoreA;
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
            {/* Header Projet */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                    <div style={{width:'32px', height:'32px', background:'#2563eb', borderRadius:'6px', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:'bold'}}>{project.name.charAt(0)}</div>
                    <h2 style={{margin:0, fontSize:'18px'}}>{project.name}</h2>
                    <span style={{fontSize:'12px', color:'#666', background:'#f1f5f9', padding:'2px 8px', borderRadius:'10px'}}>{tasks.length} tâches</span>
                </div>
                <div style={{display:'flex', gap:'5px'}}>
                    <button onClick={exportPDF} style={{background:'#fff', border:'1px solid #ccc', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer'}}>📄 PDF</button>
                    {user.role==='admin' && <button onClick={()=>onDeleteProject(project.id)} style={{background:'#fee2e2', color:'red', border:'none', padding:'5px 10px', borderRadius:'6px', fontSize:'12px', cursor:'pointer'}}>Supprimer</button>}
                </div>
            </div>

            {/* Boutons Vue */}
            <div style={{display:'flex', gap:'5px', marginBottom:'15px', background:'#f8fafc', padding:'3px', borderRadius:'6px', width:'fit-content'}}>
                <button onClick={()=>setViewMode('board')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background:viewMode==='board'?'white':'transparent', fontWeight:viewMode==='board'?'bold':'normal', boxShadow:viewMode==='board'?'0 1px 2px rgba(0,0,0,0.1)':'none', cursor:'pointer'}}>Kanban</button>
                <button onClick={()=>setViewMode('list')} style={{padding:'6px 12px', border:'none', borderRadius:'4px', background:viewMode==='list'?'white':'transparent', fontWeight:viewMode==='list'?'bold':'normal', boxShadow:viewMode==='list'?'0 1px 2px rgba(0,0,0,0.1)':'none', cursor:'pointer'}}>Liste</button>
            </div>

            {/* VUE KANBAN */}
            {viewMode==='board' && 
                <div style={{display:'flex', gap:'15px', overflowX:'auto', paddingBottom:'10px'}}>
                    {['todo', 'doing', 'done'].map(s => {
                        const columnTasks = getSortedTasks(tasks.filter(t => (t.status || 'todo').toLowerCase() === s));
                        return (
                        <div key={s} className="kanban-col" onDragOver={e=>e.preventDefault()} onDrop={e=>drop(e,s)} style={{flex:'0 0 300px', background:'#f8fafc', padding:'10px', borderRadius:'8px', minHeight:'200px'}}>
                            <div style={{fontWeight:'700', marginBottom:'10px', textTransform:'uppercase', color:'#475569', fontSize:'11px', display:'flex', justifyContent:'space-between'}}>
                                {s === 'todo' ? 'À FAIRE' : s === 'doing' ? 'EN COURS' : 'TERMINÉ'}
                                <span style={{background:'#e2e8f0', borderRadius:'10px', padding:'0 6px'}}>{columnTasks.length}</span>
                            </div>
                            
                            {s==='todo' && 
                                <form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}>
                                    <input placeholder="+ Ajouter une tâche..." value={newTask} onChange={e=>setNewTask(e.target.value)} style={{width:'100%', padding:'8px', marginBottom:'10px', border:'1px solid #e2e8f0', borderRadius:'6px', fontSize:'13px'}}/>
                                </form>
                            }

                            <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                                {columnTasks.map(t => {
                                    const isMine = t.assignee_id === user.id;
                                    const isUrgent = t.priority === 'high';
                                    const canMove = isMine || user.role === 'admin';

                                    return (
                                        <div key={t.id} 
                                             draggable={canMove} 
                                             onDragStart={e=>dragStart(e,t.id)} 
                                             onClick={()=>onEditTask(t)} 
                                             style={{
                                                 background: isMine ? '#ffffff' : '#f1f5f9',
                                                 border: isMine ? '1px solid #bfdbfe' : '1px solid transparent',
                                                 borderLeft: isUrgent ? '4px solid #ef4444' : (isMine ? '4px solid #3b82f6' : '4px solid #cbd5e1'),
                                                 padding:'10px', borderRadius:'6px', boxShadow: isMine ? '0 2px 4px rgba(59, 130, 246, 0.1)' : 'none',
                                                 opacity: isMine ? 1 : 0.8, cursor: 'pointer'
                                             }}>
                                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:'4px'}}>
                                                {isUrgent && <span style={{fontSize:'10px', background:'#fee2e2', color:'#ef4444', padding:'1px 5px', borderRadius:'4px', fontWeight:'bold'}}>🔥 URGENT</span>}
                                                {isMine && <span style={{fontSize:'10px', background:'#dbeafe', color:'#1e40af', padding:'1px 5px', borderRadius:'4px', fontWeight:'bold'}}>MOI</span>}
                                            </div>
                                            <div style={{fontWeight:'600', fontSize:'13px', color:'#1e293b'}}>{t.title}</div>
                                            <div style={{fontSize:'11px', color:'#64748b', marginTop:'6px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
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

            {/* VUE LISTE */}
            {viewMode==='list' && 
                <div style={{background:'white', borderRadius:'8px', border:'1px solid #eee', overflow:'hidden'}}>
                    <table style={{width:'100%', borderCollapse:'collapse'}}>
                        <thead style={{background:'#f9f9f9'}}><tr><th style={{padding:'10px', textAlign:'left'}}>Titre</th><th style={{padding:'10px', textAlign:'left'}}>Statut</th><th style={{padding:'10px', textAlign:'left'}}>Assigné</th></tr></thead>
                        <tbody>
                            {tasks.map(t=>(<tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #eee', cursor:'pointer'}}><td style={{padding:'10px'}}>{t.title}</td><td style={{padding:'10px'}}>{t.status}</td><td style={{padding:'10px'}}>{getName(t.assignee_id)}</td></tr>))}
                        </tbody>
                    </table>
                </div>
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

    // Chargement des données
    useEffect(() => {
        if (!user) return;
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            const h = { headers: { 'Authorization': user.token } };
            // On récupère tout
            const [resSites, resProjs, resTasks, resUsers] = await Promise.all([
                fetch(`${API_BASE}/sites`, h),
                fetch(`${API_BASE}/projects`, h),
                fetch(`${API_BASE}/tasks`, h), // Nouvelle route qui charge TOUTES les tâches pour le dashboard
                fetch(`${API_BASE}/users`, h)
            ]);

            if(resSites.ok) setSites(await resSites.json());
            if(resProjs.ok) setProjects(await resProjs.json());
            if(resTasks.ok) setTasks(await resTasks.json());
            if(resUsers.ok) setAllUsers(await resUsers.json());

        } catch (err) { console.error("Erreur chargement:", err); }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok) {
                setUser(data);
                localStorage.setItem('user', JSON.stringify(data));
            } else {
                alert("Erreur: " + data.message);
            }
        } catch (err) { alert("Erreur serveur"); }
    };

    // Actions
    const handleCreateProject = async (siteId, name) => {
        const res = await fetch(`${API_BASE}/projects`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ site_id: siteId, name, owner_id: user.id })
        });
        if(res.ok) fetchData();
    };

    const handleCreateTask = async (title) => {
        if(!activeProject) return;
        const res = await fetch(`${API_BASE}/tasks`, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({ project_id: activeProject, title, status: 'todo', priority: 'normal', assignee_id: user.id })
        });
        if(res.ok) fetchData();
    };

    const handleUpdateTask = async (task) => {
        const res = await fetch(`${API_BASE}/tasks/${task.id}`, {
            method: 'PUT', headers: {'Content-Type':'application/json'},
            body: JSON.stringify(task)
        });
        if(res.ok) {
            setTasks(tasks.map(t => t.id === task.id ? task : t));
            setEditingTask(null);
        }
    };

    const handleDeleteProject = async (id) => {
        if(window.confirm("Supprimer ce projet ?")) {
            await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
            setActiveProject(null);
            fetchData();
        }
    };

    // --- RENDER ---
    if (!user) {
        return (
            <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9'}}>
                <form onSubmit={handleLogin} style={{background:'white', padding:'40px', borderRadius:'10px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', width:'300px'}}>
                    <h2 style={{textAlign:'center', color:'#333', marginBottom:'20px'}}>Medina OS 🏨</h2>
                    <input name="email" placeholder="Email" style={{width:'100%', padding:'10px', marginBottom:'10px', borderRadius:'5px', border:'1px solid #ddd'}} />
                    <input name="password" type="password" placeholder="Mot de passe" style={{width:'100%', padding:'10px', marginBottom:'20px', borderRadius:'5px', border:'1px solid #ddd'}} />
                    <button type="submit" style={{width:'100%', padding:'10px', background:'#2563eb', color:'white', border:'none', borderRadius:'5px', fontWeight:'bold', cursor:'pointer'}}>Se connecter</button>
                </form>
            </div>
        );
    }

    const activeProjectData = projects.find(p => p.id === activeProject);
    const activeProjectTasks = tasks.filter(t => t.project_id === activeProject && !t.deleted_at);

    return (
        <div style={{display:'flex', height:'100vh', fontFamily:'Segoe UI, sans-serif'}}>
            {/* SIDEBAR */}
            <div style={{width:'260px', background:'#1e293b', color:'white', display:'flex', flexDirection:'column'}}>
                <div style={{padding:'20px', fontSize:'18px', fontWeight:'bold', borderBottom:'1px solid #334155', cursor:'pointer'}} onClick={()=>setActiveProject(null)}>
                    🏨 Medina Manager
                </div>
                <div style={{flex:1, overflowY:'auto', padding:'10px'}}>
                    <div style={{padding:'10px', cursor:'pointer', color:activeProject===null?'#60a5fa':'#94a3b8', fontWeight:'bold'}} onClick={()=>setActiveProject(null)}>
                        🏠 Tableau de Bord
                    </div>
                    {sites.map(site => (
                        <div key={site.id} style={{marginTop:'15px'}}>
                            <div style={{padding:'5px 10px', fontSize:'12px', color:'#64748b', textTransform:'uppercase', fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
                                {site.name}
                                <span style={{cursor:'pointer'}} onClick={()=>{
                                    const n = prompt("Nom du projet ?");
                                    if(n) handleCreateProject(site.id, n);
                                }}>+</span>
                            </div>
                            {projects.filter(p => p.site_id === site.id).map(p => (
                                <div key={p.id} onClick={()=>setActiveProject(p.id)} 
                                     style={{padding:'8px 10px', margin:'2px 0', borderRadius:'6px', cursor:'pointer', background:activeProject===p.id?'#334155':'transparent', color:activeProject===p.id?'white':'#cbd5e1', fontSize:'14px'}}>
                                    📁 {p.name}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
                <div style={{padding:'15px', borderTop:'1px solid #334155'}}>
                    <div style={{fontSize:'12px', color:'#94a3b8'}}>{user.username} ({user.role})</div>
                    <button onClick={()=>{setUser(null); localStorage.removeItem('user');}} style={{background:'none', border:'none', color:'#ef4444', fontSize:'12px', cursor:'pointer', marginTop:'5px'}}>Déconnexion</button>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div style={{flex:1, overflowY:'auto', background:'#f8fafc'}}>
                {activeProject ? (
                    <ProjectView 
                        project={activeProjectData} 
                        tasks={activeProjectTasks} 
                        members={[]} 
                        allUsers={allUsers}
                        viewMode={viewMode} setViewMode={setViewMode}
                        onAddTask={handleCreateTask}
                        onEditTask={setEditingTask}
                        onUpdateTask={handleUpdateTask}
                        onDeleteProject={handleDeleteProject}
                        user={user}
                    />
                ) : (
                    <Dashboard 
                        projects={projects} 
                        tasks={tasks} 
                        user={user} 
                        onOpenProject={setActiveProject} 
                    />
                )}
            </div>

            {/* MODAL ÉDITION TÂCHE */}
            {editingTask && (
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}>
                    <div style={{background:'white', padding:'20px', borderRadius:'8px', width:'400px', display:'flex', flexDirection:'column', gap:'10px'}}>
                        <h3>Modifier la tâche</h3>
                        <input value={editingTask.title} onChange={e=>setEditingTask({...editingTask, title:e.target.value})} style={{padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}} />
                        
                        <div style={{display:'flex', gap:'10px'}}>
                            <select value={editingTask.status} onChange={e=>setEditingTask({...editingTask, status:e.target.value})} style={{flex:1, padding:'8px'}}>
                                <option value="todo">À faire</option>
                                <option value="doing">En cours</option>
                                <option value="done">Terminé</option>
                            </select>
                            <select value={editingTask.priority || 'normal'} onChange={e=>setEditingTask({...editingTask, priority:e.target.value})} style={{flex:1, padding:'8px'}}>
                                <option value="low">Basse</option>
                                <option value="normal">Normale</option>
                                <option value="high">Haute 🔥</option>
                            </select>
                        </div>

                        <select value={editingTask.assignee_id || ''} onChange={e=>setEditingTask({...editingTask, assignee_id:parseInt(e.target.value)})} style={{padding:'8px'}}>
                            <option value="">-- Assigner à --</option>
                            {allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        </select>
                        
                        <label style={{fontSize:'12px', color:'#666'}}>Date d'échéance</label>
                        <input type="date" value={editingTask.due_date ? editingTask.due_date.split('T')[0] : ''} onChange={e=>setEditingTask({...editingTask, due_date:e.target.value})} style={{padding:'8px', border:'1px solid #ccc'}} />

                        <div style={{display:'flex', justifyContent:'flex-end', gap:'10px', marginTop:'10px'}}>
                            <button onClick={()=>setEditingTask(null)} style={{padding:'8px 15px', border:'1px solid #ccc', background:'white', borderRadius:'4px', cursor:'pointer'}}>Annuler</button>
                            <button onClick={()=>handleUpdateTask(editingTask)} style={{padding:'8px 15px', background:'#2563eb', color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}>Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;