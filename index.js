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

// Route pour CRÉER un projet
app.post('/projects', async (req, res) => {
    try {
        const { name, description, owner_id } = req.body;
        const newProject = await pool.query(
            "INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
            [name, description, owner_id]
        );
        res.json(newProject.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Erreur lors de la création du projet");
    }
});

// --- ROUTE DE MISE À JOUR V2 (À SUPPRIMER APRÈS USAGE) ---
app.get('/update-db-v2', async (req, res) => {
    try {
        // Ajout des colonnes pour la V2
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT");
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium'"); // low, medium, high
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date DATE");
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0"); // 0 à 100%
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_url TEXT"); // Lien vers photo/fichier
        
        res.send("Base de données mise à jour vers V2 !");
    } catch (err) {
        res.status(500).send("Erreur MAJ: " + err.message);
    }
});
// Route pour MODIFIER une tâche (PUT)
app.put('/tasks/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, status, priority, progress, due_date, attachment_url } = req.body;
        
        // On met à jour tous les champs
        const update = await pool.query(
            `UPDATE tasks SET 
             title = COALESCE($1, title),
             description = COALESCE($2, description),
             status = COALESCE($3, status),
             priority = COALESCE($4, priority),
             progress = COALESCE($5, progress),
             due_date = COALESCE($6, due_date),
             attachment_url = COALESCE($7, attachment_url)
             WHERE id = $8 RETURNING *`,
            [title, description, status, priority, progress, due_date, attachment_url, id]
        );
        res.json(update.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erreur mise à jour tâche");
    }
});

// --- ROUTE DE MISE À JOUR V3 (ENTERPRISE) ---
app.get('/update-db-v3', async (req, res) => {
    try {
        // 1. Créer la table SITES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sites (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                owner_id INT REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // 2. Lier PROJETS aux SITES
        await pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_id INT REFERENCES sites(id) ON DELETE CASCADE");

        // 3. Créer un Site par défaut pour ne pas perdre les vieux projets
        const defaultSite = await pool.query("INSERT INTO sites (name, owner_id) VALUES ('Site Principal', 1) ON CONFLICT DO NOTHING RETURNING id");
        // Si des projets n'ont pas de site, on les met dans le site par défaut (ID 1 probablement)
        await pool.query("UPDATE projects SET site_id = 1 WHERE site_id IS NULL");

        // 4. Table de liaison PROJET <-> MEMBRES (Qui a le droit de voir quoi ?)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS project_members (
                project_id INT REFERENCES projects(id) ON DELETE CASCADE,
                user_id INT REFERENCES users(id) ON DELETE CASCADE,
                role VARCHAR(20) DEFAULT 'member',
                PRIMARY KEY (project_id, user_id)
            )
        `);

        // 5. Lier TÂCHES aux UTILISATEURS (Assignation)
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id INT REFERENCES users(id)");

        res.send("Architecture Multi-Sites & Équipes déployée avec succès !");
    } catch (err) {
        res.status(500).send("Erreur V3: " + err.message);
    }
});


// --- GESTION DES SITES ---
app.get('/sites', async (req, res) => {
    // Dans la vraie vie, on filtrerait par user_id, ici on simplifie
    const sites = await pool.query("SELECT * FROM sites ORDER BY id");
    res.json(sites.rows);
});

app.post('/sites', async (req, res) => {
    const { name, owner_id } = req.body;
    const newSite = await pool.query("INSERT INTO sites (name, owner_id) VALUES ($1, $2) RETURNING *", [name, owner_id]);
    res.json(newSite.rows[0]);
});

// --- GESTION DES MEMBRES D'UN PROJET ---
// 1. Récupérer les membres
app.get('/projects/:id/members', async (req, res) => {
    const { id } = req.params;
    const members = await pool.query(
        "SELECT u.id, u.username, u.email FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1", 
        [id]
    );
    res.json(members.rows);
});

// 2. Ajouter un membre par email
app.post('/projects/:id/invite', async (req, res) => {
    const { id } = req.params; // ID du projet
    const { email } = req.body;

    try {
        // Trouver l'utilisateur
        const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length === 0) return res.status(404).json("Cet utilisateur n'est pas encore inscrit sur l'application.");
        
        const userId = userCheck.rows[0].id;

        // L'ajouter au projet
        await pool.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, userId]);
        
        res.json({ success: true, message: "Membre ajouté !" });
    } catch (err) {
        res.status(500).json("Erreur lors de l'invitation");
    }
});

// --- MODIFICATION : Récupérer les projets D'UN SITE spécifique ---
app.get('/sites/:siteId/projects', async (req, res) => {
    const { siteId } = req.params;
    const projects = await pool.query("SELECT * FROM projects WHERE site_id = $1 ORDER BY id DESC", [siteId]);
    res.json(projects.rows);
});

// --- ROUTE MAJ V4 (SOUS-TÂCHES) ---
app.get('/update-db-v4', async (req, res) => {
    try {
        // 1. Table SOUS-TÂCHES
        await pool.query(`
            CREATE TABLE IF NOT EXISTS subtasks (
                id SERIAL PRIMARY KEY,
                task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        res.send("Module Sous-Tâches installé !");
    } catch (err) {
        res.status(500).send("Erreur V4: " + err.message);
    }
});




app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
});