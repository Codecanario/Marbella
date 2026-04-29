# 🚂 GUÍA COMPLETA — Subir Naxxramas Forum a Railway
## (Hosting Node.js gratis 24/7)

---

## ¿Qué es Railway?
Railway es una plataforma de hosting que soporta Node.js directamente.
Plan gratuito: $5 de crédito al mes (~500 horas). Para una web pequeña
con pocos usuarios, es prácticamente gratis todo el mes.

---

## PASO 1 — Crear cuenta en GitHub (si no tienes)

1. Ve a https://github.com
2. Haz clic en "Sign up"
3. Crea tu cuenta (es gratis)
4. Verifica tu email

---

## PASO 2 — Subir el proyecto a GitHub

### 2.1 Instala Git en tu PC
- Windows: https://git-scm.com/download/win
  → Descarga e instala con todas las opciones por defecto

### 2.2 Abre una terminal en la carpeta del proyecto
- En Windows: haz clic derecho dentro de la carpeta "project" → "Git Bash Here"
  (o abre CMD/PowerShell y navega con: cd C:\ruta\a\tu\project)

### 2.3 Ejecuta estos comandos uno a uno:

```bash
git init
git add .
git commit -m "Naxxramas Forum - primera versión"
```

### 2.4 Crea el repositorio en GitHub
1. Ve a https://github.com/new
2. En "Repository name" escribe: naxxramas-forum
3. Déjalo en "Public" (o Private, da igual)
4. NO marques ningún checkbox adicional
5. Haz clic en "Create repository"

### 2.5 Conecta tu carpeta con GitHub
GitHub te mostrará comandos. Ejecuta estos en tu terminal
(cambia TU_USUARIO por tu nombre de usuario de GitHub):

```bash
git remote add origin https://github.com/TU_USUARIO/naxxramas-forum.git
git branch -M main
git push -u origin main
```

Te pedirá tu usuario y contraseña de GitHub.
⚠️ Si pide "token" en vez de contraseña:
- Ve a GitHub → Settings → Developer settings → Personal access tokens → Generate new token
- Marca el permiso "repo" → Generate → copia ese token y úsalo como contraseña

---

## PASO 3 — Crear cuenta en Railway

1. Ve a https://railway.app
2. Haz clic en "Start a New Project" o "Login"
3. Elige "Login with GitHub" → autoriza Railway

---

## PASO 4 — Desplegar el proyecto en Railway

### 4.1 Crear nuevo proyecto
1. En el dashboard de Railway, haz clic en "New Project"
2. Selecciona "Deploy from GitHub repo"
3. Si es la primera vez, haz clic en "Configure GitHub App" para dar permisos
4. Busca y selecciona tu repositorio "naxxramas-forum"

### 4.2 Configurar el despliegue
Railway detectará automáticamente que es Node.js.
Verás que empieza a construir el proyecto automáticamente.

### 4.3 Añadir variable de entorno (importante)
Railway asigna un puerto dinámico. Ya está preparado en server.js, pero
necesitas decirle a Railway qué comando usar:

1. En tu proyecto Railway, haz clic en el servicio creado
2. Ve a la pestaña "Settings"
3. Busca "Start Command" y escribe:
   ```
   node server.js
   ```
4. En la pestaña "Variables", añade:
   - Variable: NODE_ENV
   - Valor: production

### 4.4 Generar tu URL pública
1. Ve a la pestaña "Settings" del servicio
2. Busca la sección "Networking" → "Generate Domain"
3. Haz clic en "Generate Domain"
4. Railway te dará una URL tipo:
   https://naxxramas-forum-production.up.railway.app

¡Ya está online!

---

## PASO 5 — Subir la imagen de fondo

La imagen de fondo (/public/assets/background.jpg) la tienes que añadir
al repositorio de GitHub:

1. Copia tu imagen a la carpeta: project/public/assets/background.jpg
2. Ejecuta en la terminal:
```bash
git add .
git commit -m "Añadir imagen de fondo"
git push
```
3. Railway detectará el cambio y redespliegará automáticamente en ~1 minuto

---

## DATOS IMPORTANTES

### Persistencia de datos
⚠️ Railway en el plan gratuito NO garantiza persistencia del disco.
Esto significa que los archivos JSON (usuarios, raids, media) y las
imágenes subidas en /uploads pueden borrarse cuando el servicio se reinicia.

Para producción real, considera:
- Railway + volumen de almacenamiento (plan de pago)
- O migrar los datos a una base de datos gratuita como PlanetScale o MongoDB Atlas

Para uso personal/comunidad pequeña el plan gratuito funciona bien.

### Actualizar la web
Cada vez que hagas cambios en el código:
```bash
git add .
git commit -m "descripción del cambio"
git push
```
Railway redespliegua automáticamente en ~1 minuto.

---

## RESUMEN DE COMANDOS GIT

```bash
# Primera vez (configurar)
git init
git add .
git commit -m "primer commit"
git remote add origin https://github.com/TU_USUARIO/naxxramas-forum.git
git branch -M main
git push -u origin main

# Siguientes veces (actualizar)
git add .
git commit -m "descripción del cambio"
git push
```

---

*¡Que Naxxramas esté siempre online, aventurero!* ☠️
