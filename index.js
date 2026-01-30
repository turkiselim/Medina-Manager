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

// --- CONFIG STOCKAGE ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// --- BDD ---
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// --- ROUTES STANDARDS (MODIFIÉES POUR CACHER LES SUPPRIMÉS) ---

// SITES (Seulement les actifs)
app.get('/sites', async (req, res) => { 
    const sites = await pool.query("SELECT * FROM sites WHERE deleted_at IS NULL ORDER BY id"); 
    res.json(sites.rows); 
});
app.post('/sites', async (req, res) => { const { name, owner_id } = req.body; const newSite = await pool.query("INSERT INTO sites (name, owner_id) VALUES ($1, $2) RETURNING *", [name, owner_id]); res.json(newSite.rows[0]); });

// PROJETS (Seulement les actifs)
app.get('/projects', async (req, res) => { 
    const projects = await pool.query("SELECT * FROM projects WHERE deleted_at IS NULL"); 
    res.json(projects.rows); 
});
app.get('/sites/:siteId/projects', async (req, res) => { 
    const projects = await pool.query("SELECT * FROM projects WHERE site_id = $1 AND deleted_at IS NULL ORDER BY id DESC", [req.params.siteId]); 
    res.json(projects.rows); 
});
app.post('/projects', async (req, res) => { const { name, owner_id, site_id } = req.body; const newProject = await pool.query("INSERT INTO projects (name, owner_id, site_id) VALUES ($1, $2, $3) RETURNING *", [name, owner_id, site_id]); res.json(newProject.rows[0]); });

// TACHES (Seulement les actives)
app.get('/tasks/:projectId', async (req, res) => { 
    const tasks = await pool.query("SELECT * FROM tasks WHERE project_id = $1 AND deleted_at IS NULL ORDER BY id DESC", [req.params.projectId]); 
    res.json(tasks.rows); 
});
// CRÉATION TÂCHE (Avec start_date par défaut = aujourd'hui)
app.post('/tasks', async (req, res) => { 
    const { project_id, title } = req.body; 
    // On met la date de début à aujourd'hui par défaut
    const newTask = await pool.query("INSERT INTO tasks (project_id, title, start_date) VALUES ($1, $2, CURRENT_DATE) RETURNING *", [project_id, title]); 
    res.json(newTask.rows[0]); 
});

// --- GESTION CORBEILLE (NOUVEAU) ---

// 1. Mettre à la corbeille (Soft Delete)
app.put('/recycle/:type/:id', async (req, res) => {
    const { type, id } = req.params; // type = 'sites', 'projects', 'tasks'
    // Sécurité basique sur le nom de table
    if (!['sites', 'projects', 'tasks'].includes(type)) return res.status(400).send("Type invalide");
    
    await pool.query(`UPDATE ${type} SET deleted_at = NOW() WHERE id = $1`, [id]);
    res.json({ message: "Mis à la corbeille" });
});

// 2. Restaurer
app.put('/restore/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    if (!['sites', 'projects', 'tasks'].includes(type)) return res.status(400).send("Type invalide");
    
    await pool.query(`UPDATE ${type} SET deleted_at = NULL WHERE id = $1`, [id]);
    res.json({ message: "Restauré" });
});
// MISE À JOUR TÂCHE (Avec start_date)
app.put('/tasks/:id', async (req, res) => { 
    const { id } = req.params; 
    const { title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url } = req.body; 
    
    const update = await pool.query(`
        UPDATE tasks SET 
        title=COALESCE($1,title), 
        description=COALESCE($2,description), 
        status=COALESCE($3,status), 
        priority=COALESCE($4,priority), 
        progress=COALESCE($5,progress), 
        start_date=COALESCE($6,start_date), 
        due_date=COALESCE($7,due_date), 
        assignee_id=COALESCE($8,assignee_id), 
        attachment_url=COALESCE($9,attachment_url) 
        WHERE id=$10 RETURNING *`, 
    [title, description, status, priority, progress, start_date, due_date, assignee_id, attachment_url, id]); 
    
    res.json(update.rows[0]); 
});

// 3. Supprimer DÉFINITIVEMENT
app.delete('/permanent/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    if (!['sites', 'projects', 'tasks'].includes(type)) return res.status(400).send("Type invalide");
    
    await pool.query(`DELETE FROM ${type} WHERE id = $1`, [id]);
    res.json({ message: "Adieu pour toujours" });
});

// 4. Voir le contenu de la corbeille (Admin)
app.get('/trash', async (req, res) => {
    try {
        const sites = await pool.query("SELECT id, name as title, 'sites' as type, deleted_at FROM sites WHERE deleted_at IS NOT NULL");
        const projects = await pool.query("SELECT id, name as title, 'projects' as type, deleted_at FROM projects WHERE deleted_at IS NOT NULL");
        const tasks = await pool.query("SELECT id, title, 'tasks' as type, deleted_at FROM tasks WHERE deleted_at IS NOT NULL");
        
        res.json([...sites.rows, ...projects.rows, ...tasks.rows]);
    } catch (err) { res.status(500).send(err.message); }
});

// --- AUTRES ROUTES (Login, Upload, Subtasks, Comments...) ---
// (Je remets les versions raccourcies pour garder le fichier complet)
app.post('/upload', upload.single('file'), (req, res) => { if (!req.file) return res.status(400); const url = `${process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000'}/uploads/${req.file.filename}`; res.json({ url, name: req.file.originalname }); });
app.post('/auth/register', async (req, res) => { const { username, email, password } = req.body; const hash = await bcrypt.hash(password, 10); const u = await pool.query("INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, 'member') RETURNING *", [username, email, hash]); res.json(u.rows[0]); });
app.post('/auth/login', async (req, res) => { const { email, password } = req.body; const r = await pool.query("SELECT * FROM users WHERE email = $1", [email]); if(r.rows.length===0) return res.status(401).json("Non trouvé"); const valid = await bcrypt.compare(password, r.rows[0].password_hash); if(!valid) return res.status(401).json("Mdp faux"); const token = jwt.sign({ id: r.rows[0].id, role: r.rows[0].role }, process.env.JWT_SECRET); res.json({ token, user: r.rows[0] }); });
app.get('/projects/:id/members', async (req, res) => { const m = await pool.query("SELECT u.id, u.username FROM users u JOIN project_members pm ON u.id = pm.user_id WHERE pm.project_id = $1", [req.params.id]); res.json(m.rows); });
app.post('/admin/invite', async (req, res) => { const token = Math.random().toString(36).substring(7); await pool.query("INSERT INTO invitations (email, token) VALUES ($1, $2)", [req.body.email, token]); res.json({ link: `https://medina-app.onrender.com/?token=${token}` }); });
app.get('/tasks/:id/subtasks', async (req, res) => { const s = await pool.query("SELECT * FROM subtasks WHERE task_id=$1 ORDER BY id", [req.params.id]); res.json(s.rows); });
app.post('/subtasks', async (req, res) => { const s = await pool.query("INSERT INTO subtasks (task_id, title) VALUES ($1, $2) RETURNING *", [req.body.task_id, req.body.title]); res.json(s.rows[0]); });
app.put('/subtasks/:id', async (req, res) => { const s = await pool.query("UPDATE subtasks SET title=COALESCE($1,title), is_completed=COALESCE($2,is_completed) WHERE id=$3 RETURNING *", [req.body.title, req.body.is_completed, req.params.id]); res.json(s.rows[0]); });
app.delete('/subtasks/:id', async (req, res) => { await pool.query("DELETE FROM subtasks WHERE id=$1", [req.params.id]); res.json({ok:true}); });
app.get('/tasks/:id/comments', async (req, res) => { const c = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.task_id = $1 ORDER BY c.created_at DESC", [req.params.id]); res.json(c.rows); });
app.post('/comments', async (req, res) => { const c = await pool.query("INSERT INTO comments (task_id, user_id, content) VALUES ($1, $2, $3) RETURNING *", [req.body.task_id, req.body.user_id, req.body.content]); const e = await pool.query("SELECT c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = $1", [c.rows[0].id]); res.json(e.rows[0]); });
app.get('/users/:userId/activity', async (req, res) => { const a = await pool.query("SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id LEFT JOIN users u ON t.assignee_id = u.id WHERE p.owner_id = $1 AND t.deleted_at IS NULL ORDER BY t.id DESC LIMIT 10", [req.params.userId]); res.json(a.rows); });
app.get('/users/:userId/tasks', async (req, res) => { const t = await pool.query("SELECT t.*, p.name as project_name FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.assignee_id = $1 AND t.status != 'done' AND t.deleted_at IS NULL", [req.params.userId]); res.json(t.rows); });
app.get('/stats/:userId', async (req, res) => { const tp = await pool.query("SELECT COUNT(*) FROM projects WHERE owner_id = $1 AND deleted_at IS NULL", [req.params.userId]); const pt = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status != 'done' AND deleted_at IS NULL", [req.params.userId]); const ct = await pool.query("SELECT COUNT(*) FROM tasks WHERE assignee_id = $1 AND status = 'done' AND deleted_at IS NULL", [req.params.userId]); res.json({projects: tp.rows[0].count, pending: pt.rows[0].count, completed: ct.rows[0].count}); });
app.get('/update-db-v8', async (req, res) => { try { await pool.query("ALTER TABLE sites ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL"); await pool.query("ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL"); await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP DEFAULT NULL"); res.send("Update V8 OK"); } catch (e) { res.status(500).send(e.message); } });

const PORT = process.env.PORT || 5000;

// --- GESTION RH (MEMBRES) ---

// 1. Lister tout le personnel
app.get('/users', async (req, res) => {
    try {
        // On récupère tout sauf le mot de passe (sécurité)
        const users = await pool.query("SELECT id, username, email, role, created_at FROM users ORDER BY id ASC");
        res.json(users.rows);
    } catch (err) { res.status(500).send(err.message); }
});

// 2. Changer le grade d'un employé (Promotion/Rétrogradation)
app.put('/users/:id/role', async (req, res) => {
    const { role } = req.body; // 'admin' ou 'member'
    try {
        await pool.query("UPDATE users SET role = $1 WHERE id = $2", [role, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// 3. Renvoyer un employé (Suppression de compte)
app.delete('/users/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).send(err.message); }
});

// --- ROUTE MAJ V10 (GANTT - DATE DE DÉBUT) ---
app.get('/update-db-v10', async (req, res) => {
    try {
        await pool.query("ALTER TABLE tasks ADD COLUMN IF NOT EXISTS start_date DATE");
        // Pour ne pas avoir de bugs, on initialise la date de début = date de création pour les anciennes tâches
        await pool.query("UPDATE tasks SET start_date = created_at::date WHERE start_date IS NULL");
        res.send("Base de données prête pour la Chronologie !");
    } catch (err) { res.status(500).send("Erreur V10: " + err.message); }
});


app.listen(PORT, () => console.log(`Server started on ${PORT}`));