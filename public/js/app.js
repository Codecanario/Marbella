/**
 * app.js — Lógica frontend del Foro Naxxramas
 * Maneja: auth, navegación, raids, media, modales, partículas
 */

'use strict';

// ─── Estado global ────────────────────────────────────────────────────────────
let currentUser = null;

// ═══════════════════════════════════════════════════════════════════════════════
// INICIALIZACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  generateParticles();
  setupDragAndDrop();
  await checkSession();
});

/** Genera partículas flotantes en el login */
function generateParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      animation-duration: ${6 + Math.random() * 10}s;
      animation-delay: ${Math.random() * 8}s;
      --drift: ${(Math.random() - 0.5) * 100}px;
      opacity: 0;
      width: ${2 + Math.random() * 3}px;
      height: ${2 + Math.random() * 3}px;
    `;
    container.appendChild(p);
  }
}

/** Comprueba si hay sesión activa al cargar */
async function checkSession() {
  try {
    const res  = await fetch('/api/me');
    const data = await res.json();
    if (data.loggedIn) {
      currentUser = data.user;
      enterMain();
    }
  } catch (e) {
    console.error('Error comprobando sesión:', e);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN ENTRE PANTALLAS
// ═══════════════════════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  const screen = document.getElementById(id);
  screen.style.display = id === 'main-screen' ? 'flex' : 'flex';
  requestAnimationFrame(() => screen.classList.add('active'));
}

function enterMain() {
  document.getElementById('nav-username').textContent = `⚔ ${currentUser.username}`;
  showScreen('main-screen');
  showSection('inicio');
  loadFeed();
}

/** Cambia entre secciones del main */
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(a => a.classList.remove('active'));
  document.getElementById(`section-${name}`).classList.add('active');
  const link = document.querySelector(`[data-section="${name}"]`);
  if (link) link.classList.add('active');
  // Cerrar menú móvil
  document.querySelector('.nav-links').classList.remove('open');

  // Cargar datos de la sección
  if (name === 'inicio') loadFeed();
  if (name === 'raids')  loadRaids();
  if (name === 'clips')  loadMedia();
  return false;
}

function toggleMenu() {
  document.querySelector('.nav-links').classList.toggle('open');
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH — FORMULARIOS
// ═══════════════════════════════════════════════════════════════════════════════
function showForm(id) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  clearErrors();
}

function clearErrors() {
  document.querySelectorAll('.error-msg').forEach(e => e.textContent = '');
}

/** LOGIN */
async function doLogin() {
  const username = document.getElementById('login-user').value.trim();
  const password = document.getElementById('login-pass').value;
  const errEl    = document.getElementById('login-error');
  errEl.textContent = '';

  if (!username || !password) { errEl.textContent = '⚠ Rellena todos los campos.'; return; }

  try {
    const res  = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = '⚠ ' + data.error; return; }
    currentUser = { username: data.username };
    enterMain();
  } catch (e) {
    errEl.textContent = '⚠ Error de conexión.';
  }
}

/** REGISTRO */
async function doRegister() {
  const username = document.getElementById('reg-user').value.trim();
  const password = document.getElementById('reg-pass').value;
  const pass2    = document.getElementById('reg-pass2').value;
  const errEl    = document.getElementById('reg-error');
  errEl.textContent = '';

  if (!username || !password) { errEl.textContent = '⚠ Rellena todos los campos.'; return; }
  if (password !== pass2)     { errEl.textContent = '⚠ Las contraseñas no coinciden.'; return; }
  if (password.length < 4)   { errEl.textContent = '⚠ La contraseña debe tener al menos 4 caracteres.'; return; }

  try {
    const res  = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = '⚠ ' + data.error; return; }
    toast('✅ ¡Personaje creado! Inicia sesión.', 'success');
    showForm('form-login');
  } catch (e) {
    errEl.textContent = '⚠ Error de conexión.';
  }
}

/** RECUPERAR CONTRASEÑA */
async function doRecover() {
  const username    = document.getElementById('rec-user').value.trim();
  const newPassword = document.getElementById('rec-pass').value;
  const pass2       = document.getElementById('rec-pass2').value;
  const errEl       = document.getElementById('rec-error');
  errEl.textContent = '';

  if (!username || !newPassword) { errEl.textContent = '⚠ Rellena todos los campos.'; return; }
  if (newPassword !== pass2)     { errEl.textContent = '⚠ Las contraseñas no coinciden.'; return; }

  try {
    const res  = await fetch('/api/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, newPassword })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = '⚠ ' + data.error; return; }
    toast('✅ Contraseña actualizada. Inicia sesión.', 'success');
    showForm('form-login');
  } catch (e) {
    errEl.textContent = '⚠ Error de conexión.';
  }
}

/** LOGOUT */
async function doLogout() {
  await fetch('/api/logout', { method: 'POST' });
  currentUser = null;
  showScreen('login-screen');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FEED (INICIO)
// ═══════════════════════════════════════════════════════════════════════════════
async function loadFeed() {
  const container = document.getElementById('feed-container');
  container.innerHTML = '<div class="feed-empty">⏳ Invocando artefactos...</div>';
  try {
    const res   = await fetch('/api/media');
    if (!res.ok) throw new Error();
    const items = await res.json();
    if (!items.length) {
      container.innerHTML = '<div class="feed-empty">🕸️ Aún no hay artefactos en la ciudadela. ¡Sé el primero en subir algo!</div>';
      return;
    }
    container.innerHTML = items.slice(0, 12).map(item => `
      <div class="feed-card" onclick="viewMedia(${JSON.stringify(item).replace(/"/g,'&quot;')})">
        ${item.type === 'video'
          ? `<video class="feed-thumb" src="${item.path}" muted></video>`
          : `<img src="${item.path}" alt="${item.caption || ''}" loading="lazy"/>`
        }
        <div class="feed-card-info">
          <div class="feed-card-user">⚔ ${item.username}</div>
          ${item.caption ? `<div class="feed-card-caption">${escHtml(item.caption)}</div>` : ''}
          <div class="feed-card-date">${formatDate(item.date)}</div>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = '<div class="feed-empty">⚠ Error al cargar el feed.</div>';
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAIDS
// ═══════════════════════════════════════════════════════════════════════════════
async function loadRaids() {
  const container = document.getElementById('raids-container');
  container.innerHTML = '<div class="feed-empty">⏳ Convocando raids...</div>';
  try {
    const res   = await fetch('/api/raids');
    const raids = await res.json();
    if (!raids.length) {
      container.innerHTML = '<div class="feed-empty">🛡 No hay raids. ¡Crea la primera!</div>';
      return;
    }
    container.innerHTML = raids.map(r => buildRaidCard(r)).join('');
  } catch {
    container.innerHTML = '<div class="feed-empty">⚠ Error al cargar raids.</div>';
  }
}

function buildRaidCard(r) {
  const isMember  = r.members.includes(currentUser.username);
  const isOwner   = r.createdBy === currentUser.username;
  const full      = r.members.length >= r.maxPlayers;
  const dateStr   = r.date ? new Date(r.date).toLocaleString('es-ES') : 'Sin fecha';

  return `
    <div class="raid-card" id="raid-${r.id}">
      <div class="raid-title">⚔ ${escHtml(r.title)}</div>
      ${r.description ? `<div class="raid-desc">${escHtml(r.description)}</div>` : ''}
      <div class="raid-meta">
        <span>📅 ${dateStr}</span>
        <span>👥 ${r.members.length}/${r.maxPlayers}</span>
      </div>
      <div class="raid-members">
        Creada por: <span style="color:var(--green-nec)">${escHtml(r.createdBy)}</span>
      </div>
      ${r.members.length ? `<div class="raid-members-list">Miembros: ${r.members.map(m => escHtml(m)).join(', ')}</div>` : ''}
      <div class="raid-actions">
        ${!isMember && !full ? `<button class="btn-raid join"  onclick="joinRaid(${r.id})">+ Apuntarse</button>` : ''}
        ${isMember           ? `<button class="btn-raid leave" onclick="leaveRaid(${r.id})">✕ Salir</button>` : ''}
        ${full && !isMember  ? `<span style="color:var(--text-dim);font-size:.8rem">🔒 Completa</span>` : ''}
        ${isOwner            ? `<button class="btn-raid edit"   onclick="openEditRaid(${r.id})">✏ Editar</button>` : ''}
        ${isOwner            ? `<button class="btn-raid delete" onclick="deleteRaid(${r.id})">🗑 Eliminar</button>` : ''}
      </div>
    </div>
  `;
}

async function createRaid() {
  const title      = document.getElementById('raid-title').value.trim();
  const desc       = document.getElementById('raid-desc').value.trim();
  const date       = document.getElementById('raid-date').value;
  const maxPlayers = document.getElementById('raid-max').value;
  const errEl      = document.getElementById('raid-error');
  errEl.textContent = '';

  if (!title) { errEl.textContent = '⚠ El nombre es obligatorio.'; return; }

  try {
    const res = await fetch('/api/raids', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, date, maxPlayers })
    });
    if (!res.ok) { const d = await res.json(); errEl.textContent = '⚠ ' + d.error; return; }
    closeModal('modal-create-raid');
    clearRaidForm();
    toast('✅ Raid creada con éxito.', 'success');
    loadRaids();
  } catch {
    errEl.textContent = '⚠ Error de conexión.';
  }
}

function clearRaidForm() {
  ['raid-title','raid-desc','raid-date','raid-max'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function openEditRaid(id) {
  fetch('/api/raids')
    .then(r => r.json())
    .then(raids => {
      const raid = raids.find(r => r.id === id);
      if (!raid) return;
      document.getElementById('edit-raid-id').value    = raid.id;
      document.getElementById('edit-raid-title').value = raid.title;
      document.getElementById('edit-raid-desc').value  = raid.description;
      document.getElementById('edit-raid-date').value  = raid.date || '';
      document.getElementById('edit-raid-max').value   = raid.maxPlayers;
      openModal('modal-edit-raid');
    });
}

async function saveEditRaid() {
  const id         = document.getElementById('edit-raid-id').value;
  const title      = document.getElementById('edit-raid-title').value.trim();
  const desc       = document.getElementById('edit-raid-desc').value.trim();
  const date       = document.getElementById('edit-raid-date').value;
  const maxPlayers = document.getElementById('edit-raid-max').value;
  const errEl      = document.getElementById('edit-raid-error');
  errEl.textContent = '';

  if (!title) { errEl.textContent = '⚠ El nombre es obligatorio.'; return; }

  try {
    const res = await fetch(`/api/raids/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description: desc, date, maxPlayers })
    });
    if (!res.ok) { const d = await res.json(); errEl.textContent = '⚠ ' + d.error; return; }
    closeModal('modal-edit-raid');
    toast('✅ Raid actualizada.', 'success');
    loadRaids();
  } catch {
    errEl.textContent = '⚠ Error de conexión.';
  }
}

async function joinRaid(id) {
  try {
    const res = await fetch(`/api/raids/${id}/join`, { method: 'POST' });
    const d   = await res.json();
    if (!res.ok) { toast('⚠ ' + d.error, 'error'); return; }
    toast('⚔ ¡Te has apuntado a la raid!', 'success');
    loadRaids();
  } catch { toast('⚠ Error de conexión.', 'error'); }
}

async function leaveRaid(id) {
  try {
    await fetch(`/api/raids/${id}/leave`, { method: 'POST' });
    toast('👋 Has abandonado la raid.', 'success');
    loadRaids();
  } catch { toast('⚠ Error de conexión.', 'error'); }
}

async function deleteRaid(id) {
  if (!confirm('¿Seguro que quieres eliminar esta raid?')) return;
  try {
    const res = await fetch(`/api/raids/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast('⚠ Sin permiso para eliminar.', 'error'); return; }
    toast('🗑 Raid eliminada.', 'success');
    loadRaids();
  } catch { toast('⚠ Error de conexión.', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEDIA / CLIPS
// ═══════════════════════════════════════════════════════════════════════════════
async function loadMedia() {
  const container = document.getElementById('media-container');
  container.innerHTML = '<div class="feed-empty">⏳ Invocando artefactos...</div>';
  try {
    const res   = await fetch('/api/media');
    const items = await res.json();
    if (!items.length) {
      container.innerHTML = '<div class="feed-empty">🎬 Aún no hay clips. ¡Sube el primero!</div>';
      return;
    }
    container.innerHTML = items.map(item => buildMediaCard(item)).join('');
  } catch {
    container.innerHTML = '<div class="feed-empty">⚠ Error al cargar media.</div>';
  }
}

function buildMediaCard(item) {
  const isOwner = item.username === currentUser.username;
  const media   = item.type === 'video'
    ? `<video class="media-thumb-video" src="${item.path}" muted preload="metadata"></video>`
    : `<img class="media-thumb" src="${item.path}" alt="${escHtml(item.caption || '')}" loading="lazy"/>`;
  const icon = item.type === 'video' ? '▶' : '🔍';
  return `
    <div class="media-card">
      <div style="position:relative">
        ${media}
        <div class="media-overlay" onclick='viewMedia(${JSON.stringify(item).replace(/'/g,"&#39;")})'>${icon}</div>
      </div>
      <div class="media-info">
        <div class="media-info-left">
          <div class="media-username">⚔ ${escHtml(item.username)}</div>
          ${item.caption ? `<div class="media-caption">${escHtml(item.caption)}</div>` : ''}
          <div class="media-date">${formatDate(item.date)}</div>
        </div>
        ${isOwner ? `<button class="btn-delete-media" onclick="deleteMedia(${item.id})" title="Eliminar">🗑</button>` : ''}
      </div>
    </div>
  `;
}

function viewMedia(item) {
  const contentEl = document.getElementById('view-media-content');
  const captionEl = document.getElementById('view-media-caption');
  const userEl    = document.getElementById('view-media-user');
  contentEl.innerHTML = item.type === 'video'
    ? `<video src="${item.path}" controls autoplay style="width:100%;max-height:65vh;border-radius:4px"></video>`
    : `<img src="${item.path}" alt="${escHtml(item.caption||'')}" style="width:100%;max-height:65vh;object-fit:contain;border-radius:4px"/>`;
  captionEl.textContent = item.caption || '';
  userEl.textContent    = `⚔ ${item.username} · ${formatDate(item.date)}`;
  openModal('modal-view-media');
}

function previewFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const preview = document.getElementById('file-preview');
  const url     = URL.createObjectURL(file);
  if (file.type.startsWith('video/')) {
    preview.innerHTML = `<video src="${url}" controls style="width:100%;max-height:200px;margin-top:.5rem"></video>`;
  } else {
    preview.innerHTML = `<img src="${url}" style="width:100%;max-height:200px;object-fit:contain;margin-top:.5rem"/>`;
  }
}

async function uploadMedia() {
  const fileInput = document.getElementById('file-input');
  const caption   = document.getElementById('media-caption').value.trim();
  const errEl     = document.getElementById('upload-error');
  const progress  = document.getElementById('upload-progress');
  errEl.textContent = '';

  if (!fileInput.files.length) { errEl.textContent = '⚠ Selecciona un archivo.'; return; }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);
  formData.append('caption', caption);

  progress.style.display = 'block';
  try {
    const res  = await fetch('/api/media/upload', { method: 'POST', body: formData });
    const data = await res.json();
    progress.style.display = 'none';
    if (!res.ok) { errEl.textContent = '⚠ ' + data.error; return; }
    closeModal('modal-upload');
    resetUploadForm();
    toast('✅ Artefacto subido con éxito.', 'success');
    loadMedia();
    loadFeed();
  } catch {
    progress.style.display = 'none';
    errEl.textContent = '⚠ Error al subir el archivo.';
  }
}

function resetUploadForm() {
  document.getElementById('file-input').value   = '';
  document.getElementById('file-preview').innerHTML = '';
  document.getElementById('media-caption').value = '';
  document.getElementById('upload-error').textContent = '';
}

async function deleteMedia(id) {
  if (!confirm('¿Eliminar este artefacto?')) return;
  try {
    const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
    if (!res.ok) { toast('⚠ Sin permiso.', 'error'); return; }
    toast('🗑 Artefacto eliminado.', 'success');
    loadMedia();
    loadFeed();
  } catch { toast('⚠ Error de conexión.', 'error'); }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRAG & DROP PARA SUBIDA
// ═══════════════════════════════════════════════════════════════════════════════
function setupDragAndDrop() {
  const area = document.getElementById('upload-area');
  if (!area) return;

  area.addEventListener('dragover', e => {
    e.preventDefault();
    area.classList.add('drag-over');
  });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('file-input');
      const dt    = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      previewFile({ target: input });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODALES
// ═══════════════════════════════════════════════════════════════════════════════
function openModal(id) {
  document.getElementById(id).classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
  document.body.style.overflow = '';
  // Detener vídeos si hay alguno abierto
  const vid = document.querySelector(`#${id} video`);
  if (vid) { vid.pause(); vid.src = ''; }
}

function closeModalOutside(event, id) {
  if (event.target.id === id) closeModal(id);
}

// Cerrar modales con Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════════════════
let toastTimeout;
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent   = msg;
  el.className     = `toast ${type} show`;
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('show'), 3200);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' });
}
