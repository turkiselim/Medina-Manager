import { useEffect, useState } from 'react'
import Login from './Login'

function App() {
  // --- CONFIGURATION ---
  // REMPLACEZ CECI PAR VOTRE URL RENDER (SANS SLASH À LA FIN)
  const API_URL = 'https://medina-api.onrender.com'; 

  // --- ÉTATS (MÉMOIRE) ---
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);
  
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  
  // Champs de saisie
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [newProjectName, setNewProjectName] = useState("") // <--- NOUVEAU

  // --- CHARGEMENT ---
  useEffect(() => {
    if (token) {
      // On récupère l'utilisateur stocké si on a rafraichi la page (optionnel mais utile)
      // Pour faire simple ici, on suppose que le token suffit pour l'instant.
      fetch(`${API_URL}/projects`)
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(err => console.error(err))
    }
  }, [token])

  // --- ACTIONS ---

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('hotel_token', newToken);
  }

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hotel_token');
    setSelectedProject(null);
  }

  const openProject = (project) => {
    setSelectedProject(project);
    fetch(`${API_URL}/tasks/${project.id}`)
      .then(res => res.json())
      .then(data => setTasks(data))
  }

  // CRÉER UNE TÂCHE
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle === "") return;

    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          title: newTaskTitle
        })
      });
      const newTask = await response.json();
      setTasks([...tasks, newTask]); 
      setNewTaskTitle(""); 
    } catch (err) {
      console.error("Erreur:", err);
    }
  }

  // CRÉER UN PROJET (NOUVEAU)
  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (newProjectName === "") return;

    try {
        const response = await fetch(`${API_URL}/projects`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: newProjectName,
                description: "Projet créé depuis le dashboard",
                owner_id: user ? user.id : 1 // Si on a perdu l'user, on met 1 par défaut
            })
        });
        const newProject = await response.json();
        setProjects([...projects, newProject]); // On l'ajoute à la liste immédiatement
        setNewProjectName(""); // On vide le champ
    } catch (err) {
        console.error("Erreur création projet:", err);
    }
  }

  // --- AFFICHAGE ---

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      
      {/* SIDEBAR */}
      <div className="sidebar">
        <h2>🏨 Medina Manager</h2>
        {selectedProject && (
             <div onClick={() => setSelectedProject(null)} className="menu-item" style={{color: '#aaa', cursor: 'pointer'}}>
                ⬅ Retour au menu
             </div>
        )}
        <div className="menu-item">📊 Tableau de bord</div>
        <div onClick={handleLogout} className="menu-item" style={{marginTop: 'auto', background: '#e53935', textAlign: 'center', cursor: 'pointer'}}>
            Se déconnecter
        </div>
      </div>

      {/* CONTENU */}
      <div className="main-content">
        
        {/* VUE TABLEAU DE BORD (LISTE DES PROJETS) */}
        {!selectedProject ? (
          <>
            <div className="header">
              <h1>Tableau de bord</h1>
              <p>Bienvenue. Sélectionnez un projet ou créez-en un nouveau.</p>
            </div>

            {/* FORMULAIRE NOUVEAU PROJET */}
            <div style={{background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '30px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'}}>
                <h3 style={{marginTop: 0}}>+ Nouveau Projet</h3>
                <form onSubmit={handleCreateProject} style={{display: 'flex', gap: '10px'}}>
                    <input 
                        type="text" 
                        placeholder="Nom du projet (ex: Rénovation Spa)" 
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        style={{flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ddd'}}
                    />
                    <button type="submit" style={{padding: '10px 20px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}}>
                        Créer
                    </button>
                </form>
            </div>

            <h3>Projets en cours</h3>
            <div className="projects-grid">
              {projects.length === 0 && <p style={{color: '#888'}}>Aucun projet pour l'instant.</p>}
              
              {projects.map(project => (
                <div key={project.id} className="project-card" onClick={() => openProject(project)}>
                  <div className="project-title">{project.name}</div>
                  <div className="project-desc">{project.description}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* VUE PROJET (KANBAN) */
          <>
            <div className="header">
              <h1>Projet : {selectedProject.name}</h1>
            </div>

            <div style={{display: 'flex', gap: '20px', overflowX: 'auto'}}>
              {/* Colonnes... (Même code qu'avant) */}
              <div style={{flex: 1, minWidth: '250px', background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4 style={{marginBottom: '10px'}}>À FAIRE</h4>
                <form onSubmit={handleAddTask} style={{marginBottom: '15px'}}>
                  <input type="text" placeholder="+ Tâche..." value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} style={{width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}} />
                </form>
                {tasks.filter(t => t.status === 'todo').map(t => (
                  <div key={t.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>{t.title}</div>
                ))}
              </div>

              <div style={{flex: 1, minWidth: '250px', background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4>EN COURS</h4>
                {tasks.filter(t => t.status === 'doing').map(t => (
                  <div key={t.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>{t.title}</div>
                ))}
              </div>

              <div style={{flex: 1, minWidth: '250px', background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4>TERMINÉ</h4>
                {tasks.filter(t => t.status === 'done').map(t => (
                  <div key={t.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}><s>{t.title}</s></div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App