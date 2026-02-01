import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = "https://medina-api.onrender.com"; 

// ... (Gardez les composants MembersView, Dashboard, Sidebar, ProjectView identiques à la V10)
// POUR GAGNER DU TEMPS, JE NE REMETS QUE LE COMPOSANT MODIFIÉ ET L'APP PRINCIPALE CI-DESSOUS
// MAIS VOUS DEVEZ COPIER TOUT LE FICHIER COMPLET.

// COPIEZ-COLLEZ CE QUI SUIT DANS VOTRE FICHIER EN ENTIER (J'ai inclus tout le code pour éviter les erreurs) :

function MembersView({ users, currentUser, onAddUser, onDeleteUser }) {
    const [isAdding, setIsAdding] = useState(false);
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'user' });
    const handleSubmit = (e) => { e.preventDefault(); if(!newUser.username || !newUser.email || !newUser.password) return alert("Tout remplir svp"); onAddUser(newUser); setIsAdding(false); setNewUser({ username: '', email: '', password: '', role: 'user' }); };
    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}><div><h1 style={{fontSize:'24px', color:'#1e293b', marginBottom:'5px'}}>👥 L'Équipe Medina</h1><p style={{color:'#64748b'}}>Gérez les accès.</p></div>{currentUser.role === 'admin' && <button onClick={()=>setIsAdding(true)} style={{background:'#2563eb', color:'white', border:'none', padding:'10px 20px', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>+ Ajouter</button>}</div>
            {isAdding && (<div style={{background:'white', padding:'25px', borderRadius:'12px', marginBottom:'30px', border:'1px solid #e2e8f0'}}><h3 style={{marginTop:0}}>Nouveau Collaborateur</h3><form onSubmit={handleSubmit} style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:'15px'}}><input placeholder="Nom" value={newUser.username} onChange={e=>setNewUser({...newUser, username:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}} /><input placeholder="Email" value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}} /><input placeholder="Mot de passe" type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}} /><select value={newUser.role} onChange={e=>setNewUser({...newUser, role:e.target.value})} style={{padding:'10px', border:'1px solid #cbd5e1', borderRadius:'6px'}}><option value="user">Collaborateur</option><option value="admin">Administrateur</option></select><div style={{display:'flex', gap:'10px'}}><button type="button" onClick={()=>setIsAdding(false)} style={{background:'#f1f5f9', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer'}}>Annuler</button><button type="submit" style={{background:'#10b981', color:'white', border:'none', padding:'10px', borderRadius:'6px', cursor:'pointer', flex:1, fontWeight:'bold'}}>Valider</button></div></form></div>)}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'20px'}}>{users.map(u => (<div key={u.id} style={{background:'white', padding:'20px', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:'15px', border:'1px solid #f1f5f9'}}><div style={{width:'50px', height:'50px', background: u.role==='admin'?'#1e293b':'#3b82f6', color:'white', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:'bold'}}>{u.username.charAt(0).toUpperCase()}</div><div style={{flex:1}}><div style={{fontWeight:'bold', color:'#1e293b', fontSize:'16px'}}>{u.username} {u.id === currentUser.id && '(Moi)'}</div><div style={{color: u.role==='admin'?'#ef4444':'#64748b', fontSize:'12px', textTransform:'uppercase', fontWeight:'bold'}}>{u.role==='admin'?'🛡️ Administrateur':'👤 Collaborateur'}</div><div style={{fontSize:'12px', color:'#94a3b8'}}>{u.email}</div></div>{currentUser.role === 'admin' && u.id !== currentUser.id && <button onClick={() => { if(confirm("Supprimer "+u.username+" ?")) onDeleteUser(u.id); }} style={{background:'transparent', border:'none', cursor:'pointer', fontSize:'16px', opacity:0.5}}>🗑️</button>}</div>))}</div>
        </div>
    );
}

function Dashboard({ projects, tasks, user, onOpenProject, allUsers }) {
    if (user.role === 'admin') {
        const tasksUrgent = tasks.filter(t => t.priority === 'high' && t.status !== 'done' && !t.deleted_at);
        const totalTasks = tasks.filter(t => !t.deleted_at).length;
        const tasksDone = tasks.filter(t => t.status === 'done' && !t.deleted_at).length;
        const globalProgress = totalTasks === 0 ? 0 : Math.round((tasksDone / totalTasks) * 100);
        return (
            <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
                <h1 style={{fontSize:'26px', color:'#1e293b'}}>🏰 Tour de Contrôle</h1><p style={{color:'#64748b', marginBottom:'30px'}}>Vue d'ensemble.</p>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'30px'}}><div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #2563eb', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}><div style={{fontSize:'12px', color:'#64748b', fontWeight:'700'}}>PROJETS ACTIFS</div><div style={{fontSize:'32px', fontWeight:'800', color:'#1e293b'}}>{projects.length}</div></div><div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #ef4444', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}><div style={{fontSize:'12px', color:'#64748b', fontWeight:'700'}}>URGENCES</div><div style={{fontSize:'32px', fontWeight:'800', color:'#ef4444'}}>{tasksUrgent.length}</div></div><div style={{background:'white', padding:'25px', borderRadius:'16px', borderLeft:'6px solid #10b981', boxShadow:'0 4px 6px -1px rgba(0, 0, 0, 0.05)'}}><div style={{fontSize:'12px', color:'#64748b', fontWeight:'700'}}>AVANCEMENT</div><div style={{fontSize:'32px', fontWeight:'800', color:'#10b981'}}>{globalProgress}%</div><div style={{height:'6px', background:'#e2e8f0', borderRadius:'3px', marginTop:'10px'}}><div style={{width:`${globalProgress}%`, height:'100%', background:'#10b981', borderRadius:'3px'}}></div></div></div></div>
                <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'30px'}}><div><h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155'}}>🔥 Alertes</h3><div style={{background:'white', borderRadius:'16px', border:'1px solid #f1f5f9', overflow:'hidden', marginTop:'15px'}}>{tasksUrgent.length === 0 ? <div style={{padding:'20px', textAlign:'center', color:'#94a3b8'}}>Aucune urgence.</div> : tasksUrgent.map(t => <div key={t.id} onClick={()=>onOpenProject(t.project_id)} style={{padding:'15px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', display:'flex', justifyContent:'space-between'}}><span>⚠️ {t.title}</span><span style={{fontSize:'12px', color:'#ef4444'}}>Projet #{t.project_id}</span></div>)}</div></div><div><h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155'}}>👥 Charge</h3><div style={{background:'white', borderRadius:'16px', border:'1px solid #f1f5f9', padding:'20px', marginTop:'15px'}}>{allUsers.map(u => {const userTasks = tasks.filter(t => t.assignee_id === u.id && t.status !== 'done' && !t.deleted_at).length; const loadColor = userTasks > 5 ? '#ef4444' : (userTasks > 2 ? '#facc15' : '#10b981'); return (<div key={u.id} style={{marginBottom:'15px'}}><div style={{display:'flex', justifyContent:'space-between', fontSize:'14px', marginBottom:'5px', fontWeight:'600', color:'#334155'}}><span>{u.username}</span><span>{userTasks} tâches</span></div><div style={{height:'6px', background:'#f1f5f9', borderRadius:'3px'}}><div style={{width:`${Math.min(userTasks*15, 100)}%`, height:'100%', background:loadColor, borderRadius:'3px'}}></div></div></div>)})}</div></div></div>
            </div>
        );
    }
    const myTasks = tasks.filter(t => t.assignee_id === user.id && !t.deleted_at && t.status !== 'done');
    const myProgress = tasks.length===0?0:Math.round((tasks.filter(t=>t.assignee_id === user.id && t.status==='done').length / (tasks.filter(t=>t.assignee_id === user.id).length||1)) * 100);
    return (
        <div style={{padding:'40px', background:'#f8fafc', minHeight:'100vh'}}>
            <h1 style={{fontSize:'24px', color:'#1e293b'}}>Bonjour, {user.username} 👋</h1>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'20px', marginTop:'20px'}}><div style={{background:'white', padding:'20px', borderRadius:'16px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}><div style={{fontSize:'28px', fontWeight:'bold', color:'#3b82f6'}}>{myTasks.length}</div><div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold'}}>À FAIRE</div></div><div style={{background:'white', padding:'20px', borderRadius:'16px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}><div style={{fontSize:'28px', fontWeight:'bold', color:'#10b981'}}>{myProgress}%</div><div style={{fontSize:'12px', color:'#64748b', fontWeight:'bold', marginBottom:'5px'}}>EFFICACITÉ</div><div style={{height:'6px', background:'#f1f5f9', borderRadius:'3px'}}><div style={{width:`${myProgress}%`, height:'100%', background:'#10b981', borderRadius:'3px'}}></div></div></div></div>
            <h3 style={{fontSize:'18px', fontWeight:'700', color:'#334155', marginTop:'30px'}}>🎯 Mes Tâches</h3>
            <div style={{background:'white', borderRadius:'16px', marginTop:'15px', boxShadow:'0 4px 6px -1px rgba(0,0,0,0.05)'}}>{myTasks.length===0?<div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>Rien à faire !</div>:myTasks.map(t=><div key={t.id} onClick={()=>onOpenProject(t.project_id)} style={{padding:'20px', borderBottom:'1px solid #f1f5f9', cursor:'pointer', display:'flex', justifyContent:'space-between'}}><span>{t.title}</span>{t.priority==='high'&&<span style={{fontSize:'10px',background:'#fee2e2',color:'#ef4444',padding:'2px 6px',borderRadius:'4px'}}>URGENT</span>}</div>)}</div>
        </div>
    );
}

function ProjectView({ project, tasks, allUsers, viewMode, setViewMode, onAddTask, onEditTask, onUpdateTask, onDeleteProject, user }) {
    const [newTask, setNewTask] = useState("");
    const getSortedTasks = (taskList) => [...taskList].sort((a, b) => (( {high:3,normal:2,low:1}[b.priority]||2) - ({high:3,normal:2,low:1}[a.priority]||2)));
    const getName = (id) => { const u = allUsers.find(x => x.id === id); return u ? u.username : 'Non assigné'; };
    const exportPDF = () => { const doc = new jsPDF(); doc.text(`Rapport: ${project.name}`, 14, 20); autoTable(doc, { head:[['Tâche','Statut','Qui', 'Date']], body:tasks.map(t=>[t.title,t.status,getName(t.assignee_id), t.due_date ? new Date(t.due_date).toLocaleDateString() : '-']), startY:30 }); doc.save('rapport.pdf'); };

    return ( 
        <div style={{padding:'30px', height:'100%', display:'flex', flexDirection:'column', background:'white'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px'}}><h2 style={{margin:0}}>{project.name}</h2><div style={{display:'flex', gap:'10px'}}><button onClick={exportPDF} style={{background:'white', border:'1px solid #cbd5e1', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}>📥 PDF</button>{user.role==='admin'&&<button onClick={()=>onDeleteProject(project.id)} style={{color:'white', background:'#ef4444', border:'none', padding:'8px 15px', borderRadius:'8px', cursor:'pointer'}}>Supprimer</button>}</div></div>
            <div style={{marginBottom:'20px', display:'flex', gap:'5px'}}><button onClick={()=>setViewMode('board')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background:viewMode==='board'?'#e2e8f0':'transparent', fontWeight:viewMode==='board'?'bold':'normal', cursor:'pointer'}}>Kanban</button><button onClick={()=>setViewMode('list')} style={{padding:'8px 15px', borderRadius:'6px', border:'none', background:viewMode==='list'?'#e2e8f0':'transparent', fontWeight:viewMode==='list'?'bold':'normal', cursor:'pointer'}}>Liste</button></div>
            {viewMode==='board' && <div style={{display:'flex', gap:'20px', overflowX:'auto', paddingBottom:'10px', height:'100%'}}>{['todo', 'doing', 'done'].map(s=>(<div key={s} onDragOver={e=>e.preventDefault()} onDrop={e=>{const id=e.dataTransfer.getData("id"); const t=tasks.find(x=>x.id==id); if(t) onUpdateTask({...t, status:s});}} style={{flex:'0 0 300px', background:'#f8fafc', padding:'15px', borderRadius:'12px', border:'1px solid #eee', height:'fit-content', maxHeight:'100%', overflowY:'auto'}}><div style={{fontWeight:'bold', marginBottom:'15px', textTransform:'uppercase', fontSize:'12px', color:'#64748b', letterSpacing:'1px'}}>{s}</div>{(s==='todo'||user.role==='admin')&&<form onSubmit={e=>{e.preventDefault(); onAddTask(newTask); setNewTask("");}}><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="+ Tâche..." style={{width:'100%', padding:'12px', marginBottom:'15px', borderRadius:'8px', border:'1px solid #e2e8f0'}}/></form>}{getSortedTasks(tasks.filter(t=>(t.status||'todo')===s)).map(t=><div key={t.id} draggable onDragStart={e=>e.dataTransfer.setData("id",t.id)} onClick={()=>onEditTask(t)} style={{background:'white', padding:'15px', marginBottom:'10px', borderRadius:'8px', border:'1px solid #e2e8f0', borderLeft:t.priority==='high'?'4px solid #ef4444':'1px solid #e2e8f0', cursor:'pointer', boxShadow:'0 2px 4px rgba(0,0,0,0.02)'}}><div style={{fontWeight:'600', color:'#334155'}}>{t.title}</div><div style={{fontSize:'11px', color:'#94a3b8', marginTop:'8px', display:'flex', justifyContent:'space-between'}}><span>👤 {getName(t.assignee_id)}</span>{t.due_date && <span>📅 {new Date(t.due_date).toLocaleDateString().slice(0,5)}</span>}</div></div>)}</div>))}</div>}
            {viewMode==='list' && <div style={{overflowX:'auto'}}><table style={{width:'100%', borderCollapse:'collapse', fontSize:'14px'}}><thead style={{background:'#f8fafc', borderBottom:'2px solid #e2e8f0'}}><tr><th style={{padding:'15px', textAlign:'left', color:'#64748b'}}>Tâche</th><th style={{padding:'15px', textAlign:'left', color:'#64748b'}}>Statut</th><th style={{padding:'15px', textAlign:'left', color:'#64748b'}}>Qui</th><th style={{padding:'15px', textAlign:'left', color:'#64748b'}}>Date</th></tr></thead><tbody>{tasks.map(t=><tr key={t.id} onClick={()=>onEditTask(t)} style={{borderBottom:'1px solid #f1f5f9', cursor:'pointer', ':hover':{background:'#f8fafc'}}}><td style={{padding:'15px', fontWeight:'500', color:'#334155'}}>{t.title}{t.priority==='high'&&<span style={{marginLeft:'10px', fontSize:'10px', background:'#fee2e2', color:'#ef4444', padding:'2px 6px', borderRadius:'4px'}}>URGENT</span>}</td><td style={{padding:'15px'}}><span style={{background:t.status==='done'?'#dcfce7':(t.status==='doing'?'#dbeafe':'#f1f5f9'), color:t.status==='done'?'#166534':(t.status==='doing'?'#1e40af':'#475569'), padding:'4px 10px', borderRadius:'20px', fontSize:'12px', fontWeight:'600', textTransform:'uppercase'}}>{t.status}</span></td><td style={{padding:'15px', color:'#64748b'}}>{getName(t.assignee_id)}</td><td style={{padding:'15px', color:'#64748b', fontSize:'13px'}}>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '-'}</td></tr>)}</tbody></table></div>}
        </div> 
    );
}

// ==========================================
// 🔥 MODAL AVEC INDICATEUR DE CHARGEMENT
// ==========================================
function EditTaskModal({ task, user, allUsers, onClose, onUpdate, onDelete }) {
    const [editedTask, setEditedTask] = useState(task);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false); // ETAT DE CHARGEMENT
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetch(`${API_BASE}/comments/${task.id}`, { headers: {'Authorization': user.token} })
            .then(res => res.json()).then(data => setComments(data)).catch(err => console.error(err));
    }, [task.id]);

    const handleSendComment = async (e) => {
        e.preventDefault();
        if(!newComment && !file) return;
        setIsUploading(true); // ON ACTIVE LE CHARGEMENT

        let fileData = null; let fileName = null; let fileType = null;
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                fileData = reader.result; fileName = file.name; fileType = file.type;
                await postComment(fileData, fileName, fileType);
            };
        } else {
            await postComment(null, null, null);
        }
    };

    const postComment = async (fData, fName, fType) => {
        const payload = { task_id: task.id, user_id: user.id, content: newComment, file_data: fData, file_name: fName, file_type: fType };
        try {
            await fetch(`${API_BASE}/comments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const res = await fetch(`${API_BASE}/comments/${task.id}`);
            setComments(await res.json());
            setNewComment(""); setFile(null);
        } catch(err) { alert("Erreur envoi (Fichier trop lourd ?)"); }
        setIsUploading(false); // ON DESACTIVE LE CHARGEMENT
    };

    return (
        <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', justifyContent:'center', alignItems:'center', padding:'20px'}}>
            <div style={{background:'white', width:'100%', maxWidth:'800px', height:'80vh', borderRadius:'16px', display:'flex', overflow:'hidden', boxShadow:'0 25px 50px -12px rgba(0, 0, 0, 0.25)'}}>
                <div style={{width:'40%', padding:'30px', borderRight:'1px solid #e2e8f0', overflowY:'auto', background:'#f8fafc'}}>
                    <h3 style={{margin:'0 0 20px 0', color:'#1e293b'}}>Modifier la tâche</h3>
                    <input value={editedTask.title} onChange={e=>setEditedTask({...editedTask, title:e.target.value})} style={{width:'100%', padding:'12px', border:'1px solid #cbd5e1', borderRadius:'8px', fontSize:'15px', marginBottom:'20px'}} />
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>STATUT</label><select value={editedTask.status} onChange={e=>setEditedTask({...editedTask, status:e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'15px', background:'white'}}><option value="todo">À faire</option><option value="doing">En cours</option><option value="done">Terminé</option></select>
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>PRIORITÉ</label><select value={editedTask.priority} onChange={e=>setEditedTask({...editedTask, priority:e.target.value})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'15px', background:'white'}}><option value="low">Basse</option><option value="normal">Normale</option><option value="high">Haute 🔥</option></select>
                    {user.role === 'admin' && <><label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>RESPONSABLE</label><select value={editedTask.assignee_id || ''} onChange={e=>setEditedTask({...editedTask, assignee_id:parseInt(e.target.value)})} style={{width:'100%', padding:'10px', borderRadius:'8px', border:'1px solid #cbd5e1', marginBottom:'15px', background:'white'}}><option value="">-- Personne --</option>{allUsers.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></>}
                    <label style={{fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>ÉCHÉANCE</label><input type="date" value={editedTask.due_date ? editedTask.due_date.split('T')[0] : ''} onChange={e=>setEditedTask({...editedTask, due_date:e.target.value})} style={{width:'100%', padding:'10px', border:'1px solid #cbd5e1', borderRadius:'8px', background:'white', marginBottom:'30px'}} />
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}><button onClick={()=>onUpdate(editedTask)} style={{padding:'12px', background:'#2563eb', color:'white', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:'bold'}}>Enregistrer</button><div style={{display:'flex', justifyContent:'space-between'}}><button onClick={onClose} style={{padding:'10px', border:'none', background:'transparent', color:'#64748b', cursor:'pointer'}}>Fermer</button><button onClick={onDelete} style={{color:'#ef4444', background:'none', border:'none', cursor:'pointer', fontSize:'12px'}}>Supprimer</button></div></div>
                </div>
                <div style={{flex:1, display:'flex', flexDirection:'column', background:'white'}}>
                    <div style={{padding:'20px', borderBottom:'1px solid #e2e8f0', fontWeight:'bold', color:'#334155'}}>💬 Commentaires & Fichiers</div>
                    <div style={{flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'15px'}}>
                        {comments.length === 0 && <div style={{color:'#cbd5e1', textAlign:'center', marginTop:'50px'}}>Aucun message pour l'instant.</div>}
                        {comments.map(c => (
                            <div key={c.id} style={{display:'flex', gap:'10px', alignItems:'flex-start'}}>
                                <div style={{width:'30px', height:'30px', borderRadius:'50%', background:'#e2e8f0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:'bold', color:'#64748b'}}>{c.username.charAt(0)}</div>
                                <div><div style={{fontSize:'12px', color:'#94a3b8', marginBottom:'2px'}}><b>{c.username}</b> • {new Date(c.created_at).toLocaleString()}</div><div style={{background:'#f1f5f9', padding:'10px', borderRadius:'0 10px 10px 10px', color:'#334155', fontSize:'14px'}}>{c.content}{c.file_data && (<div style={{marginTop:'10px'}}>{c.file_type.startsWith('image/') ? (<img src={c.file_data} alt="pj" style={{maxWidth:'100%', borderRadius:'6px', border:'1px solid #e2e8f0'}} />) : (<a href={c.file_data} download={c.file_name} style={{display:'flex', alignItems:'center', gap:'5px', textDecoration:'none', color:'#2563eb', background:'white', padding:'5px 10px', borderRadius:'6px', border:'1px solid #bfdbfe'}}>📎 {c.file_name}</a>)}</div>)}</div></div>
                            </div>
                        ))}
                    </div>
                    <div style={{padding:'20px', borderTop:'1px solid #e2e8f0', background:'#f8fafc'}}>
                        <form onSubmit={handleSendComment} style={{display:'flex', gap:'10px'}}>
                            <input type="file" ref={fileInputRef} onChange={e=>setFile(e.target.files[0])} style={{display:'none'}} />
                            <button type="button" onClick={()=>fileInputRef.current.click()} style={{background:'white', border:'1px solid #cbd5e1', borderRadius:'8px', padding:'0 15px', cursor:'pointer', fontSize:'18px'}} title="Joindre un fichier">📎</button>
                            <input value={newComment} onChange={e=>setNewComment(e.target.value)} placeholder={file ? `Fichier: ${file.name}` : "Écrire un message..."} style={{flex:1, padding:'12px', borderRadius:'8px', border:'1px solid #cbd5e1'}} />
                            {/* BOUTON AVEC ETAT DE CHARGEMENT */}
                            <button type="submit" disabled={isUploading} style={{background: isUploading ? '#cbd5e1' : '#10b981', color:'white', border:'none', borderRadius:'8px', padding:'0 20px', fontWeight:'bold', cursor: isUploading ? 'wait' : 'pointer'}}>
                                {isUploading ? 'Envoi...' : 'Envoyer'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Sidebar({ sites, projects, activeProject, setActiveProject, onLogout, onCreateProject, onUpdateProject, onCreateSite, onUpdateSite, onDeleteSite, user, setPage, closeMobileMenu }) {
    const [expandedSites, setExpandedSites] = useState({});
    const toggleSite = (id) => setExpandedSites(prev => ({...prev, [id]: !prev[id]}));
    const handleNav = (page, projectId = null) => { setPage(page); setActiveProject(projectId); closeMobileMenu(); };
    return (
        <div style={{width:'260px', background:'#1e293b', color:'white', display:'flex', flexDirection:'column', height:'100%', borderRight:'1px solid #334155'}}>
            <div style={{padding:'20px', borderBottom:'1px solid #334155', display:'flex', alignItems:'center', gap:'10px'}}><img src="/logo.png" alt="Medina Logo" style={{height:'40px', width:'auto', objectFit:'contain'}} onError={(e)=>{e.target.onerror=null; e.target.style.display='none'; e.target.parentNode.innerHTML='<span style="font-size:18px; font-weight:800;">Medina<span style="color:#3b82f6">.</span></span>';}} /></div>
            <div style={{padding:'20px 10px', flex:1, overflowY:'auto'}}>
                <div onClick={()=>handleNav('dashboard')} style={{padding:'10px', cursor:'pointer', color:'#94a3b8', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}>🏠 Tableau de Bord</div>
                <div onClick={()=>handleNav('members')} style={{padding:'10px', cursor:'pointer', color:'#94a3b8', fontWeight:'bold', display:'flex', alignItems:'center', gap:'10px'}}>👥 Équipe</div>
                <div style={{margin:'25px 10px 10px 10px', display:'flex', justifyContent:'space-between', alignItems:'center'}}><span style={{fontSize:'11px', color:'#64748b', fontWeight:'bold', textTransform:'uppercase'}}>ESPACES DE TRAVAIL</span>{user.role==='admin' && <span onClick={()=>{const n=prompt("Nouvel Espace ?"); if(n) onCreateSite(n);}} style={{cursor:'pointer', color:'#3b82f6', fontSize:'16px', fontWeight:'bold'}}>+</span>}</div>
                {sites.map(site => (
                    <div key={site.id} style={{marginBottom:'5px'}}>
                        <div style={{padding:'10px', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer', background:'#1e293b', transition:'0.2s', ':hover':{background:'#334155'}}} onMouseEnter={e=>e.currentTarget.style.background='#334155'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                            <div onClick={()=>toggleSite(site.id)} style={{display:'flex', alignItems:'center', gap:'10px', flex:1}}><span style={{fontSize:'10px', color:'#64748b'}}>{expandedSites[site.id]?'▼':'▶'}</span><span style={{fontWeight:'600', fontSize:'14px'}}>{site.name}</span></div>
                            {user.role==='admin' && <div style={{display:'flex', gap:'8px'}}><span onClick={()=>{const n=prompt("Renommer ?", site.name); if(n) onUpdateSite(site.id, n);}} style={{cursor:'pointer', fontSize:'12px', opacity:0.5}}>✏️</span><span onClick={()=>{if(confirm("Supprimer tout l'espace ?")) onDeleteSite(site.id);}} style={{cursor:'pointer', fontSize:'12px', opacity:0.5}}>🗑️</span></div>}
                        </div>
                        {expandedSites[site.id] && (<div style={{paddingLeft:'28px', marginTop:'2px'}}>{projects.filter(p=>p.site_id===site.id).map(p=>(<div key={p.id} style={{display:'flex', justifyContent:'space-between', alignItems:'center', paddingRight:'10px', marginBottom:'2px', cursor:'pointer', background:activeProject===p.id?'rgba(59, 130, 246, 0.1)':'transparent', borderRadius:'4px'}}><div onClick={()=>handleNav('project', p.id)} style={{padding:'8px', color:activeProject===p.id?'#60a5fa':'#cbd5e1', fontSize:'13px', flex:1}}>📁 {p.name}</div>{user.role==='admin' && <span onClick={()=>{const n=prompt("Renommer projet ?", p.name); if(n) onUpdateProject(p.id, n);}} style={{fontSize:'10px', color:'#64748b', cursor:'pointer', opacity:0.5}}>✏️</span>}</div>))}{user.role==='admin' && <div onClick={()=>{const n=prompt("Nouveau projet ?"); if(n) onCreateProject(site.id, n);}} style={{padding:'8px', color:'#64748b', fontSize:'12px', fontStyle:'italic', cursor:'pointer', marginTop:'5px'}}>+ Nouveau projet</div>}</div>)}
                    </div>
                ))}
            </div>
            <div style={{padding:'20px', borderTop:'1px solid #334155', background:'#0f172a'}}>
                <div style={{display:'flex', alignItems:'center', gap:'10px'}}><div style={{width:'35px', height:'35px', background:'#3b82f6', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{user.username.charAt(0)}</div><div><div style={{fontWeight:'bold', fontSize:'14px'}}>{user.username}</div><div style={{fontSize:'11px', color:'#64748b', textTransform:'uppercase'}}>{user.role}</div></div></div>
                <button onClick={onLogout} style={{width:'100%', marginTop:'15px', border:'1px solid #ef4444', background:'none', color:'#ef4444', cursor:'pointer', borderRadius:'6px', padding:'8px', fontSize:'12px', fontWeight:'bold'}}>Déconnexion</button>
            </div>
        </div>
    );
}

function App() {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [sites, setSites] = useState([]); const [projects, setProjects] = useState([]); const [tasks, setTasks] = useState([]); const [allUsers, setAllUsers] = useState([]);
    const [activeProject, setActiveProject] = useState(null); const [viewMode, setViewMode] = useState('board'); const [editingTask, setEditingTask] = useState(null);
    const isMobile = window.innerWidth < 768; const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => { if (user) fetchData(); }, [user]);
    const fetchData = async () => { try { const h={headers:{'Authorization':user.token}}; const [s,p,t,u]=await Promise.all([fetch(`${API_BASE}/sites`,h), fetch(`${API_BASE}/projects`,h), fetch(`${API_BASE}/tasks`,h), fetch(`${API_BASE}/users`,h)]); if(s.ok) setSites(await s.json()); if(p.ok) setProjects(await p.json()); if(t.ok) setTasks(await t.json()); if(u.ok) setAllUsers(await u.json()); } catch(e){} };

    const handleLogin = async (e) => { e.preventDefault(); const res = await fetch(`${API_BASE}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e.target.email.value, password: e.target.password.value }) }); const data = await res.json(); if (res.ok) { setUser(data); localStorage.setItem('user', JSON.stringify(data)); } else alert(data.message); };

    if (!user) return <div style={{height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9'}}><form onSubmit={handleLogin} style={{padding:'40px', background:'white', borderRadius:'20px', boxShadow:'0 20px 40px -10px rgba(0,0,0,0.1)', width:'350px'}}><h2 style={{textAlign:'center', color:'#1e293b', marginBottom:'30px', fontWeight:'800', fontSize:'28px'}}>Connexion</h2><input name="email" placeholder="Email professionnel" style={{width:'100%', padding:'15px', marginBottom:'15px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'15px'}}/><input name="password" type="password" placeholder="Mot de passe" style={{width:'100%', padding:'15px', marginBottom:'25px', borderRadius:'10px', border:'1px solid #e2e8f0', background:'#f8fafc', fontSize:'15px'}}/><button type="submit" style={{width:'100%', padding:'15px', background:'#1e293b', color:'white', border:'none', borderRadius:'10px', fontWeight:'bold', cursor:'pointer', fontSize:'16px', transition:'0.2s'}}>Se connecter</button></form></div>;

    const activeProjectData = projects.find(p => p.id === activeProject);
    const activeProjectTasks = tasks.filter(t => t.project_id === activeProject && !t.deleted_at);

    return (
        <div style={{display:'flex', height:'100vh', fontFamily:'"Inter", "Segoe UI", sans-serif', overflow:'hidden'}}>
            {isMobile && <button onClick={()=>setIsMenuOpen(!isMenuOpen)} style={{position:'fixed', top:15, left:15, zIndex:1000, background:'#1e293b', color:'white', border:'none', padding:'10px', borderRadius:'8px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)'}}>☰</button>}
            <div style={{position:isMobile?'fixed':'relative', zIndex:999, height:'100%', transform:(isMobile&&!isMenuOpen)?'translateX(-100%)':'translateX(0)', transition:'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow:isMobile?'5px 0 15px rgba(0,0,0,0.1)': 'none'}}>
                <Sidebar sites={sites} projects={projects} activeProject={activeProject} user={user} setActiveProject={setActiveProject} setPage={setCurrentPage} closeMobileMenu={()=>setIsMenuOpen(false)} onLogout={()=>{setUser(null); localStorage.removeItem('user');}} onCreateProject={async (s,n)=>{await fetch(`${API_BASE}/projects`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({site_id:s,name:n,owner_id:user.id})}); fetchData();}} onUpdateProject={async (id,n)=>{await fetch(`${API_BASE}/projects/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})}); fetchData();}} onCreateSite={async (n)=>{await fetch(`${API_BASE}/sites`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})}); fetchData();}} onUpdateSite={async (id,n)=>{await fetch(`${API_BASE}/sites/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:n})}); fetchData();}} onDeleteSite={async (id)=>{await fetch(`${API_BASE}/sites/${id}`,{method:'DELETE'}); fetchData();}} />
            </div>
            <div style={{flex:1, overflowY:'auto', background:'#f8fafc'}}>
                {currentPage==='members' && <MembersView users={allUsers} currentUser={user} onAddUser={async(u)=>{await fetch(`${API_BASE}/users`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(u)}); fetchData();}} onDeleteUser={async(id)=>{await fetch(`${API_BASE}/users/${id}`,{method:'DELETE'}); fetchData();}} />}
                {currentPage==='dashboard' && <Dashboard projects={projects} tasks={tasks} user={user} allUsers={allUsers} onOpenProject={(id)=>{setActiveProject(id); setCurrentPage('project');}} />}
                {currentPage==='project' && activeProject && <ProjectView project={activeProjectData} tasks={activeProjectTasks} allUsers={allUsers} user={user} viewMode={viewMode} setViewMode={setViewMode} onAddTask={async(t)=>{await fetch(`${API_BASE}/tasks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project_id:activeProject,title:t,status:'todo',priority:'normal',assignee_id:user.role==='admin'?null:user.id})}); fetchData();}} onEditTask={setEditingTask} onUpdateTask={async(t)=>{await fetch(`${API_BASE}/tasks/${t.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}); fetchData();}} onDeleteProject={async(id)=>{if(confirm("Supprimer?")) await fetch(`${API_BASE}/projects/${id}`,{method:'DELETE'}); setActiveProject(null); setCurrentPage('dashboard'); fetchData();}} />}
            </div>
            {editingTask && <EditTaskModal task={editingTask} user={user} allUsers={allUsers} onClose={()=>setEditingTask(null)} onUpdate={async(t)=>{await fetch(`${API_BASE}/tasks/${t.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(t)}); fetchData(); setEditingTask(null);}} onDelete={async()=>{if(confirm("Supprimer?")){await fetch(`${API_BASE}/tasks/${editingTask.id}`,{method:'DELETE'}); fetchData(); setEditingTask(null);}}} />}
        </div>
    );
}
export default App;