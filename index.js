require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');

const app = express();

// --- EMAIL ---
const EMAIL_USER = 'medinahotels.belisaire@gmail.com'; 
const EMAIL_PASS = 'lwmt eoyi gguz xgjy'; 

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

const sendAssignmentEmail = async (userEmail, userName, taskTitle, projectName) => {
    if (!userEmail) return;
    try {
        await transporter.sendMail({
            from: `"MedinaOS" <${EMAIL_USER}>`,
            to: userEmail,
            subject: `🔔 Mission : ${taskTitle}`,
            html: `<p>Bonjour ${userName},</p><p>Nouvelle tâche dans <strong>${projectName}</strong> : ${taskTitle}</p><a href="https://medina-app.onrender.com">Ouvrir MedinaOS</a>`
        });
    } catch (e) { console.error("Mail error", e); }
};

// --- STOCKAGE ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({ destination: (req, file, cb) => cb(null, uploadDir), filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) });
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false });

// --- ROUTES ---

app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('Rien');
    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    res.json({ url: `${baseUrl}/uploads/${req.file.filename}`, name: req.file.originalname });
});

// AUTH & USERS
app.post('/auth/login', async (req, res) => {
    const u = await pool.query("SELECT * FROM users WHERE email = $1", [req.body.email]);
    if (u.rows.length === 0 || !(await bcrypt.compare(req.body.password, u.rows[0].password_hash))) return res.status(401).json("Erreur");
    const token = jwt.sign({ id: u.rows[0].id, role: u.rows[0].role }, process.env.JWT_SECRET || 'secret');
    res.json({ token, user: { id: u.rows[0].id, username: u.rows[0].username, email: u.rows[0].email, role: u.rows[0].role } });
});
app.post('/auth/register', async (req, res) => { const h = await bcrypt.hash(req.body.password, 10); const u = await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING *", [req.body.username, req.body.email, h]); res.json(u.rows[0]); });
app.get('/users', async (req, res) => { const u = await pool.query("SELECT id, username, email, role FROM users ORDER BY id"); res.json(u.rows); });
app.put('/users/:id/role', async (req, res) => { await pool.query("UPDATE users SET role = $1 WHERE id = $2", [req.body.role, req.params.id]); res.json({ok:true}); });
app.delete('/users/:id', async (req, res) => { await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]); res.json({ok:true}); });
app.post('/admin/invite', async (req, res) => { const t = Math.random().toString(36).substring(7); await pool.query("INSERT INTO invitations (email, token) VALUES ($1, $2)", [req.body.email, t]); res.json({ link: `https://medina-app.onrender.com/?token=${t}` }); });

// DATA
app.get('/sites', async (req, res) => { const s = await pool.query("SELECT * FROM sites WHERE deleted_at IS NULL ORDER BY id"); res.json(s.rows); });
app.post('/sites', async (req, res) => { const s = await pool.query("INSERT INTO sites (name, owner_id) VALUES ($1, $2) RETURNING *", [req.body.name, req.body.owner_id]); res.json(s.rows[0]); });
app.get('/projects', async (req, res) => { const p = await pool.query("SELECT * FROM projects WHERE deleted_at IS NULL ORDER BY id DESC"); res.json(p.rows); });
app.post('/projects', async (req, res) => { const p = await pool.query("INSERT INTO projects (name, owner_id, site_id) VALUES ($1, $2, $3) RETURNING *", [req.body.name, req.body.owner_id, req.body.site_id]); res.json(p.rows[0]); });

// TASKS
app.get('/tasks/:pid', async (req, res) => { const t = await pool.query("SELECT * FROM tasks WHERE project_id=$1 AND deleted_at IS NULL ORDER BY id DESC", [req.params.pid]); res.json(t.rows); });
app.post('/tasks', async (req, res) => { const t = await pool.query("INSERT INTO tasks (project_id, title, start_date) VALUES ($1, $2, CURRENT_DATE) RETURNING *", [req.body.project_id, req.body.title]); res.json(t.rows[0]); });
app.put('/tasks/:id', async (req, res) => { 
    const { title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url } = req.body;
    const old = await pool.query("SELECT assignee_id, project_id FROM tasks WHERE id = $1", [req.params.id]);
    const u = await pool.query(`UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status), priority=COALESCE($4,priority), progress=COALESCE($5,progress), start_date=COALESCE($6,start_date), due_date=COALESCE($7,due_date), assignee_id=COALESCE($8,assignee_id), attachment_url=COALESCE($9,attachment_url) WHERE id=$10 RETURNING *`, [title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url, req.params.id]); 
    if (assignee_id && old.rows[0] && old.rows[0].assignee_id != assignee_id) {
        const user = await pool.query("SELECT email, username FROM users WHERE id = $1", [assignee_id]);
        const proj = await pool.query("SELECT name FROM projects WHERE id = $1", [old.rows[0].project_id]);
        if (user.rows[0]) sendAssignmentEmail(user.rows[0].email, user.rows[0].username, u.rows[0].title, proj.rows[0]?.name);
    }
    res.json(u.rows[0]); 
});

// SUBTASKS & COMMENTS
app.get('/tasks/:id/subtasks', async (req, res) => { const s = await pool.query("SELECT * FROM subtasks WHERE task_id=$1 ORDER BY id", [req.params.id]); res.json(s.rows); });
app.post('/subtasks', async (req, res) => { const s = await pool.query("INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *", [req.body.task_id, req.body.title]); res.json(s.rows[0]); });
app.put('/subtasks/:id', async (req, res) => { const s = await pool.query("UPDATE subtasks SET title=COALESCE($1,title), is_completed=COALESCE($2,is_completed) WHERE id=$3 RETURNING *", [req.body.title, req.body.is_completed, req.params.id]); res.json(s.rows[0]); });
app.delete('/subtasks/:id', async (req, res) => { await pool.query("DELETE FROM subtasks WHERE id=$1", [req.params.id]); res.json({ok:true}); });
app.get('/tasks/:id/comments', async (req, res) => { const c = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.task_id=$1 ORDER BY c.created_at DESC", [req.params.id]); res.json(c.rows); });
app.post('/comments', async (req, res) => { const { task_id, user_id, content, attachment_url } = req.body; const c = await pool.query("INSERT INTO comments (task_id, user_id, content, attachment_url) VALUES ($1, $2, $3, $4) RETURNING *", [task_id, user_id, content, attachment_url]); const e = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id=u.id WHERE c.id=$1", [c.rows[0].id]); res.json(e.rows[0]); });

// --- BUSINESS INTELLIGENCE DASHBOARD (NOUVEAU) ---
app.get('/dashboard/advanced', async (req, res) => {
    try {
        // 1. Stats globales (Compteurs)
        const total = await pool.query("SELECT COUNT(*) FROM tasks WHERE deleted_at IS NULL");
        const done = await pool.query("SELECT COUNT(*) FROM tasks WHERE status = 'done' AND deleted_at IS NULL");
        const pending = await pool.query("SELECT COUNT(*) FROM tasks WHERE status != 'done' AND deleted_at IS NULL");
        const projects = await pool.query("SELECT COUNT(*) FROM projects WHERE deleted_at IS NULL");

        // 2. Tâches Critiques (Haute priorité & Pas finies)
        const critical = await pool.query(`
            SELECT t.id, t.title, p.name as project_name, u.username as assignee_name, t.due_date 
            FROM tasks t 
            JOIN projects p ON t.project_id = p.id 
            LEFT JOIN users u ON t.assignee_id = u.id 
            WHERE t.priority = 'high' AND t.status != 'done' AND t.deleted_at IS NULL 
            ORDER BY t.due_date ASC LIMIT 5
        `);

        // 3. Charge Équipe (Qui fait quoi)
        const team = await pool.query(`
            SELECT u.username, 
                   COUNT(t.id) FILTER (WHERE t.status != 'done') as todo_count,
                   COUNT(t.id) FILTER (WHERE t.status = 'done') as done_count
            FROM users u 
            LEFT JOIN tasks t ON u.id = t.assignee_id AND t.deleted_at IS NULL
            GROUP BY u.id 
            ORDER BY todo_count DESC 
            LIMIT 5
        `);

        // 4. Activité Récente (Log)
        const activity = await pool.query(`SELECT t.*, p.name as project_name, u.username as assignee_name FROM tasks t JOIN projects p ON t.project_id=p.id LEFT JOIN users u ON t.assignee_id=u.id WHERE t.deleted_at IS NULL ORDER BY t.created_at DESC LIMIT 10`);

        res.json({
            stats: { 
                total: parseInt(total.rows[0].count), 
                done: parseInt(done.rows[0].count),
                pending: parseInt(pending.rows[0].count),
                projects: parseInt(projects.rows[0].count)
            },
            critical: critical.rows,
            team: team.rows,
            activity: activity.rows
        });
    } catch (err) { res.status(500).send(err.message); }
});

// LISTES
app.get('/global-tasks', async (req, res) => { const { status, role, userId } = req.query; let q = `SELECT t.*, p.name as p_name, u.username as u_name FROM tasks t JOIN projects p ON t.project_id=p.id LEFT JOIN users u ON t.assignee_id=u.id WHERE t.deleted_at IS NULL`; const p = []; if (status === 'done') q += " AND t.status = 'done'"; else if (status === 'todo') q += " AND t.status != 'done'"; if (role !== 'admin') { p.push(userId); q += " AND (t.assignee_id = $1 OR p.owner_id = $1)"; } q += " ORDER BY t.due_date ASC"; const r = await pool.query(q, p); res.json(r.rows); });

// TRASH & TOOLS
app.put('/recycle/:type/:id', async (req, res) => { await pool.query(`UPDATE ${req.params.type} SET deleted_at=NOW() WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.put('/restore/:type/:id', async (req, res) => { await pool.query(`UPDATE ${req.params.type} SET deleted_at=NULL WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.delete('/permanent/:type/:id', async (req, res) => { await pool.query(`DELETE FROM ${req.params.type} WHERE id=$1`, [req.params.id]); res.json({ok:true}); });
app.get('/trash', async (req, res) => { const s=await pool.query("SELECT id, name as title, 'sites' as type, deleted_at FROM sites WHERE deleted_at IS NOT NULL"); const p=await pool.query("SELECT id, name as title, 'projects' as type, deleted_at FROM projects WHERE deleted_at IS NOT NULL"); const t=await pool.query("SELECT id, title, 'tasks' as type, deleted_at FROM tasks WHERE deleted_at IS NOT NULL"); res.json([...s.rows, ...p.rows, ...t.rows]); });
app.get('/update-db-v16', async (req, res) => { try { await pool.query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS attachment_url TEXT"); res.send("DB Update V16 OK"); } catch (e) { res.status(500).send(e.message); } });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT}`));