const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// CONNEXION BDD
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) return res.status(400).json({ message: "Utilisateur inconnu" });
    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ message: "Mot de passe incorrect" });
    const token = jwt.sign({ id: user.id, role: user.role }, "SECRET_KEY_TEMPORAIRE");
    res.json({ token, id: user.id, username: user.username, role: user.role });
  } catch (err) { res.status(500).json({ message: "Erreur serveur login" }); }
});

// --- ROUTES LECTURE ---
app.get("/sites", async (req, res) => { try { res.json((await pool.query("SELECT * FROM sites ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/projects", async (req, res) => { try { res.json((await pool.query("SELECT * FROM projects")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/tasks", async (req, res) => { try { res.json((await pool.query("SELECT * FROM tasks")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/users", async (req, res) => { try { res.json((await pool.query("SELECT id, username, email, role FROM users")).rows); } catch(e) { res.status(500).send(e); } });

// --- GESTION DES SITES (ESPACES) ---
app.post("/sites", async (req, res) => {
    try { await pool.query("INSERT INTO sites (name) VALUES ($1)", [req.body.name]); res.sendStatus(201); } catch(e) { res.status(500).send(e); }
});
app.put("/sites/:id", async (req, res) => {
    try { await pool.query("UPDATE sites SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); }
});
app.delete("/sites/:id", async (req, res) => {
    try {
        // NETTOYAGE COMPLET EN CASCADE
        // 1. Trouver les projets du site
        const projs = await pool.query("SELECT id FROM projects WHERE site_id = $1", [req.params.id]);
        const projIds = projs.rows.map(p => p.id);
        
        if(projIds.length > 0) {
             // 2. Supprimer les tâches de ces projets
            await pool.query("DELETE FROM tasks WHERE project_id = ANY($1::int[])", [projIds]);
             // 3. Supprimer les projets
            await pool.query("DELETE FROM projects WHERE site_id = $1", [req.params.id]);
        }
        // 4. Supprimer le site
        await pool.query("DELETE FROM sites WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (e) { console.error(e); res.status(500).send(e); }
});

// --- GESTION PROJETS & TÂCHES ---
app.post("/projects", async (req, res) => {
    try { await pool.query("INSERT INTO projects (site_id, name, owner_id) VALUES ($1, $2, $3)", [req.body.site_id, req.body.name, req.body.owner_id]); res.sendStatus(201); } catch(e) { res.status(500).send(e); }
});
app.delete("/projects/:id", async (req, res) => {
    try {
        await pool.query("DELETE FROM tasks WHERE project_id = $1", [req.params.id]);
        await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]);
        res.sendStatus(200);
    } catch (e) { res.status(500).send(e); }
});

app.post("/tasks", async (req, res) => {
    try { await pool.query("INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES ($1, $2, $3, $4, $5)", [req.body.project_id, req.body.title, req.body.status, req.body.priority, req.body.assignee_id]); res.sendStatus(201); } catch(e) { res.status(500).send(e); }
});
app.put("/tasks/:id", async (req, res) => {
    const { status, priority, assignee_id, due_date, title } = req.body;
    try { await pool.query("UPDATE tasks SET status=COALESCE($1, status), priority=COALESCE($2, priority), assignee_id=COALESCE($3, assignee_id), due_date=COALESCE($4, due_date), title=COALESCE($5, title) WHERE id=$6", [status, priority, assignee_id, due_date, title, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); }
});
app.delete("/tasks/:id", async (req, res) => {
    try { await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });