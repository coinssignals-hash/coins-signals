# 📦 Guía para Subir el Proyecto a Git

## ✅ Paso 1: Repositorio Inicializado

El repositorio Git ya está inicializado. Ahora sigue estos pasos:

---

## 📝 Paso 2: Agregar Archivos al Repositorio

```bash
# Agregar todos los archivos
git add .

# O agregar archivos específicos
git add *.md
git add src/
git add backend/
```

---

## 💾 Paso 3: Hacer el Primer Commit

```bash
git commit -m "Initial commit: Market Pulse AI project"
```

---

## 🔗 Paso 4: Crear Repositorio en GitHub/GitLab/Bitbucket

### Opción A: GitHub (Recomendado)

1. Ve a https://github.com/new
2. Crea un nuevo repositorio (público o privado)
3. **NO inicialices con README, .gitignore o licencia** (ya los tienes)
4. Copia la URL del repositorio (ej: `https://github.com/tu-usuario/market-pulse-ai.git`)

### Opción B: GitLab

1. Ve a https://gitlab.com/projects/new
2. Crea un nuevo proyecto
3. Copia la URL del repositorio

---

## 🚀 Paso 5: Conectar con el Repositorio Remoto

```bash
# Agregar el repositorio remoto (reemplaza con tu URL)
git remote add origin https://github.com/tu-usuario/market-pulse-ai.git

# Verificar que se agregó correctamente
git remote -v
```

---

## 📤 Paso 6: Subir el Código

```bash
# Subir a la rama principal (main o master)
git branch -M main
git push -u origin main
```

**Nota:** Si tu repositorio usa `master` en lugar de `main`, cambia el comando:
```bash
git branch -M master
git push -u origin master
```

---

## 🔐 Si Necesitas Autenticación

### GitHub (Token Personal)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Cuando hagas `git push`, usa el token como contraseña

### SSH (Recomendado para uso frecuente)

```bash
# Generar clave SSH (si no tienes una)
ssh-keygen -t ed25519 -C "tu-email@ejemplo.com"

# Agregar clave SSH a GitHub
# Copia el contenido de ~/.ssh/id_ed25519.pub y agrégalo en:
# GitHub → Settings → SSH and GPG keys → New SSH key

# Usar URL SSH en lugar de HTTPS
git remote set-url origin git@github.com:tu-usuario/market-pulse-ai.git
```

---

## 📋 Comandos Útiles para el Futuro

```bash
# Ver estado de los archivos
git status

# Ver cambios específicos
git diff

# Agregar cambios
git add .
git add archivo-especifico.ts

# Hacer commit
git commit -m "Descripción de los cambios"

# Subir cambios
git push

# Actualizar desde el repositorio remoto
git pull

# Ver historial de commits
git log

# Crear una nueva rama
git checkout -b nombre-de-rama

# Cambiar de rama
git checkout nombre-de-rama

# Ver ramas
git branch
```

---

## 🛡️ Archivos que NO se Subirán (Gracias al .gitignore)

- `node_modules/` - Dependencias de Node.js
- `venv/` - Entorno virtual de Python
- `.env` - Variables de entorno (¡importante para seguridad!)
- `dist/` - Archivos compilados
- `__pycache__/` - Cache de Python
- `*.log` - Archivos de log
- Archivos del sistema operativo

---

## ⚠️ Importante: Variables de Entorno

**NUNCA subas archivos `.env` al repositorio**. Contienen información sensible como:
- API keys
- Contraseñas
- URLs de bases de datos

Si necesitas compartir la estructura de variables de entorno, crea un archivo `.env.example`:

```bash
# .env.example (este SÍ se puede subir)
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
OPENAI_API_KEY=tu-api-key-aqui
MONGODB_URL=mongodb://localhost:27017
REDIS_URL=redis://localhost:6379
```

---

## 🔄 Flujo de Trabajo Recomendado

1. **Hacer cambios en el código**
2. **Revisar cambios:** `git status` y `git diff`
3. **Agregar archivos:** `git add .`
4. **Hacer commit:** `git commit -m "Descripción clara"`
5. **Subir cambios:** `git push`

---

## ❓ Solución de Problemas

### Error: "remote origin already exists"
```bash
# Ver remotos actuales
git remote -v

# Eliminar remoto existente
git remote remove origin

# Agregar el nuevo remoto
git remote add origin https://github.com/tu-usuario/market-pulse-ai.git
```

### Error: "failed to push some refs"
```bash
# Actualizar desde el remoto primero
git pull origin main --allow-unrelated-histories

# Luego intentar push de nuevo
git push -u origin main
```

### Error de autenticación
- Verifica que tengas permisos en el repositorio
- Si usas HTTPS, usa un token personal en lugar de contraseña
- Si usas SSH, verifica que tu clave esté agregada a GitHub/GitLab

---

## 📚 Recursos Adicionales

- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com)
- [GitLab Docs](https://docs.gitlab.com)

