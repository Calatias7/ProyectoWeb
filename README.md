# SIGLAD — Sistema Integrado de Gestión Logística Aduanera y Declaraciones

**SIGLAD** es una plataforma web integral para la **gestión, validación y control de declaraciones aduaneras electrónicas (DUCA)** bajo el esquema regional centroamericano.  
El sistema implementa autenticación por roles, registro detallado de bitácoras automáticas y catálogos dinámicos de **aduanas, países e importadores**, todo conectado a **PostgreSQL**.

---

## Estructura del Proyecto

```
siglad_proyecto/
├── backend/              # API Node.js + Express + PostgreSQL
│   ├── routes/           # auth, users, duca, catalogos
│   ├── middleware/       # requireAuth, requireRole, requireAnyRole
│   ├── utils/            # bitacora.js
│   ├── scripts/          # seed-admin.js
│   ├── db.js             # Configuración del Pool PostgreSQL
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
    └── script.sql        # Esquema completo PostgreSQL (bitácoras, triggers y catálogos)
```

---

## Funcionalidades Principales

| Rol                 | Funcionalidades                                        | Descripción                                                                                                                                                     |
| ------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador**   | Gestión de usuarios (crear, editar, activar/inactivar) | Puede crear usuarios con distintos roles, editar información directamente desde la tabla y revisar todas las declaraciones.                                     |
| **Transportista**   | Registro y envío de DUCA                               | Crea y envía declaraciones con importador, transporte, mercancías y moneda. Al enviarla se genera automáticamente en base de datos y puede consultar su estado. |
| **Agente Aduanero** | Validación de declaraciones                            | Revisa las declaraciones pendientes, visualiza campos incompletos, y puede **Aprobar** o **Rechazar** con motivo obligatorio.                                   |
| **Importador**      | Catálogo de importadores                               | Puede ser seleccionado desde el formulario de DUCA; no tiene panel propio (rol de referencia).                                                                  |

---

## Arquitectura General

- **Backend:** Node.js + Express
    
- **Base de datos:** PostgreSQL (JSONB + triggers automáticos)
    
- **Frontend:** React + Vite + Axios
    
- **Autenticación:** JWT + bcryptjs
    
- **Bitácoras:** automáticas por función `logBitacora()` + trigger SQL
    
- **Despliegue:** Render (backend y PostgreSQL)
    
- **Arquitectura:** MVC + Clean Architecture asíncrona
    

---

## Instalación Local

### Clonar el repositorio

```bash
git clone https://github.com/Calatias7/ProyectoWeb.git
cd ProyectoWeb
```

### Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus datos de conexión:

```
DATABASE_URL=postgres://usuario:clave@host:5432/base
DB_SSL=true
JWT_SECRET=clave-super-secreta
PORT=3000

ADMIN_EMAIL=admin@siglad.com
ADMIN_NAME=Admin Principal
ADMIN_PASS=Admin123
```

Instalar dependencias y generar usuario administrador:

```bash
npm install
npm run seed:admin
```

Ejecutar el servidor:

```bash
npm run dev
```

### Configurar el frontend

```bash
cd ../frontend
npm install
npm run dev
```

Abrir en el navegador:  
[http://localhost:5173](http://localhost:5173/)

---

## Roles y Credenciales

|Rol|Usuario|Contraseña|Descripción|
|---|---|---|---|
|**Administrador**|[admin@siglad.com](mailto:admin@siglad.com)|Admin123|Acceso completo al sistema|
|**Transportista**|Crear desde Admin|—|Crea y envía DUCA|
|**Agente Aduanero**|Crear desde Admin|—|Valida o rechaza declaraciones|
|**Importador**|Crear desde Admin|—|Seleccionable desde DUCA|

---

## Estructura de Base de Datos

Incluida en: `database/script.sql`

|Tabla|Descripción|
|---|---|
|`users`|Usuarios del sistema con roles|
|`declaraciones`|Declaraciones DUCA (JSONB, timestamps, estados)|
|`bitacora_usuarios`|Acciones de login, CRUD, validaciones, aprobaciones|
|`bitacora_duca`|Historial de acciones sobre cada DUCA (trigger automático)|
|`aduanas`|Catálogo de aduanas de Centroamérica|
|`paises`|Catálogo de países (GT, HN, SV, CR, NI, PA)|

**Características clave:**

- Índices por `estado`, `user_id` y `numero_documento`.
    
- Trigger `trg_bitacora_duca` → inserta en bitácora cada cambio de estado.
    
- Datos iniciales de aduanas y países incluidos.
    

---

## Validaciones y Lógica DUCA

### Registro de DUCA (Transportista)

- Importadores desde `/api/users/importadores`
    
- Aduanas desde `/api/catalogos/aduanas`
    
- Países de catálogo base (solo Centroamérica)
    
- Moneda con conversión automática a GTQ, USD, EUR y HNL
    
- Cálculo automático de valores: `cantidad × valor unitario`
    

### Consulta de Estados

- Filtrado por estado: **Todos / Pendiente / Validada / Rechazada**
    
- Muestra:
    
    - Número de documento
        
    - Estado
        
    - Fecha de creación
        
    - Fecha de revisión
        
- En el detalle:
    
    - Toda la información enviada (importador, transporte, mercancías, valores)
        
    - Motivo de rechazo (si aplica)
        
    - Validación automática de campos faltantes
        

### Validación (Agente Aduanero)

- Lista de pendientes: `/api/duca/pendientes`
    
- Vistas detalladas con fechas (`creada`, `revisada`)
    
- Botones de acción:
    
    - **Aprobar** → cambia estado a `VALIDADA`
        
    - **Rechazar** → requiere texto de motivo obligatorio
        

---

## Endpoints Principales

|Método|Ruta|Rol|Descripción|
|---|---|---|---|
|**POST**|`/api/auth/login`|Todos|Iniciar sesión (JWT)|
|**GET**|`/api/users`|Administrador|Listar usuarios|
|**POST**|`/api/users`|Administrador|Crear usuario|
|**PUT**|`/api/users/:id`|Administrador|Editar usuario (en línea)|
|**PUT**|`/api/users/:id/activo`|Administrador|Activar / Inactivar usuario|
|**GET**|`/api/users/importadores`|Admin / Agente / Transportista|Listar importadores activos|
|**GET**|`/api/catalogos/aduanas`|Todos con token|Catálogo de aduanas|
|**POST**|`/api/duca/enviar`|Transportista|Registrar nueva DUCA|
|**GET**|`/api/duca/consulta`|Todos|Listado general|
|**GET**|`/api/duca/detalle/:numero`|Todos|Ver detalle completo|
|**POST**|`/api/duca/aprobar/:numero`|Agente Aduanero|Aprobar DUCA|
|**POST**|`/api/duca/rechazar/:numero`|Agente Aduanero|Rechazar con motivo obligatorio|

---

## Despliegue en Render

**Backend:**

- Crear servicio web apuntando a `/backend`
    
- Runtime: Node.js
    
- Comandos:
    
    ```bash
    npm install
    npm start
    ```
    
- Variables de entorno:
    
    ```
    DATABASE_URL=postgres://usuario:clave@host:5432/basedatos
    JWT_SECRET=supersecreto
    DB_SSL=true
    PORT=3000
    ```
    

**Base de datos:**

- Crear instancia PostgreSQL y ejecutar:
    
    ```bash
    psql "postgres://usuario:clave@host:5432/basedatos?sslmode=require" -f database/script.sql
    ```
    
- Crear usuario admin:
    
    ```bash
    npm run seed:admin
    ```
    

**Frontend:**

- Crear sitio estático (Render o Vercel)
    
- Comandos:
    
    ```bash
    npm run build
    ```
    
- Directorio de publicación: `/dist`
    

---

## Estado Actual

✅ Backend funcional con autenticación JWT y bitácoras por IP y usuario  
✅ Panel React con edición en línea y roles dinámicos  
✅ DUCA con importador, aduana, país y conversión de moneda  
✅ Validación completa para agentes (aprobación y rechazo con motivo)  
✅ Bitácoras automáticas (`logBitacora` + trigger SQL)  
✅ Fechas formateadas y catálogos dinámicos

🚧 Próximas mejoras:

- Reportes PDF y XLSX con XtraReports
    
- Dashboard con gráficos y métricas
    
- Auditoría avanzada y exportación de logs
    

---

## Autor

Desarrollado por **Víctor Méndez**  
Proyecto académico y técnico de despliegue real con **Clean Architecture** + **MVC Asíncrono**.

**Tecnologías:** Node.js, Express, PostgreSQL, React, Vite, Render

---

## Licencia

**MIT © 2025** — Puedes usar, modificar y mejorar este sistema libremente.  
Si mejoras SIGLAD, ¡menciona el crédito original para mantener viva la cadena de aprendizaje! 
