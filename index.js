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
if (!fs.existsSync(uploadDir)){
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

// --- BDD ---
const connectionString = process.env.DATABASE_URL 
  ? process.env.DATABASE_URL 
  : `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
    connectionString,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// --- ROUTE UPLOAD ---
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).send('Aucun fichier envoyé');
    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ url: fileUrl, name: req.file.originalname });
});

// --- AUTHENTIFICATION ---
app.post('/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        // Par défaut, le rôle est 'member'
        const newUser = await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING id, username, email, role", [username, email, hashedPassword]);
        res.json(newUser.rows[0]);
    } catch (err) { res.status(500).send("Erreur creation compte: " + err.message); }
});

// C'est ICI qu'il manquait le "async" probablement !
app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userResult.rows.length === 0) return res.status(401).json("Email inconnu");
        
        const user = userResult.rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json("Mot de passe incorrect");
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "10h" });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (err) { res.status(500).send("Erreur serveur: " + err.message); }
});

// --- SITES ---
app.get('/sites', async (req, res) => { const sites = await pool.query("SELECT * FROM sites ORDER BY id"); res.json(sites.rows); });
app.post('/sites', async (req, res) => { const { name, owner_id } = req.body; const newSite = await pool.query("INSERT INTO sites (name, owner_id) VALUES ($1, $2) RETURNING *", [name, owner_id]); res.json(newSite.rows[0]); });
app.get('/sites/:siteId/projects', async (req, res) => { const projects = await pool.query("SELECT * FROM projects WHERE site_id = $1 ORDER BY id DESC", [req.params.siteId]); res.json(projects.rows); });

// --- PROJETS ---
app.get('/projects', async (req, res) => { const projects = await pool.query("SELECT * FROM projects"); res.json(projects.rows); });
app.post('/projects', async (req, res) => { const { name, owner_id, site_id } = req.body; const newProject = await pool.query("INSERT INTO projects (name, owner_id, site_id) VALUES ($1, $2, $3) RETURNING *", [name, owner_id, site_id]); res.json(newProject.rows[0]); });
app.put('/projects/:id', async (req, res) => { const { name } = req.body; const up = await pool.query("UPDATE projects SET name=$1 WHERE id=$2 RETURNING *", [name, req.params.id]); res.json(up.rows[0]); });
app.get('/projects/:id/members', async (req, res) => { const m = await pool.query("SELECT u.id, u.username, u.email FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1", [req.params.id]); res.json(m.rows); });

// Invitation Membre
app.post('/projects/:id/invite', async (req, res) => { 
    try { const { email } = req.body; const u = await pool.query("SELECT id FROM users WHERE email=$1", [email]); 
    if(u.rows.length===0) return res.status(404).json("User not found"); 
    await pool.query("INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [req.params.id, u.rows[0].id]); 
    res.json({success:true}); } catch(e){res.status(500).send(e.message)} 
});

// Invitation ADMIN (Lien magique)
app.post('/admin/invite', async (req, res) => {
    const { email } = req.body;
    const token = Math.random().toString(36).substring(7);
    await pool.query("INSERT INTO invitations (email, token) VALUES ($1, $2)", [email, token]);
    const baseUrl = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
    // On renvoie un lien qui pointera vers le site (adaptez si besoin)
    res.json({ link: `https://medina-app.onrender.com/?token=${token}`, token: token }); 
});

// --- TACHES ---
app.get('/tasks/:projectId', async (req, res) => { const tasks = await pool.query("SELECT * FROM tasks WHERE project_id = $1 ORDER BY id DESC", [req.params.projectId]); res.json(tasks.rows); });
app.post('/tasks', async (req, res) => { const { project_id, title } = req.body; const newTask = await pool.query("INSERT INTO tasks (project_id, title) VALUES ($1, $2) RETURNING *", [project_id, title]); res.json(newTask.rows[0]); });
app.put('/tasks/:id', async (req, res) => { 
    const { id } = req.params; 
    const { title, description, status, priority, progress, due_date, assignee_id, attachment_url } = req.body; 
    const update = await pool.query(`UPDATE tasks SET title=COALESCE($1,title), description=COALESCE($2,description), status=COALESCE($3,status), priority=COALESCE($4,priority), progress=COALESCE($5,progress), due_date=COALESCE($6,due_date), assignee_id=COALESCE($7,assignee_id), attachment_url=COALESCE($8,attachment_url) WHERE id=$9 RETURNING *`, 
    [title, description, status, priority, progress, due_date, assignee_id, attachment_url, id]); 
    res.json(update.rows[0]); 
});

// --- SOUS-TACHES ---
app.get('/tasks/:id/subtasks', async (req, res) => { const s = await pool.query("SELECT * FROM subtasks WHERE task_id=$1 ORDER BY id", [req.params.id]); res.json(s.rows); });
app.post('/subtasks', async (req, res) => { const { task_id, title } = req.body; const s = await pool.query("INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *", [task_id, title]); res.json(s.rows[0]); });
app.put('/subtasks/:id', async (req, res) => { const { title, is_completed } = req.body; const s = await pool.query("UPDATE subtasks SET title=COALESCE($1,title), is_completed=COALESCE($2,is_completed) WHERE id=$3 RETURNING *", [title, is_completed, req.params.id]); res.json(s.rows[0]); });
app.delete('/subtasks/:id', async (req, res) => { await pool.query("DELETE FROM subtasks WHERE id=$1", [req.params.id]); res.json({ok:true}); });

// --- COMMENTAIRES ---
app.get('/tasks/:id/comments', async (req, res) => {
    const comments = await pool.query(`SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1 ORDER BY c.created_at DESC`, [req.params.id]);
    res.json(comments.rows);
});
app.post('/comments', async (req, res) => {
    const { task_id, user_id, content } = req.body;
    const newComment = await pool.query("INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *", [task_id, user_id, content]);
    const enriched = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1", [newComment.rows[0].id]);
    res.json(enriched.rows[0]);
});

// --- DASHBOARD DATA ---
app.get('/users/:userId/tasks', async (req, res) => {
    try { const { userId } = req.params; const tasks = await pool.query(`SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.assignee_id = $1 AND t.status != 'done' ORDER BY t.due_date ASC NULLS LAST`, [userId]); res.json(tasks.rows); } catch (err) { res.status(500).send(err.message); }
});
app.get('/stats/:userId', async (req, res) => {
    try { const { userId } = req.params; const tp = await pool.query("SELECT COUNT(*) FROM projects WHERE owner_id = $1", [userId]); const pt = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status != 'done'", [userId]); const ct = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status = 'done'", [userId]); res.json({projects: tp.rows[0].count, pending: pt.rows[0].count, completed: ct.rows[0].count}); } catch (err) { res.status(500).send(err.message); }
});

// --- ROUTES DB UPDATE (Outils) ---
app.get('/setup-db', async (req, res) => { /* Code setup initial conservé si besoin */ res.send("OK"); });
app.get('/update-db-v6', async (req, res) => {
    try {
        await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'member'");
        await pool.query("UPDATE users SET role = 'admin' WHERE id = 1");
        await pool.query(`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, task_id INT REFERENCES tasks(id) ON DELETE CASCADE, user_id INT REFERENCES users(id), content TEXT NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        await pool.query(`CREATE TABLE IF NOT EXISTS invitations (id SERIAL PRIMARY KEY, email VARCHAR(100) NOT NULL, token VARCHAR(100) NOT NULL, used BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);
        res.send("Update V6 (Admin + Commentaires) OK");
    } catch (err) { res.status(500).send("Erreur V6: " + err.message); }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
