import { useEffect, useState } from 'react'

function App() {
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [tasks, setTasks] = useState([])
  
  // NOUVEAU : Une variable pour retenir ce que l'utilisateur tape
  const [newTaskTitle, setNewTaskTitle] = useState("")

  useEffect(() => {
    fetch('https://medina-api.onrender.com')
      .then(res => res.json())
      .then(data => setProjects(data))
  }, [])

  const openProject = (project) => {
    setSelectedProject(project);
    fetch(`https://medina-api.onrender.com`)
      .then(res => res.json())
      .then(data => setTasks(data))
  }

  // NOUVEAU : La fonction qui envoie la tâche au serveur
  const handleAddTask = async (e) => {
    e.preventDefault(); // Empêche la page de se recharger
    if (newTaskTitle === "") return; // On ne crée pas de tâche vide

    try {
      const response = await fetch('https://medina-api.onrender.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject.id,
          title: newTaskTitle
        })
      });

      const newTask = await response.json();

      // Mettre à jour l'écran immédiatement (sans recharger)
      setTasks([...tasks, newTask]); 
      setNewTaskTitle(""); // Vider le champ de texte
    } catch (err) {
      console.error("Erreur:", err);
    }
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <h2>🏨 Medina Manager</h2>
        {selectedProject && (
             <div onClick={() => setSelectedProject(null)} className="menu-item" style={{color: '#aaa', cursor: 'pointer'}}>
                ⬅ Retour au menu
             </div>
        )}
        <div className="menu-item">📊 Tableau de bord</div>
      </div>

      <div className="main-content">
        {!selectedProject ? (
          <>
            <div className="header"><h1>Tableau de bord</h1></div>
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
          <>
            <div className="header"><h1>Projet : {selectedProject.name}</h1></div>
            <div style={{display: 'flex', gap: '20px'}}>
              
              {/* Colonne À FAIRE avec formulaire d'ajout */}
              <div style={{flex: 1, background: '#e2e4e7', padding: '10px', borderRadius: '5px'}}>
                <h4 style={{marginBottom: '10px'}}>À FAIRE</h4>
                
                {/* --- LE FORMULAIRE D'AJOUT --- */}
                <form onSubmit={handleAddTask} style={{marginBottom: '15px'}}>
                  <input 
                    type="text" 
                    placeholder="+ Nouvelle tâche..." 
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={{width: '90%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                  />
                </form>
                {/* ----------------------------- */}

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
}

export default App