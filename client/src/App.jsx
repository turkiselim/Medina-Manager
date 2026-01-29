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
        