# SIGLAD — Sistema Integrado de Gestión Logística Aduanera y Declaraciones

**SIGLAD** es una plataforma web integral para la **gestión, validación y control de declaraciones aduaneras electrónicas (DUCA)** bajo el esquema regional centroamericano.  
El sistema implementa **autenticación por roles**, **bitácoras automáticas por IP y usuario**, y catálogos dinámicos de **aduanas, países e importadores**, todo conectado a **PostgreSQL** con triggers de auditoría.

## Estructura del Proyecto

```

siglad_proyecto/  
├── backend/ # API Node.js + Express + PostgreSQL  
│ ├── routes/ # auth, users, duca, catalogos  
│ ├── middleware/ # requireAuth, requireRole, requireAnyRole  
│ ├── utils/ # bitacora.js (registro de acciones e IP)  
│ ├── scripts/ # seed-admin.js  
│ ├── db.js # Configuración del Pool PostgreSQL  
│ ├── server.js # Servidor principal Express  
│ ├── package.json  
│ └── .env.example  
│  
├── frontend/ # Interfaz React + Vite  
│ ├── src/  
│ │ ├── App.jsx  
│ │ ├── Login.jsx  
│ │ ├── Panel.jsx  
│ │ ├── UsersAdmin.jsx  
│ │ ├── DucaRecepcion.jsx  
│ │ ├── ConsultaEstados.jsx  
│ │ └── ValidacionAgente.jsx  
│ ├── package.json  
│ └── vite.config.js  
│  
└── database/  
└── script.sql # Esquema completo PostgreSQL (bitácoras, triggers y catálogos)

````

---

## 🧠 Funcionalidades Principales

| Rol                 | Funcionalidades                                                           | Descripción                                                                                                             |
| ------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Administrador**   | Gestión completa de usuarios (crear, editar, activar/inactivar, eliminar) | Puede crear y editar usuarios directamente desde la tabla; controla roles y estados.                                    |
| **Transportista**   | Registro y envío de DUCA                                                  | Crea y envía declaraciones con datos de importador, transporte, mercancías y moneda.                                    |
| **Agente Aduanero** | Validación de declaraciones                                               | Visualiza pendientes, detecta campos faltantes automáticamente y puede **aprobar o rechazar** (con motivo obligatorio). |
| **Importador**      | Catálogo referencial                                                      | Figura como entidad seleccionable en el formulario de DUCA.                                                             |

---

## Arquitectura General

- **Backend:** Node.js + Express  
- **Base de datos:** PostgreSQL (con JSONB y triggers de bitácora)  
- **Frontend:** React + Vite + Axios  
- **Autenticación:** JWT + bcryptjs  
- **Bitácoras:** función `logBitacora()` + trigger `trg_bitacora_duca`  
- **Despliegue:** Render (backend + PostgreSQL)  
- **Arquitectura:** MVC + Clean Architecture asíncrona  

---

## Instalación Local

### 1. Clonar el repositorio
```bash
git clone https://github.com/Calatias7/ProyectoWeb.git
cd ProyectoWeb
````

### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus datos:

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

### 3. Configurar el frontend

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
|**Administrador**|[admin@siglad.com](mailto:admin@siglad.com)|Admin123|Control total del sistema|
|**Transportista**|(crear desde Admin)|—|Envía DUCA|
|**Agente Aduanero**|(crear desde Admin)|—|Valida y rechaza DUCA|
|**Importador**|(crear desde Admin)|—|Referencia seleccionable|

---

## Estructura de Base de Datos

Archivo: `database/script.sql`

|Tabla|Descripción|
|---|---|
|`users`|Usuarios del sistema (roles, activos/inactivos)|
|`declaraciones`|Declaraciones DUCA (JSONB + timestamps)|
|`bitacora_usuarios`|Acciones de usuarios (login, CRUD, validaciones, IP, resultado)|
|`bitacora_duca`|Historial de eventos sobre declaraciones (trigger automático)|
|`aduanas`|Catálogo de aduanas centroamericanas|
|`paises`|Catálogo de países (GT, HN, SV, CR, NI, PA)|

**Características:**

- Índices en `estado`, `user_id`, `numero_documento`.
    
- Trigger `trg_bitacora_duca` registra cambios en cada declaración.
    
- Bitácora automática por IP y usuario en acciones críticas.
    
- Datos base de aduanas y países incluidos.
    

---

## Lógica DUCA y Validaciones

### Registro de DUCA (Transportista)

- Selección de importador (`/api/users/importadores`)
    
- Catálogo de aduanas (`/api/catalogos/aduanas`)
    
- País destino y moneda (GTQ / USD)
    
- Cálculo automático: `cantidad × valor unitario`
    
- Guarda todo el documento como `JSONB` en `declaraciones`
    

### Consulta de Estados

- Filtrado por estado (**Todos / Pendiente / Validada / Rechazada**)
    
- Muestra:
    
    - Número de documento
        
    - Estado actual
        
    - Fecha de creación
        
    - Fecha de revisión
        
- En el detalle:
    
    - Importador, transporte (con `ruta.aduanaSalida`, `aduanaEntrada`, `paisDestino`)
        
    - Mercancías y valores
        
    - Motivo de rechazo (si aplica)
        

### Validación de Declaraciones (Agente Aduanero)

- Lista de pendientes desde `/api/duca/pendientes`
    
- Visualización detallada
    
- Validación automática:
    
    - Si falta un campo, aparece listado en un recuadro amarillo “Datos faltantes”.
        
    - Detecta campos vacíos en importador, transporte, mercancías o valores.
        
- Acciones:
    
    - **Aprobar:** cambia estado a `VALIDADA`
        
    - **Rechazar:** requiere motivo obligatorio (`motivo_rechazo`)
        

---

## Endpoints Principales

|Método|Ruta|Rol|Descripción|
|---|---|---|---|
|**POST**|`/api/auth/login`|Todos|Iniciar sesión (JWT)|
|**GET**|`/api/users`|Administrador|Listar usuarios|
|**POST**|`/api/users`|Administrador|Crear usuario|
|**PUT**|`/api/users/:id`|Administrador|Editar usuario (en línea)|
|**PUT**|`/api/users/:id/activo`|Administrador|Activar / Inactivar usuario|
|**DELETE**|`/api/users/:id`|Administrador|Eliminar usuario|
|**GET**|`/api/users/importadores`|Admin / Agente / Transportista|Listar importadores activos|
|**GET**|`/api/catalogos/aduanas`|Todos con token|Catálogo de aduanas|
|**POST**|`/api/duca/enviar`|Transportista|Registrar nueva DUCA|
|**GET**|`/api/duca/consulta`|Todos|Lista general|
|**GET**|`/api/duca/detalle/:numero`|Todos|Ver detalle|
|**POST**|`/api/duca/aprobar/:numero`|Agente Aduanero|Aprobar DUCA|
|**POST**|`/api/duca/rechazar/:numero`|Agente Aduanero|Rechazar DUCA con motivo|

---

## Despliegue en Render

**Backend**

```bash
npm install
npm start
```

Variables:

```
DATABASE_URL=postgres://usuario:clave@host:5432/basedatos
JWT_SECRET=supersecreto
DB_SSL=true
PORT=3000
```

**Base de Datos**

```bash
psql "postgres://usuario:clave@host:5432/basedatos?sslmode=require" -f database/script.sql
npm run seed:admin
```

**Frontend**

```bash
npm run build
```

Publicar `/dist` como sitio estático (Render o Vercel).

---

## Estado Actual

✅ Backend con JWT, roles y bitácoras por ID y usuario  
✅ Edición de usuarios directamente en tabla  
✅ DUCA con transporte anidado (`ruta.aduanaSalida`, etc.)  
✅ Validación visual de datos faltantes  
✅ Rechazo con motivo obligatorio  
✅ Trigger SQL y bitácora unificada  
✅ Fechas formateadas (creación y revisión)  
✅ Compatible con Render + PostgreSQL

🚧 **Próximas mejoras:**

- Reportes PDF / XLSX
    
- Dashboard administrativo con estadísticas
    
- Auditoría avanzada y exportación de logs
    

---

## 👨‍💻 Autor

Desarrollado por **Víctor Méndez**  
Proyecto académico y técnico de despliegue real con **Node.js + PostgreSQL + React**  
Basado en **Clean Architecture** y **MVC Asíncrono**.

---

## 📜 Licencia

**MIT © 2025** — Puedes usar, modificar y mejorar este sistema libremente.  
Si mejoras SIGLAD, ¡menciona el crédito original para mantener viva la cadena de aprendizaje!
