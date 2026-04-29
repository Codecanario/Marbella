/**
 * server.js - Backend Marbella GDKP
 * Usa Express + express-session + MongoDB Atlas (datos permanentes)
 */

const express  = require('express');
const session  = require('express-session');
const multer   = require('multer');
const fs       = require('fs');
const path     = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Crear carpeta uploads si no existe ──────────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
let db;

async function connectDB() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  db = client.db('marbella');
  console.log('✅ Conectado a MongoDB Atlas');
}

// ─── Multer ───────────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|mov/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  }
});

// ─── Middlewares ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(session({
  secret: 'marbella-gdkp-secret-666',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.status(401).json({ error: 'No autenticado' });
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════════════════════

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Faltan campos' });
  const exists = await db.collection('users').findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') } });
  if (exists) return res.status(409).json({ error: 'El nick ya existe' });
  await db.collection('users').insertOne({ username, password, createdAt: new Date() });
  res.json({ ok: true });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('users').findOne({ username: { $regex: new RegExp('^' + username + '$', 'i') }, password });
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
  req.session.user = { id: user._id.toString(), username: user.username };
  res.json({ ok: true, username: user.username });
});

app.post('/api/logout', (req, res) => { req.session.destroy(); res.json({ ok: true }); });

app.get('/api/me', (req, res) => {
  if (req.session.user) return res.json({ loggedIn: true, user: req.session.user });
  res.json({ loggedIn: false });
});

app.post('/api/recover', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) return res.status(400).json({ error: 'Faltan campos' });
  const result = await db.collection('users').updateOne(
    { username: { $regex: new RegExp('^' + username + '$', 'i') } },
    { $set: { password: newPassword } }
  );
  if (result.matchedCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// RAIDS
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/raids', requireAuth, async (req, res) => {
  const raids = await db.collection('raids').find().sort({ createdAt: -1 }).toArray();
  res.json(raids.map(r => ({ ...r, id: r._id.toString() })));
});

app.post('/api/raids', requireAuth, async (req, res) => {
  const { title, description, date, maxPlayers } = req.body;
  if (!title) return res.status(400).json({ error: 'Título obligatorio' });
  const result = await db.collection('raids').insertOne({
    title, description: description || '', date: date || '',
    maxPlayers: parseInt(maxPlayers) || 25,
    createdBy: req.session.user.username, createdAt: new Date(), members: []
  });
  const newRaid = await db.collection('raids').findOne({ _id: result.insertedId });
  res.json({ ...newRaid, id: newRaid._id.toString() });
});

app.put('/api/raids/:id', requireAuth, async (req, res) => {
  const { title, description, date, maxPlayers } = req.body;
  const raid = await db.collection('raids').findOne({ _id: new ObjectId(req.params.id) });
  if (!raid) return res.status(404).json({ error: 'Raid no encontrada' });
  if (raid.createdBy !== req.session.user.username) return res.status(403).json({ error: 'Sin permiso' });
  await db.collection('raids').updateOne({ _id: new ObjectId(req.params.id) },
    { $set: { title, description, date, maxPlayers: parseInt(maxPlayers) || raid.maxPlayers } });
  res.json({ ok: true });
});

app.delete('/api/raids/:id', requireAuth, async (req, res) => {
  const raid = await db.collection('raids').findOne({ _id: new ObjectId(req.params.id) });
  if (!raid) return res.status(404).json({ error: 'Raid no encontrada' });
  if (raid.createdBy !== req.session.user.username) return res.status(403).json({ error: 'Sin permiso' });
  await db.collection('raids').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ ok: true });
});

app.post('/api/raids/:id/join', requireAuth, async (req, res) => {
  const raid = await db.collection('raids').findOne({ _id: new ObjectId(req.params.id) });
  if (!raid) return res.status(404).json({ error: 'Raid no encontrada' });
  if (raid.members.includes(req.session.user.username)) return res.status(409).json({ error: 'Ya estás apuntado' });
  if (raid.members.length >= raid.maxPlayers) return res.status(409).json({ error: 'Raid completa' });
  await db.collection('raids').updateOne({ _id: new ObjectId(req.params.id) }, { $push: { members: req.session.user.username } });
  res.json({ ok: true });
});

app.post('/api/raids/:id/leave', requireAuth, async (req, res) => {
  await db.collection('raids').updateOne({ _id: new ObjectId(req.params.id) }, { $pull: { members: req.session.user.username } });
  res.json({ ok: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// MEDIA
// ══════════════════════════════════════════════════════════════════════════════

app.get('/api/media', requireAuth, async (req, res) => {
  const media = await db.collection('media').find().sort({ date: -1 }).toArray();
  res.json(media.map(m => ({ ...m, id: m._id.toString() })));
});

app.post('/api/media/upload', requireAuth, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se subió archivo' });
  const isVideo = /mp4|webm|mov/.test(path.extname(req.file.originalname).toLowerCase().replace('.', ''));
  const newMedia = {
    username: req.session.user.username, type: isVideo ? 'video' : 'image',
    filename: req.file.filename, path: '/uploads/' + req.file.filename,
    caption: req.body.caption || '', date: new Date()
  };
  const result = await db.collection('media').insertOne(newMedia);
  res.json({ ...newMedia, id: result.insertedId.toString() });
});

app.delete('/api/media/:id', requireAuth, async (req, res) => {
  const media = await db.collection('media').findOne({ _id: new ObjectId(req.params.id) });
  if (!media) return res.status(404).json({ error: 'No encontrado' });
  if (media.username !== req.session.user.username) return res.status(403).json({ error: 'Sin permiso' });
  const filePath = path.join(UPLOADS_DIR, media.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  await db.collection('media').deleteOne({ _id: new ObjectId(req.params.id) });
  res.json({ ok: true });
});

// ─── Arrancar ─────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => console.log(`\n🕸️  Marbella GDKP corriendo en http://localhost:${PORT}\n`));
}).catch(err => { console.error('❌ Error MongoDB:', err); process.exit(1); });
