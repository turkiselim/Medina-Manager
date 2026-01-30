require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// --- CONFIGURATION STOCKAGE ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// --- BASE DE DONNÉES ---
const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL 
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ===================================================
//                 ROUTES API
// ===================================================

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier');
    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, name: req.file.originalname });
});

// --- AUTH ---
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);
        const u = await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING id, username, email, role", [username, email, hash]);
        res.json(u.rows[0]);
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const u = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (u.rows.length === 0) return res.status(401).json("Inconnu");
        const valid = await bcrypt.compare(password, u.rows[0].password_hash);
        if (!valid) return res.status(401).json("Incorrect");
        const token = jwt.sign({ id: u.rows[0].id, role: u.rows[0].role }, process.env.JWT_SECRET, { expiresIn: "24h" });
        res.json({ token, user: { id: u.rows[0].id, username: u.rows[0].username, email: u.rows[0].email, role: u.rows[0].role } });
    } catch (err) { res.status(500).send(err.message); }
});

// --- USERS ---
app.get('/users', async (req, res) => { const u = await pool.query("SELECT id, username, email, role FROM users ORDER BY id"); res.json(u.rows); });
app.put('/users/:id/role', async (req, res) => { await pool.query("UPDATE users SET role = $1 WHERE id = $2", [req.body.role, req.params.id]); res.json({ok:true}); });
app.delete('/users/:id', async (req, res) => { await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]); res.json({ok:true}); });
app.post('/admin/invite', async (req, res) => { const t = Math.random().toString(36).substring(7); await pool.query("INSERT INTO invitations (email, token) VALUES ($1, $2)", [req.body.email, t]); res.json({ link: `https://medina-app.onrender.com/?token=${t}` }); });

// --- SITES & PROJETS ---
app.get('/sites', async (req, res) => { const s = await pool.query("SELECT * FROM sites WHERE deleted_at IS NULL ORDER BY id"); res.json(s.rows); });
app.post('/sites', async (req, res) => { const s = await pool.query("INSERT INTO sites (name, owner_id) VALUES ($1, $2) RETURNING *", [req.body.name, req.body.owner_id]); res.json(s.rows[0]); });
app.get('/projects', async (req, res) => { const p = await pool.query("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY id DESC"); res.json(p.rows); });
app.post('/projects', async (req, res) => { const p = await pool.query("INSERT INTO projects (name, owner_id, site_id) VALUES ($1, $2, $3) RETURNING *", [req.body.name, req.body.owner_id, req.body.site_id]); res.json(p.rows[0]); });
app.get('/projects/:id/members', async (req, res) => { const m = await pool.query("SELECT u.id, u.username FROM users u JOIN project_members pm ON u.id=pm.user_id WHERE pm.project_id=$1", [req.params.id]); res.json(m.rows); });

// --- TÂCHES ---
app.get('/tasks/:pid', async (req, res) => { const t = await pool.query("SELECT * FROM tasks WHERE project_id=$1 AND deleted_at IS NULL ORDER BY id DESC", [req.params.pid]); res.json(t.rows); });
app.post('/tasks', async (req, res) => { const t = await pool.query("INSERT INTO tasks (project_id, title, start_date) VALUES ($1, $2, CURRENT_DATE) RETURNING *", [req.body.project_id, req.body.title]); res.json(t.rows[0]); });
app.put('/tasks/:id', async (req, res) => { 
    const { title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url } = req.body;
    const u = await pool.query(`UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status), priority=COALESCE($4,priority), progress=COALESCE($5,progress), start_date=COALESCE($6,start_date), due_date=COALESCE($7,due_date), assignee_id=COALESCE($8,assignee_id), attachment_url=COALESCE($9,attachment_url) WHERE id=$10 RETURNING *`, [title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url, req.params.id]); 
    res.json(u.rows[0]); 
});

// --- SOUS-TÂCHES & COMMENTAIRES ---
app.get('/tasks/:id/subtasks', async (req, res) => { const s = await pool.query("SELECT * FROM subtasks WHERE task_id=$1 ORDER BY id", [req.params.id]); res.json(s.rows); });
app.post('/subtasks', async (req, res) => { const s = await pool.query("INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *", [req.body.task_id, req.body.title]); res.json(s.rows[0]); });
app.put('/subtasks/:id', async (req, res) => { const s = await pool.query("UPDATE subtasks SET title=COALESCE($1,title), is_completed=COALESCE($2,is_completed) WHERE id=$3 RETURNING *", [req.body.title, req.body.is_completed, req.params.id]); res.json(s.rows[0]); });
app.delete('/subtasks/:id', async (req, res) => { await pool.query("DELETE FROM subtasks WHERE id=$1", [req.params.id]); res.json({ok:true}); });
app.get('/tasks/:id/comments', async (req, res) => { const c = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.task_id=$1 ORDER BY c.created_at DESC", [req.params.id]); res.json(c.rows); });
app.post('/comments', async (req, res) => { const c = await pool.query("INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *", [req.body.task_id, req.body.user_id, req.body.content]); const e = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=$1", [c.rows[0].id]); res.json(e.rows[0]); });

// ====================================================================
// --- DASHBOARD (CORRECTION DE L'ORDRE DES ROUTES) ---
// ====================================================================

// 1. D'ABORD les routes spécifiques (/global)
app.get('/stats/global', async (req, res) => {
    try {
        const tp = await pool.query("SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL");
        const pt = await pool.query("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND deleted_at IS NULL");
        const ct = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'done' AND deleted_at IS NULL");
        res.json({ projects: tp.rows[0].count, pending: pt.rows[0].count, completed: ct.rows[0].count });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/activity/global', async (req, res) => {
    try {
        const a = await pool.query(`SELECT t.*, p.name as project_name, u.username as assignee_name FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assignee_id = u.id WHERE t.deleted_at IS NULL ORDER BY t.created_at DESC LIMIT 15`);
        res.json(a.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. ENSUITE les routes génériques (/:userId)
app.get('/stats/:userId', async (req, res) => {
    try {
        const uid = req.params.userId;
        const tp = await pool.query("SELECT COUNT(*) FROM projects WHERE owner_id=$1 AND deleted_at IS NULL", [uid]);
        const pt = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id=$1 AND status!='done' AND deleted_at IS NULL", [uid]);
        const ct = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id=$1 AND status='done' AND deleted_at IS NULL", [uid]);
        res.json({ projects: tp.rows[0].count, pending: pt.rows[0].count, completed: ct.rows[0].count });
    } catch (err) { res.status(500).send(err.message); }
});

app.get('/users/:userId/activity', async (req, res) => {
    const a = await pool.query(`SELECT t.*, p.name as project_name, u.username as assignee_name FROM tasks t JOIN projects p ON t.project_id=p.id LEFT JOIN users u ON t.assignee_id=u.id WHERE (p.owner_id=$1 OR t.assignee_id=$1) AND t.deleted_at IS NULL ORDER BY t.created_at DESC LIMIT 10`, [req.params.userId]);
    res.json(a.rows);
});

app.get('/users/:userId/tasks', async (req, res) => {
    const t = await pool.query(`SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id=p.id WHERE t.assignee_id=$1 AND t.status!='done' AND t.deleted_at IS NULL ORDER BY t.due_date ASC NULLS LAST`, [req.params.userId]);
    res.json(t.rows);
});

// --- CORBEILLE ---
app.put('/recycle/:type/:id', async (req, res) => { await pool.query(`UPDATE ${req.params.type} SET deleted_at=NOW() WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.put('/restore/:type/:id', async (req, res) => { await pool.query(`UPDATE ${req.params.type} SET deleted_at=NULL WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.delete('/permanent/:type/:id', async (req, res) => { await pool.query(`DELETE FROM ${req.params.type} WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.get('/trash', async (req, res) => {
    const s = await pool.query("SELECT id, name as title, 'sites' as type, deleted_at FROM sites WHERE deleted_at IS NOT NULL");
    const p = await pool.query("SELECT id, name as title, 'projects' as type, deleted_at FROM projects WHERE deleted_at IS NOT NULL");
    const t = await pool.query("SELECT id, title, 'tasks' as type, deleted_at FROM tasks WHERE deleted_at IS NOT NULL");
    res.json([...s.rows, ...p.rows, ...t.rows]);
});

// --- DB UPDATE ---
app.get('/update-db-v10', async (req, res) => {
    try {
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE");
        await pool.query("UPDATE tasks SET start_date = created_at::date WHERE start_date IS NULL");
        res.send("Update V10 OK");
    } catch (e) { res.status(500).send(e.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on ${PORT}`));
