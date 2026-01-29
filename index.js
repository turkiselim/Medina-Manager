const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // On importe le pilote PostgreSQL
require('dotenv').config(); // On charge les clés du fichier .env

const app = express();
const PORT = 5000;

// Configuration de la connexion
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME
});

app.use(cors());
app.use(express.json());

// Route d'accueil
app.get('/', (req, res) => {
    res.send("Le serveur fonctionne !");
});

// NOUVELLE ROUTE : Récupérer les utilisateurs depuis la base de données
app.get('/users', async (req, res) => {
    try {
        // On demande à la base : "Donne-moi tout ce qu'il y a dans la table users"
        const result = await pool.query('SELECT * FROM users');
        // On renvoie la réponse en JSON (format de données)
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur Serveur");
    }
});

// Route pour récupérer les projets
app.get('/projects', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM projects');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur Serveur");
    }
});

// Route pour récupérer les tâches d'un projet spécifique
app.get('/tasks/:projectId', async (req, res) => {
    try {
        const { projectId } = req.params; // On récupère l'ID demandé
        const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1', [projectId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur Serveur");
    }
});

// Route pour CRÉER une nouvelle tâche
app.post('/tasks', async (req, res) => {
    try {
        // Le serveur reçoit le titre et l'ID du projet depuis le navigateur
        const { project_id, title } = req.body;
        
        // Il insère la commande dans la base de données
        const newTask = await pool.query(
            "INSERT INTO tasks (project_id, title, status) VALUES ($1, $2, 'todo') RETURNING *",
            [project_id, title]
        );
        
        // Il renvoie la tâche créée pour confirmer
        res.json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur Serveur");
    }
});



app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});