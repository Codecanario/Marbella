/**
 * server.js - Backend principal del Foro Naxxramas
 * Usa Express + express-session + almacenamiento en JSON
 */

const express = require('express');
const session = require('express-session');
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Crear carpetas necesarias si no existen ─────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR_PATH = path.join(__dirname, 'data');
if (!fs.existsSync(UPLOADS_DIR))   fs.mkdirSync(UPLOADS_DIR,   { recursive: true });
if (!fs.existsSync(DATA_DIR_PATH)) fs.mkdirSync(DATA_DIR_PATH, { recursive: true });

// ─── Rutas a archivos JSON ────────────────────────────────────────────────────
const DATA_DIR   = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const RAIDS_FILE = path.join(DATA_DIR, 'raids.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const MEDIA_FILE = path.join(DATA_DIR, 'media.json');

// ─── Helpers JSON ─────────────────────────────────────────────────────────────
const readJSON  = (file) => {
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
};
const writeJSON = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

// ─── Inicializar archivos JSON vacíos si no existen ──────────────────────────
[USERS_FILE, RAIDS_FILE, POSTS_FILE, MEDIA_FILE].forEach(f => {
  if (!fs.existsSync(f)) writeJSON(f, []);
});

// ─── Multer: subida de archivos ───────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(session({
  secret: 'naxxramas-secret-key-666',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 1 día
}));

// ─── Middleware de autenticación ──────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'No autenticado' });
};

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS AUTH
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/register
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });

  const users = readJSON(USERS_FILE);
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
    return res.status(409).json({ error: 'El nick ya existe' });

  const newUser = { id: Date.now(), username, password, createdAt: new Date().toISOString() };
  users.push(newUser);
  writeJSON(USERS_FILE, users);
  res.json({ ok: true });
});

// POST /api/login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = readJSON(USERS_FILE);
  const user  = users.find(u =>
    u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  req.session.user = { id: user.id, username: user.username };
  res.json({ ok: true, username: user.username });
});

// POST /api/logout
app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true });
});

// GET /api/me - comprueba sesión activa
app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json({ loggedIn: true, user: req.session.user });
  res.json({ loggedIn: false });
});

// POST /api/recover - recuperar contraseña por nick
app.post('/api/recover', (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({ error: 'Faltan campos' });

  const users = readJSON(USERS_FILE);
  const idx   = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });

  users[idx].password = newPassword;
  writeJSON(USERS_FILE, users);
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS RAIDS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/raids
app.get('/api/raids', requireAuth, (req, res) => {
  res.json(readJSON(RAIDS_FILE));
});

// POST /api/raids
app.post('/api/raids', requireAuth, (req, res) => {
  const { title, description, date, maxPlayers } = req.body;
  if (!title) return res.status(400).json({ error: 'Título obligatorio' });

  const raids   = readJSON(RAIDS_FILE);
  const newRaid = {
    id: Date.now(),
    title,
    description: description || '',
    date: date || '',
    maxPlayers: parseInt(maxPlayers) || 25,
    createdBy: req.session.user.username,
    createdAt: new Date().toISOString(),
    members: []
  };
  raids.push(newRaid);
  writeJSON(RAIDS_FILE, raids);
  res.json(newRaid);
});

// PUT /api/raids/:id
app.put('/api/raids/:id', requireAuth, (req, res) => {
  const raids = readJSON(RAIDS_FILE);
  const idx   = raids.findIndex(r => r.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Raid no encontrada' });
  if (raids[idx].createdBy !== req.session.user.username)
    return res.status(403).json({ error: 'Sin permiso' });

  const { title, description, date, maxPlayers } = req.body;
  raids[idx] = { ...raids[idx], title, description, date, maxPlayers: parseInt(maxPlayers) || raids[idx].maxPlayers };
  writeJSON(RAIDS_FILE, raids);
  res.json(raids[idx]);
});

// DELETE /api/raids/:id
app.delete('/api/raids/:id', requireAuth, (req, res) => {
  const raids = readJSON(RAIDS_FILE);
  const idx   = raids.findIndex(r => r.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Raid no encontrada' });
  if (raids[idx].createdBy !== req.session.user.username)
    return res.status(403).json({ error: 'Sin permiso' });

  raids.splice(idx, 1);
  writeJSON(RAIDS_FILE, raids);
  res.json({ ok: true });
});

// POST /api/raids/:id/join
app.post('/api/raids/:id/join', requireAuth, (req, res) => {
  const raids = readJSON(RAIDS_FILE);
  const idx   = raids.findIndex(r => r.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Raid no encontrada' });

  const raid = raids[idx];
  if (raid.members.includes(req.session.user.username))
    return res.status(409).json({ error: 'Ya estás apuntado' });
  if (raid.members.length >= raid.maxPlayers)
    return res.status(409).json({ error: 'Raid completa' });

  raid.members.push(req.session.user.username);
  writeJSON(RAIDS_FILE, raids);
  res.json(raid);
});

// POST /api/raids/:id/leave
app.post('/api/raids/:id/leave', requireAuth, (req, res) => {
  const raids = readJSON(RAIDS_FILE);
  const idx   = raids.findIndex(r => r.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Raid no encontrada' });

  raids[idx].members = raids[idx].members.filter(m => m !== req.session.user.username);
  writeJSON(RAIDS_FILE, raids);
  res.json(raids[idx]);
});

// ══════════════════════════════════════════════════════════════════════════════
// RUTAS MEDIA (CLIPS)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/media
app.get('/api/media', requireAuth, (req, res) => {
  res.json(readJSON(MEDIA_FILE));
});

// POST /api/media/upload
app.post('/api/media/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });

  const media    = readJSON(MEDIA_FILE);
  const isVideo  = /mp4|webm|mov/.test(path.extname(req.file.originalname).toLowerCase().replace('.',''));
  const newMedia = {
    id:       Date.now(),
    username: req.session.user.username,
    type:     isVideo ? 'video' : 'image',
    filename: req.file.filename,
    path:     '/uploads/' + req.file.filename,
    caption:  req.body.caption || '',
    date:     new Date().toISOString()
  };
  media.unshift(newMedia); // más reciente primero
  writeJSON(MEDIA_FILE, media);
  res.json(newMedia);
});

// DELETE /api/media/:id
app.delete('/api/media/:id', requireAuth, (req, res) => {
  const media = readJSON(MEDIA_FILE);
  const idx   = media.findIndex(m => m.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'No encontrado' });
  if (media[idx].username !== req.session.user.username)
    return res.status(403).json({ error: 'Sin permiso' });

  // Borrar archivo físico
  const filePath = path.join(__dirname, 'uploads', media[idx].filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  media.splice(idx, 1);
  writeJSON(MEDIA_FILE, media);
  res.json({ ok: true });
});

// ─── Iniciar servidor ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🕸️  Marbella GDKP Forum corriendo en http://localhost:${PORT}\n`);
});
