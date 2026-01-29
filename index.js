const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // On importe le pilote PostgreSQL
require('dotenv').config(); // On charge les clés du fichier .env

const app = express();
const PORT = 5000;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Configuration de la connexion
const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL  // Si on est sur le Cloud (Render)
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`; // Si on est en local

const pool = new Pool({
    connectionString,
    // Cette ligne est obligatoire pour Render (SSL) mais doit être désactivée en local
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
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

// --- DÉBUT DU SYSTÈME D'AUTHENTIFICATION ---

// 1. Route pour CRÉER un compte (Inscription)
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // On crypte le mot de passe (on le "hache")
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // On insère le nouvel employé dans la base
        const newUser = await pool.query(
            "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email",
            [username, email, hashedPassword]
        );

        res.json(newUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur: Email ou utilisateur déjà pris ?");
    }
});

// 2. Route pour SE CONNECTER (Login)
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // A. On cherche l'utilisateur par son email
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json("Email incorrect ou utilisateur inconnu");
        }

        const user = userResult.rows[0];

        // B. On vérifie si le mot de passe correspond au cryptage
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json("Mot de passe incorrect");
        }

        // C. C'est bon ! On génère le badge d'accès (Token)
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });

        // On renvoie le badge et les infos de l'utilisateur
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur Serveur");
    }
});
// --- FIN DU SYSTÈME D'AUTHENTIFICATION ---

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

// --- ROUTE SPÉCIALE POUR INITIALISER LA BDD DANS LE CLOUD ---
app.get('/setup-db', async (req, res) => {
    try {
        // 1. Créer la table Users
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Créer la table Teams (Optionnel pour l'instant mais utile)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS teams (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 3. Créer la table Projects
        await pool.query(`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                name VARCHAR(150) NOT NULL,
                description TEXT,
                owner_id INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 4. Créer la table Tasks
        await pool.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id SERIAL PRIMARY KEY,
                project_id INT REFERENCES projects(id) ON DELETE CASCADE,
                title VARCHAR(200) NOT NULL,
                status VARCHAR(20) DEFAULT 'todo',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        res.send("Base de données initialisée avec succès ! (Tables créées)");
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur lors de l'initialisation : " + err.message);
    }
});




app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});