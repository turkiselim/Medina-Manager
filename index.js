const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); // LE FACTEUR
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// 1. CONNEXION BDD
const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
  ssl: { rejectUnauthorized: false }
});

// 2. CONFIGURATION DU FACTEUR (GMAIL)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Votre adresse Gmail
    pass: process.env.EMAIL_PASS  // Le code à 16 lettres
  }
});

// Fonction utilitaire pour envoyer des mails sans bloquer le serveur
const sendEmail = async (to, subject, html) => {
    if (!to) return;
    try {
        await transporter.sendMail({
            from: `"Medina Manager" <${process.env.EMAIL_USER}>`,
            to, subject, html
        });
        console.log(`📧 Email envoyé à ${to}`);
    } catch (err) {
        console.error("❌ Erreur envoi email:", err);
    }
};

// --- ROUTES ---

// LOGIN
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

// CRÉATION UTILISATEUR + EMAIL DE BIENVENUE
app.post("/users", async (req, res) => {
    const { username, email, password, role } = req.body;
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)", [username, email, hash, role]);
        
        // 📧 ENVOI DU MAIL
        sendEmail(email, "Bienvenue sur Medina OS 🏨", `
            <h3>Bonjour ${username},</h3>
            <p>Votre compte professionnel a été créé.</p>
            <p><b>Login :</b> ${email}<br><b>Mot de passe provisoire :</b> ${password}</p>
            <p>Connectez-vous ici : <a href="https://medina-app.onrender.com">Accéder au Manager</a></p>
        `);

        res.sendStatus(201);
    } catch(e) { console.error(e); res.status(500).send("Erreur création utilisateur"); }
});

// CRÉATION TÂCHE + EMAIL NOTIFICATION
app.post("/tasks", async (req, res) => {
    const { project_id, title, status, priority, assignee_id } = req.body;
    try { 
        await pool.query("INSERT INTO tasks (project_id, title, status, priority, assignee_id) VALUES ($1, $2, $3, $4, $5)", [project_id, title, status, priority, assignee_id]);
        
        // Si assigné à quelqu'un, on prévient
        if (assignee_id) {
            const userRes = await pool.query("SELECT email, username FROM users WHERE id = $1", [assignee_id]);
            if (userRes.rows.length > 0) {
                const u = userRes.rows[0];
                sendEmail(u.email, "Nouvelle Tâche Assignée 🎯", `
                    <p>Bonjour ${u.username},</p>
                    <p>Une nouvelle tâche vous a été assignée : <b>${title}</b></p>
                    <p>Priorité : ${priority === 'high' ? '🔥 URGENTE' : 'Normale'}</p>
                `);
            }
        }
        res.sendStatus(201); 
    } catch(e) { res.status(500).send(e); }
});

// MISE À JOUR TÂCHE + EMAIL (Si changement de propriétaire)
app.put("/tasks/:id", async (req, res) => {
    const { status, priority, assignee_id, due_date, title } = req.body;
    try { 
        // On met à jour
        await pool.query("UPDATE tasks SET status=COALESCE($1, status), priority=COALESCE($2, priority), assignee_id=COALESCE($3, assignee_id), due_date=COALESCE($4, due_date), title=COALESCE($5, title) WHERE id=$6", [status, priority, assignee_id, due_date, title, req.params.id]); 
        
        // Si on vient d'assigner quelqu'un, on notifie
        if (assignee_id) {
             const userRes = await pool.query("SELECT email, username FROM users WHERE id = $1", [assignee_id]);
             if (userRes.rows.length > 0) {
                 const u = userRes.rows[0];
                 sendEmail(u.email, "Mise à jour de tâche 📝", `
                     <p>Bonjour ${u.username},</p>
                     <p>La tâche <b>"${title}"</b> vous concerne désormais.</p>
                     <p>Statut actuel : ${status}</p>
                 `);
             }
        }
        res.sendStatus(200); 
    } catch(e) { res.status(500).send(e); }
});

// AUTRES ROUTES (Lecture / Suppression) - INCHANGÉES
app.get("/sites", async (req, res) => { try { res.json((await pool.query("SELECT * FROM sites ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/projects", async (req, res) => { try { res.json((await pool.query("SELECT * FROM projects ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/tasks", async (req, res) => { try { res.json((await pool.query("SELECT * FROM tasks ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.get("/users", async (req, res) => { try { res.json((await pool.query("SELECT id, username, email, role FROM users ORDER BY id")).rows); } catch(e) { res.status(500).send(e); } });
app.post("/sites", async (req, res) => { try { await pool.query("INSERT INTO sites (name) VALUES ($1)", [req.body.name]); res.sendStatus(201); } catch(e) { res.status(500).send(e); } });
app.put("/sites/:id", async (req, res) => { try { await pool.query("UPDATE sites SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });
app.delete("/sites/:id", async (req, res) => { try { const projs = await pool.query("SELECT id FROM projects WHERE site_id = $1", [req.params.id]); const projIds = projs.rows.map(p => p.id); if(projIds.length > 0) { await pool.query("DELETE FROM tasks WHERE project_id = ANY($1::int[])", [projIds]); await pool.query("DELETE FROM projects WHERE site_id = $1", [req.params.id]); } await pool.query("DELETE FROM sites WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });
app.post("/projects", async (req, res) => { try { await pool.query("INSERT INTO projects (site_id, name, owner_id) VALUES ($1, $2, $3)", [req.body.site_id, req.body.name, req.body.owner_id]); res.sendStatus(201); } catch(e) { res.status(500).send(e); } });
app.put("/projects/:id", async (req, res) => { try { await pool.query("UPDATE projects SET name = $1 WHERE id = $2", [req.body.name, req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });
app.delete("/projects/:id", async (req, res) => { try { await pool.query("DELETE FROM tasks WHERE project_id = $1", [req.params.id]); await pool.query("DELETE FROM projects WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });
app.delete("/tasks/:id", async (req, res) => { try { await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch (e) { res.status(500).send(e); } });
app.delete("/users/:id", async (req, res) => { try { await pool.query("UPDATE tasks SET assignee_id = NULL WHERE assignee_id = $1", [req.params.id]); await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]); res.sendStatus(200); } catch(e) { res.status(500).send(e); } });

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => { console.log(`Server running on port ${PORT}`); });