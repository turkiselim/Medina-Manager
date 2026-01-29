import { useEffect, useState } from 'react'
import Login from './Login'

function App() {
  // --- GESTION DE LA CONNEXION ---
  const [token, setToken] = useState(localStorage.getItem('hotel_token'));
  const [user, setUser] = useState(null);

  // --- GESTION DES DONNÉES ---
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [newTaskTitle, setNewTaskTitle] = useState("")

  // Au démarrage, si on est connecté, on charge les projets
  useEffect(() => {
    if (token) {
      // NOTE: Remettez l'URL Render (https://...) si vous publiez, 
      // mais pour l'instant on garde localhost pour tester sur votre PC.
      fetch('https://medina-app.onrender.com/projects')
        .then(res => res.json())
        .then(data => setProjects(data))
        .catch(err => console.error(err))
    }
  }, [token]) // On recharge si le token change

  // Fonction appelée quand le Login réussit
  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('hotel_token', newToken);
  }

  // Fonction pour se déconnecter
  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hotel_token');
    setSelectedProject(null); // On ferme le projet en cours
  }

  // Fonction pour ouvrir un projet
  const openProject = (project) => {
    setSelectedProject(project);
    fetch(`https://medina-app.onrender.com/tasks/${project.id}`)
      .then(res => res.json())
      .then(data => setTasks(data))
  }

  // Fonction pour ajouter une tâche
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (newTaskTitle === "") return;

    try {
      const response = await fetch('https://medina-app.onrender.com/tasks', {
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

  // --- AFFICHAGE CONDITIONNEL ---

  // 1. Si pas connecté -> Ecran de Login
  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Si connecté -> Tableau de bord de l'hôtel
  return (
    <div className="app-container">
      
      {/* BARRE LATÉRALE */}
      <div className="sidebar">
        <h2>🏨 Medina Manager</h2>
        
        {selectedProject && (
             <div onClick={() => setSelectedProject(null)} className="menu-item" style={{color: '#aaa', cursor: 'pointer'}}>
                ⬅ Retour au menu
             </div>
        )}
        
        <div className="menu-item">📊 Tableau de bord</div>
        
        {/* Bouton Déconnexion */}
        <div 
            onClick={handleLogout} 
            className="menu-item" 
            style={{marginTop: 'auto', background: '#e53935', textAlign: 'center'}}
        >
            Se déconnecter
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="main-content">
        
        {/* CAS A : Aucun projet sélectionné -> Liste des projets */}
        {!selectedProject ? (
          <>
            <div className="header">
              <h1>Tableau de bord</h1>
              <p>Bienvenue. Vous êtes connecté.</p>
            </div>
            <h3>Projets en cours</h3>
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card" onClick={() => openProject(project)}>
                  <div className="project-title">{project.name}</div>
                  <div className="project-desc">{project.description}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* CAS B : Projet ouvert -> Colonnes Kanban */
          <>
            <div className="header">
              <h1>Projet : {selectedProject.name}</h1>
            </div>

            <div style={{display: 'flex', gap: '20px'}}>
              
              {/* Colonne À FAIRE */}
              <div style={{flex: 1, background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4 style={{marginBottom: '10px'}}>À FAIRE</h4>
                
                <form onSubmit={handleAddTask} style={{marginBottom: '15px'}}>
                  <input 
                    type="text" 
                    placeholder="+ Nouvelle tâche..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                  />
                </form>

                {tasks.filter(t => t.status === 'todo').map(task => (
                  <div key={task.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                    {task.title}
                  </div>
                ))}
              </div>

              {/* Colonne EN COURS */}
              <div style={{flex: 1, background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4>EN COURS</h4>
                {tasks.filter(t => t.status === 'doing').map(task => (
                  <div key={task.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                    {task.title}
                  </div>
                ))}
              </div>

              {/* Colonne TERMINÉ */}
              <div style={{flex: 1, background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4>TERMINÉ</h4>
                {tasks.filter(t => t.status === 'done').map(task => (
                  <div key={task.id} style={{background: 'white', padding: '10px', marginBottom: '10px', borderRadius: '3px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)'}}>
                    <s>{task.title}</s>
                  </div>
                ))}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
} // <--- C'est cette accolade qu'il vous manquait probablement !

export default App