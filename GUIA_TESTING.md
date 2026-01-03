# 🚀 Guía para Visualizar Frontend y Testear Conexión Backend-Frontend

## 📋 Opciones Disponibles

### **Opción 1: Desarrollo Local (Recomendado para Testing)**

#### Prerrequisitos
- Node.js y npm instalados
- Python 3.11+ instalado
- MongoDB (opcional, la app funciona sin él)
- Redis (opcional, la app funciona sin cache)

#### Pasos:

**1. Iniciar el Backend:**

```bash
# Terminal 1 - Backend
cd backend

# Crear y activar entorno virtual (si no existe)
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

# Instalar dependencias (si es la primera vez)
pip install -r requirements.txt

# Ejecutar el servidor
python run.py
```

El backend estará disponible en: **http://localhost:8000**

**2. Iniciar el Frontend:**

```bash
# Terminal 2 - Frontend (en la raíz del proyecto)
npm install  # Solo la primera vez
npm run dev
```

El frontend estará disponible en: **http://localhost:8080** (puerto configurado en vite.config.ts)

**3. Configurar variables de entorno del Frontend:**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

**4. Verificar la conexión:**

- Abre el navegador en: http://localhost:8080
- Abre las DevTools (F12) y ve a la pestaña "Network"
- Realiza acciones en la app que llamen al backend
- Verifica que las peticiones se envíen a `http://localhost:8000/api/v1/...`

---

### **Opción 2: Docker Compose (Todo en uno)**

#### Pasos:

```bash
# Desde la raíz del proyecto
docker-compose up --build
```

Esto iniciará:
- Backend en: http://localhost:8000
- Frontend en: http://localhost:8080 (según vite.config.ts)
- MongoDB en: localhost:27017
- Redis en: localhost:6379

**Nota:** El frontend está configurado para usar el puerto 8080 según `vite.config.ts`

---

### **Opción 3: Backend con Docker, Frontend Local**

Útil cuando quieres cambios rápidos en el frontend sin reconstruir contenedores.

#### Pasos:

**1. Iniciar Backend con Docker:**

```bash
cd backend
docker-compose up
```

**2. Iniciar Frontend localmente:**

```bash
# En la raíz del proyecto
npm run dev
```

**3. Configurar .env del frontend:**

```env
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK_DATA=false
```

---

### **Opción 4: Modo Mock (Sin Backend)**

Útil para desarrollo del frontend sin necesidad del backend.

#### Pasos:

**1. Solo iniciar el Frontend:**

```bash
npm run dev
```

**2. Configurar .env para usar mock data:**

```env
VITE_USE_MOCK_DATA=true
# VITE_API_URL no es necesario en modo mock
```

---

## 🧪 Testing de la Conexión

### **1. Health Check del Backend**

Abre en el navegador o usa curl:

```bash
# Verificar que el backend está corriendo
curl http://localhost:8000/health

# Respuesta esperada:
# {"status": "healthy"}
```

O abre en el navegador: http://localhost:8000/health

### **2. Documentación Interactiva del Backend**

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

Desde aquí puedes probar todos los endpoints directamente.

### **3. Verificar desde el Navegador (DevTools)**

1. Abre http://localhost:8080 en el navegador
2. Abre DevTools (F12)
3. Ve a la pestaña **Network**
4. Filtra por **Fetch/XHR**
5. Realiza acciones en la app (buscar noticias, análisis, etc.)
6. Verifica que las peticiones:
   - Se envíen a `http://localhost:8000/api/v1/...`
   - Tengan status 200 (éxito) o el código apropiado
   - Devuelvan datos en formato JSON

### **4. Test con cURL (Línea de comandos)**

```bash
# Test endpoint de noticias
curl http://localhost:8000/api/v1/news/

# Test health check
curl http://localhost:8000/health

# Test análisis (ejemplo con EUR/USD)
curl http://localhost:8000/api/v1/analysis/full/EUR%2FUSD
```

### **5. Test desde el Frontend (Console del Navegador)**

Abre la consola del navegador (F12 > Console) y ejecuta:

```javascript
// Test básico de conexión
fetch('http://localhost:8000/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend conectado:', data))
  .catch(err => console.error('❌ Error de conexión:', err));

// Test endpoint de noticias
fetch('http://localhost:8000/api/v1/news/')
  .then(res => res.json())
  .then(data => console.log('✅ Noticias:', data))
  .catch(err => console.error('❌ Error:', err));
```

---

## 🔍 Solución de Problemas

### **Error: CORS**

Si ves errores de CORS en la consola:

1. Verifica que el backend esté corriendo en `localhost:8000`
2. Verifica que `CORS_ORIGINS` en el backend incluya `http://localhost:8080` (o el puerto que estés usando)
3. Reinicia el backend después de cambiar la configuración

### **Error: Connection Refused**

- Verifica que el backend esté corriendo: `curl http://localhost:8000/health`
- Verifica el puerto correcto en `VITE_API_URL`
- Verifica que no haya otro proceso usando el puerto 8000

### **Error: 404 Not Found**

- Verifica que la URL del endpoint sea correcta
- Consulta la documentación en http://localhost:8000/docs
- Verifica que el router esté incluido en `main.py`

### **El Frontend muestra datos mock en lugar de datos reales**

1. Verifica el archivo `.env` en la raíz del proyecto
2. Asegúrate de que `VITE_USE_MOCK_DATA=false`
3. Reinicia el servidor de desarrollo: `npm run dev`

### **Puerto ya en uso**

```bash
# Windows - Ver qué proceso usa el puerto 8000
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000

# Luego mata el proceso o cambia el puerto en la configuración
```

---

## 📝 Checklist de Verificación

- [ ] Backend corriendo en http://localhost:8000
- [ ] Frontend corriendo en http://localhost:8080
- [ ] Archivo `.env` configurado con `VITE_API_URL=http://localhost:8000`
- [ ] `VITE_USE_MOCK_DATA=false` en `.env`
- [ ] Health check del backend responde: `curl http://localhost:8000/health`
- [ ] DevTools muestra peticiones a `localhost:8000` en la pestaña Network
- [ ] No hay errores de CORS en la consola
- [ ] Los datos se cargan correctamente en la aplicación

---

## 🎯 Endpoints Principales para Testing

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/v1/news/` | GET | Listar noticias |
| `/api/v1/news/{id}` | GET | Obtener noticia por ID |
| `/api/v1/analysis/full/{symbol}` | GET | Análisis completo (ej: EUR/USD) |
| `/docs` | GET | Documentación Swagger |

---

## 💡 Tips Adicionales

1. **Usa Postman o Insomnia** para probar endpoints del backend independientemente del frontend

2. **Logs del Backend:** Observa la terminal donde corre el backend para ver las peticiones entrantes

3. **React Query DevTools:** Si la app usa React Query, instala las devtools para ver el estado de las queries

4. **Network Throttling:** En DevTools > Network, usa throttling para simular conexiones lentas y ver cómo se comporta la app

