# 🕸️ NAXXRAMAS FORUM — WoW Classic Style

Foro web completo inspirado en World of Warcraft Classic con estética Naxxramas.

---

## 🚀 INSTALACIÓN Y EJECUCIÓN

### Requisitos
- Node.js 16+ instalado en tu sistema
- Conexión a internet (para fuentes de Google Fonts)

### Pasos

```bash
# 1. Entra en la carpeta del proyecto
cd project

# 2. Instala las dependencias
npm install

# 3. Arranca el servidor
node server.js

# 4. Abre el navegador en:
# http://localhost:3000
```

---

## 📁 ESTRUCTURA

```
/project
 ├── /public
 │    ├── /assets
 │    │     └── background.jpg   ← PON AQUÍ TU IMAGEN DE FONDO
 │    ├── /css
 │    │     └── style.css
 │    ├── /js
 │    │     └── app.js
 │    └── index.html
 │
 ├── /data
 │    ├── users.json             ← usuarios registrados
 │    ├── raids.json             ← raids creadas
 │    ├── posts.json             ← reservado para posts
 │    └── media.json             ← metadata de clips/imágenes
 │
 ├── /uploads                   ← archivos subidos por usuarios
 ├── server.js                  ← backend Express
 └── package.json
```

---

## 🖼️ IMAGEN DE FONDO

Coloca tu imagen de fondo en:
```
/public/assets/background.jpg
```

Recomendaciones:
- Imagen oscura, tipo Naxxramas/Undercity
- Resolución mínima: 1920x1080
- Formatos: JPG, PNG, WEBP

Si no hay imagen, el fondo oscuro CSS funciona igualmente.

---

## ⚙️ FUNCIONALIDADES

| Sección      | Descripción |
|--------------|-------------|
| 🔐 Login     | Registro, login, recuperación de contraseña por nick |
| 🏠 Inicio    | Feed con últimos clips/imágenes subidas |
| ⚔ Raids     | Crear, editar, eliminar raids + apuntarse/salir |
| 🎬 Clips     | Subir imágenes/vídeos, galería, eliminar propios |
| 💎 Sub       | Planes de suscripción (UI solamente) |
| 📩 Contacto  | Botón mailto directo |

---

## 🔒 SEGURIDAD BÁSICA

- Sesiones con express-session (cookie 24h)
- Rutas protegidas con middleware `requireAuth`
- Validación en frontend y backend
- Sin acceso al contenido sin login

---

## 📦 DEPENDENCIAS

```json
{
  "express": "^4.18.2",
  "express-session": "^1.17.3",
  "multer": "^1.4.5-lts.1"
}
```

---

## 🛠️ PERSONALIZACIÓN

- Cambia el puerto en `server.js` → variable `PORT`
- Cambia el email de contacto en `index.html`
- Ajusta colores en `public/css/style.css` (variables CSS arriba del archivo)

---

*¡Que el poder de Naxxramas te acompañe, aventurero!* ☠️
