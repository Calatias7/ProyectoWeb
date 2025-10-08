# SIGLAD — Sistema Integrado de Gestión Logística Aduanera y Declaraciones

**SIGLAD** es una plataforma web integral para la **gestión, validación y control de declaraciones aduaneras electrónicas (DUCA)**.  
Incluye autenticación por roles, bitácoras automáticas y manejo de catálogos (aduanas, países, importadores) conectados a **PostgreSQL**.  
Permite registrar, enviar, revisar, aprobar o rechazar declaraciones de transporte regional bajo el esquema **DUCA Centroamérica**.

---

## Estructura del proyecto

```
siglad_proyecto/
├── backend/              # API Node.js + Express + PostgreSQL
│   ├── routes/           # auth, users, duca, catalogos
│   ├── middleware/       # requireAuth, requireRole, requireAnyRole
│   ├── scripts/          # seed-admin.js
│   ├── db.js             # Configuración Pool PostgreSQL
│   ├── server.js         # Servidor principal Express
│   ├── package.json
│   └── .env.example
│
├── frontend/             # Interfaz React + Vite
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── Panel.jsx
│   │   ├── UsersAdmin.jsx
│   │   ├── DucaRecepcion.jsx
│   │   ├── ConsultaEstados.jsx
│   │   └── ValidacionAgente.jsx
│   ├── package.json
│   └── vite.config.js
│
└── database/
    └── script.sql        # Esquema completo PostgreSQL
```

---

## Funcionalidades principales

|Rol|Funcionalidades|Descripción|
|---|---|---|
|**Administrador**|Gestión de usuarios (crear, activar/inactivar, eliminar)|Administra todos los roles y puede ver todas las declaraciones.|
|**Transportista**|Registro y envío de DUCA|Registra DUCA con importador, transporte, mercancías y moneda. Al enviarla, se guarda automáticamente y puede consultarla después.|
|**Agente Aduanero**|🧾 Validación y control|Consulta declaraciones pendientes, revisa datos completos (detecta campos faltantes) y puede **Aprobar** o **Rechazar** (con motivo obligatorio).|
|**Importador**|Catálogo disponible|Puede ser seleccionado desde el registro de DUCA; no tiene panel propio en esta versión.|

---

## Arquitectura general

- **Backend:** Node.js + Express
    
- **Base de datos:** PostgreSQL (con JSONB y triggers de bitácora)
    
- **Frontend:** React + Vite + Fetch API
    
- **Autenticación:** JWT + bcryptjs
    
- **Despliegue:** Render (backend + PostgreSQL)
    
- **Arquitectura:** Clean Architecture + MVC
    

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/Calatias7/ProyectoWeb.git
cd ProyectoWeb
```

### 2. Configurar backend

```bash
cd backend
cp .env.example .env
```

Edita `.env` con tus datos:

```
DATABASE_URL=postgres://usuario:clave@host:5432/base
DB_SSL=true
JWT_SECRET=clave-super-secreta
PORT=3000

ADMIN_EMAIL=admin@siglad.com
ADMIN_NAME=Admin Principal
ADMIN_PASS=Admin123
```

Instala dependencias:

```bash
npm install
```

Crea el usuario administrador:

```bash
npm run seed:admin
```

Ejecuta el servidor:

```bash
npm run dev
```

---

### 3. Configurar frontend

```bash
cd ../frontend
npm install
npm run dev
```

Abrir en el navegador:  
[http://localhost:5173](http://localhost:5173/)

---

## Roles y credenciales

|Rol|Usuario|Contraseña|Descripción|
|---|---|---|---|
|**Administrador**|`admin@siglad.com`|`Admin123`|Acceso completo|
|**Transportista**|Crear desde admin|—|Registra DUCA|
|**Agente Aduanero**|Crear desde admin|—|Valida o rechaza DUCA|
|**Importador**|Crear desde admin|—|Solo catálogo (selector)|

---

## Estructura de base de datos (resumen)

Tablas principales incluidas en `database/script.sql`:

| Tabla               | Descripción                            |
| ------------------- | -------------------------------------- |
| `users`             | Usuarios del sistema con roles         |
| `declaraciones`     | DUCA completas (JSONB + timestamps)    |
| `bitacora_usuarios` | Registro de accesos (login)            |
| `bitacora_duca`     | Historial de acciones en declaraciones |
| `aduanas`           | Catálogo de aduanas                    |
| `paises`            | Catálogo de países (Centroamérica)     |

Incluye:

- Índices por `estado`, `user_id` y `numero_documento`
    
- Trigger `trg_bitacora_duca` → inserta log automático al cambiar estado
    
- Script inicial con aduanas y países base
    

---

## Validaciones y lógica DUCA

### Registro de DUCA (Transportista)

- Importador se selecciona desde `/api/users/importadores`
    
- Aduanas desde `/api/catalogos/aduanas`
    
- Países desde catálogo base (solo Centroamérica)
    
- Moneda con conversión automática a GTQ, USD, EUR o HNL
    
- Valores calculados en tiempo real (valor unitario × cantidad)
    

### Consulta de Estados

- Filtrado por `Todos`, `Pendiente`, `Validada`, `Rechazada`
    
- Muestra:
    
    - Número de documento
        
    - Estado
        
    - Fecha de creación
        
    - Fecha de revisión
        
- En el detalle:
    
    - Toda la información enviada (importador, transporte, mercancías, valores)
        
    - **Motivo de rechazo** si aplica
        
    - Aviso de **datos faltantes** (validación automática)
        

### Validación (Agente Aduanero)

- Lista de pendientes `/api/duca/pendientes`
    
- Vista detallada con:
    
    - Fechas (`creada`, `revisada`)
        
    - Campos faltantes destacados
        
- Botones:
    
    - **Aprobar** → cambia estado a `VALIDADA`
        
    -  **Rechazar** → requiere texto de motivo (`motivo_rechazo`)
        

---

## 🔗 Endpoints API principales

|Método|Endpoint|Rol|Descripción|
|---|---|---|---|
|`POST`|`/api/auth/login`|Todos|Inicia sesión (JWT)|
|`GET`|`/api/users`|Admin|Lista usuarios|
|`POST`|`/api/users`|Admin|Crea usuario|
|`PUT`|`/api/users/:id/activo`|Admin|Activar/desactivar|
|`DELETE`|`/api/users/:id`|Admin|Eliminar usuario|
|`GET`|`/api/users/importadores`|Admin, Agente, Transportista|Lista de importadores activos|
|`GET`|`/api/catalogos/aduanas`|Todos con token|Lista de aduanas|
|`POST`|`/api/duca/enviar`|Transportista|Envía DUCA|
|`GET`|`/api/duca/consulta`|Todos|Lista de declaraciones|
|`GET`|`/api/duca/detalle/:numero`|Todos|Detalle completo|
|`POST`|`/api/duca/aprobar/:numero`|Agente|Aprueba DUCA|
|`POST`|`/api/duca/rechazar/:numero`|Agente|Rechaza DUCA con motivo|

---

## Variables de entorno clave (backend)

```env
DATABASE_URL=postgres://usuario:clave@host:5432/basedatos
DB_SSL=true
JWT_SECRET=supersecreto
PORT=3000

ADMIN_EMAIL=admin@siglad.com
ADMIN_NAME=Admin Principal
ADMIN_PASS=Admin123
```

---

## Despliegue en Render

1. Crear **Render Web Service** apuntando a `/backend/`
    
    - Runtime: Node
        
    - Build: `npm install`
        
    - Start: `npm start`
        
    - Variables:
        
        - `DATABASE_URL`
            
        - `JWT_SECRET`
            
        - `DB_SSL=true`
            
2. Crear **PostgreSQL instance** y ejecutar `database/script.sql`.
    
3. Ejecutar seed:
    
    ```bash
    npm run seed:admin
    ```
    
4. Frontend:
    
    - Subir a Render (Static Site) o Vercel
        
    - Build: `npm run build`
        
    - Output dir: `/dist`
        

---

## Estado actual

- ✅ Backend con JWT y bitácoras activas
    
- ✅ Validaciones completas en transportista y agente
    
- ✅ Motivo de rechazo y fechas formateadas
    
- ✅ Catálogos dinámicos (aduanas, países, importadores)
    
- ✅ Conversión de moneda automática
    
- ✅ Logs automáticos (trigger PostgreSQL)
    
- 🚧 Próximas mejoras: reportes PDF/XLSX, panel administrativo con gráficos y auditoría avanzada
    

---

## Autor

Desarrollado por **Víctor**  Mendez
Proyecto académico / técnico con fines de aprendizaje y despliegue real.  
Basado en principios de **Clean Architecture** y **MVC asíncrono** con PostgreSQL + Node + React.

##  Licencia

MIT © 2025 — Puedes usar, modificar y mejorar este sistema libremente.
