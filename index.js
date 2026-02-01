const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
// ⚠️ TRES IMPORTANT : On autorise les gros fichiers (50 Mo)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

// --- 🛠️ RÉPARATION AUTOMATIQUE DE LA BASE DE DONNÉES ---
const initDB = async () => {
    try {
        // 1. Créer la table si elle n'existe pas
        await pool.query(`
          CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            task_id INT REFERENCES tasks(id) ON DELETE CASCADE,
            user_id INT REFERENCES users(id) ON DELETE CASCADE,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // 2. FORCER L'AJOUT DES COLONNES FICHIERS (Si elles manquent)
        await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_data TEXT");
        await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_name TEXT");
        await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS file_type TEXT");
        
        console.log("✅ Base de données mise à jour avec succès (Colonnes Fichiers)");
    } catch (err) {
        console.error("❌ Erreur initDB:", err);
    }
};
initDB();
// ---------------------------------------------------------

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

const sendEmail = async (to, subject, html) => {
    if (!to) return;
    try { await transporter.sendMail({ from: `"Medina Manager" <${process.env.EMAIL_USER}>`, to, subject, html }); } catch (err) { console.error("❌ Erreur email:", err); }
};

// --- ROUTES ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: "Inconnu" });
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ message: "Pass incorrect" });
    const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY");
    res.json({ token, id: user.id, username: user.username, role: user.role });
  } catch (err) { res.status(500).json({ message: "Erreur serveur" }); }
});

// COMMENTAIRES & FICHIERS
app.get("/comments/:taskId", async (req, res) => {
    try {
        const result = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1 ORDER BY c.created_at ASC", [req.params.taskId]);
        res.json(result.rows);
    } catch (e) { res.status(500).send(e); }
});

app.post("/comments", async (req, res) => {
    const { task_id, user_id, content, file_data, file_name, file_type } = req.body;
    try {
        await pool.query(
            "INSERT INTO comments (task_id, user_id, content, file_data, file_name, file_type) VALUES ($1, $2, $3, $4, $5, $6)",
            [task_id, user_id, content, file_data, file_name, file_type]
        );
        res.sendStatus(201);
    } catch (e) { console.error(e); res.status(500).send("Erreur enregistrement commentaire"); }
});

// UTILISATEURS
app.get("/users", async (req, res) => { try { res.json((await pool.query("SELECT id, username, email, role FROM users ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.post("/users", async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)", [username, email, hash, role]);
        sendEmail(email, "Bienvenue - Medina OS", `<h3>Bonjour ${username}</h3><p>Compte créé.<br>Login: ${email}<br>Pass: ${password}</p>`);
        res.sendStatus(201);
    } catch(e) { res.status(500).send("Erreur"); }
});
app.delete("/users/:id", async (req, res) => { try { await pool.query("UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1", [req.params.id]); await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });

// SITES, PROJETS, TÂCHES
app.get("/sites", async (req, res) => { try { res.json((await pool.query("SELECT * FROM sites ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.post("/sites", async (req, res) => { try { await pool.query("INSERT INTO sites (name) VALUES ($1)", [req.body.name]); res.sendStatus(201); } catch(e) { res.status(500).send(e); } });
app.put("/sites/:id", async (req, res) => { try { await pool.query("UPDATE sites SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });
app.delete("/sites/:id", async (req, res) => { try { const projs = await pool.query("SELECT id FROM projects WHERE site_id = $1", [req.params.id]); const projIds = projs.rows.map(p => p.id); if(projIds.length > 0) { await pool.query("DELETE FROM tasks WHERE project_id = ANY($1::int[])", [projIds]); await pool.query("DELETE FROM projects WHERE site_id = $1", [req.params.id]); } await pool.query("DELETE FROM sites WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });

app.get("/projects", async (req, res) => { try { res.json((await pool.query("SELECT * FROM projects ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.post("/projects", async (req, res) => { try { await pool.query("INSERT INTO projects (site_id, name, owner_id) VALUES ($1, $2, $3)", [req.body.site_id, req.body.name, req.body.owner_id]); res.sendStatus(201); } catch(e) { res.status(500).send(e); } });
app.put("/projects/:id", async (req, res) => { try { await pool.query("UPDATE projects SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });
app.delete("/projects/:id", async (req, res) => { try { await pool.query("DELETE FROM tasks WHERE project_id = $1", [req.params.id]); await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });

app.get("/tasks", async (req, res) => { try { res.json((await pool.query("SELECT * FROM tasks ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.post("/tasks", async (req, res) => {
    const { project_id, title, status, priority, assignee_id } = req.body;
    try { 
        await pool.query("INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES ($1, $2, $3, $4, $5)", [project_id, title, status, priority, assignee_id]);
        if (assignee_id) {
            const u = (await pool.query("SELECT email, username FROM users WHERE id = $1", [assignee_id])).rows[0];
            if(u) sendEmail(u.email, "Nouvelle Tâche", `<p>On vous a assigné : <b>${title}</b></p>`);
        }
        res.sendStatus(201); 
    } catch(e) { res.status(500).send(e); }
});
app.put("/tasks/:id", async (req, res) => {
    const { status, priority, assignee_id, due_date, title } = req.body;
    try { 
        await pool.query("UPDATE tasks SET status=COALESCE($1, status), priority=COALESCE($2, priority), assignee_id=COALESCE($3, assignee_id), due_date=COALESCE($4, due_date), title=COALESCE($5, title) WHERE id=$6", [status, priority, assignee_id, due_date, title, req.params.id]); 
        if (assignee_id) {
             const u = (await pool.query("SELECT email, username FROM users WHERE id = $1", [assignee_id])).rows[0];
             if(u) sendEmail(u.email, "Tâche Mise à jour", `<p>La tâche <b>${title}</b> a changé.</p>`);
        }
        res.sendStatus(200); 
    } catch(e) { res.status(500).send(e); }
});
app.delete("/tasks/:id", async (req, res) => { try { await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });