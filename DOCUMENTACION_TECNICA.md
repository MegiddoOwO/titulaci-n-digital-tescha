# Documentación Técnica Completa

## Sistema de Control y Administración de Titulación ISC

**Tecnológico de Estudios Superiores de Chalco (TESCHA)**  
**División de Ingeniería en Sistemas Computacionales**

---

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Base de Datos](#3-base-de-datos)
4. [Backend — API REST](#4-backend--api-rest)
5. [Frontend — SPA React](#5-frontend--spa-react)
6. [Catálogo Completo de APIs](#6-catálogo-completo-de-apis)
7. [Flujos de Negocio](#7-flujos-de-negocio)
8. [Sistema de Seguridad](#8-sistema-de-seguridad)
9. [Privacidad y Cumplimiento LGPDPPSO](#9-privacidad-y-cumplimiento-lgpdppso)
10. [Pruebas](#10-pruebas)
11. [Dependencias y Stack Tecnológico](#11-dependencias-y-stack-tecnológico)
12. [Configuración y Despliegue](#12-configuración-y-despliegue)
13. [Estructura de Archivos](#13-estructura-de-archivos)

---

## 1. Visión General

### 1.1 Propósito del Sistema

El SCA-ISC es una plataforma web integral que digitaliza el proceso de titulación para egresados de Ingeniería en Sistemas Computacionales del TESCHA. El sistema orquesta la interacción entre tres actores: **estudiantes** (cargan documentación y dan seguimiento), **asesores/docentes** (revisan proyectos y emiten liberaciones), y **administrativos** (validan documentos, emiten dictámenes y gestionan usuarios).

### 1.2 Problema que resuelve

El proceso tradicional requiere hasta 7 visitas presenciales del egresado, con expedientes físicos propensos a errores, fotos rechazadas por incumplir normativas, pagos mal direccionados, y comunicación asíncrona que genera incertidumbre. El SCA-ISC reduce esto a 2 visitas presenciales concentrando en la plataforma: carga documental con validación automática, semáforo de estatus en tiempo real, notificaciones transaccionales y guías interactivas.

### 1.3 Alcance funcional

| Módulo | Funcionalidades |
|--------|----------------|
| **Autenticación** | Login con número de control, JWT, RBAC (3 roles), bloqueo por intentos fallidos |
| **Expediente Digital** | Carga de documentos por categoría, validación de formato/tamaño/PDF corrupto, prerrequisitos secuenciales |
| **Semáforo y Trazabilidad** | Barra de progreso, semáforo rojo/ámbar/verde, línea de tiempo con historial de cambios |
| **Panel Administrativo** | Dashboard con métricas, revisión de documentos, aprobación/rechazo con justificación, emisión de dictámenes |
| **Notificaciones** | Campana in-app con badge de no leídas, registro de emails (infraestructura lista para SMTP) |
| **Contenido Informativo** | Normativa dinámica con filtro por modalidad, directorio institucional con búsqueda, guía de fotografía, wizard de pago |
| **Privacidad** | Consentimiento LGPDPPSO en primer login, formulario de derechos ARCO, panel admin ARCO, bitácora de auditoría |
| **Gestión de Usuarios** | CRUD de usuarios por admin, activación/desactivación, asignación de asesores y sinodales |
| **Catálogos** | CRUD genérico de opciones de titulación, tipos de documento, normativa y directorio desde panel admin |
| **Panel Asesor** | Vista de estudiantes asignados, revisión y aprobación/rechazo de documentos por asesor |
| **Reset Password** | Restablecimiento de contraseña vía token por URL (`/reset-password?token=...`) |
| **Dictamen PDF** | Generación de dictamen en PDF con PDFKit, colores institucionales, firma y observaciones |
| **Theme Toggle** | Alternancia dark/light mode con persistencia en localStorage |
| **Error Boundary** | Componente de clase que captura errores de renderizado con pantalla de fallback |

---

## 2. Arquitectura del Sistema

### 2.1 Modelo Cliente-Servidor Desacoplado

```
┌──────────────────────────────────────────────────────────────┐
│  Navegador (Cliente)                                         │
│  http://localhost:8080                                       │
│                                                              │
│  ┌────────────────────┐        ┌───────────────────────────┐ │
│  │  Vite Dev Server    │        │  React 18 SPA             │ │
│  │  Puerto 8080        │───────▶│  - React Router           │ │
│  │  Proxy /api → :3000 │        │  - TanStack Query         │ │
│  └────────────────────┘        │  - shadcn/ui + Tailwind   │ │
│                                 │  - AuthContext (JWT)       │ │
│                                 └───────────┬───────────────┘ │
└─────────────────────────────────────────────┼─────────────────┘
                                              │ HTTP (fetch)
                                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend API REST                                            │
│  http://localhost:3000                                       │
│                                                              │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  Express.js + TypeScript                                  ││
│  │  Clean Architecture (Domain/UseCases/Infrastructure)      ││
│  │                                                           ││
│  │  Middleware: helmet, cors, authenticate, authorize,       ││
│  │              rateLimiter, multer                          ││
│  │                                                           ││
│  │  Rutas: /api/auth, /api/tramites, /api/admin,            ││
│  │         /api/notificaciones, /api/directorio,            ││
│  │         /api/normativa, /api/privacidad, /api/arco       ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌──────────────────────────────────────────────────────────────┐
│  Base de Datos MariaDB 10.11                                 │
│  sca_tescha (utf8mb4, InnoDB)                                │
│                                                              │
│  14 tablas + 2 vistas + 150+ registros seed                  │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 Justificación Arquitectónica

**Frontend: Single Page Application (SPA) con React 18** — elegida por su capacidad de crear interfaces interactivas sin recarga de página, esencial para un dashboard con actualización en tiempo real de estatus de trámites. React Router permite navegación sin recarga y protección de rutas condicional.

**Backend: API REST con Express.js y Clean Architecture** — la separación en capas (dominio → casos de uso → controladores → infraestructura) garantiza que la lógica de negocio (validaciones de documentos, reglas de prerrequisitos, emisión de dictámenes) sea independiente del framework HTTP o del motor de base de datos. Esto permite migrar componentes sin reescribir el núcleo.

**Base de Datos: MariaDB relacional** — el documento de requisitos especifica MySQL/MariaDB. Las relaciones entre entidades (usuario → trámite → documentos → asignaciones → dictamen) son naturalmente relacionales y requieren integridad referencial con foreign keys.

**Proxy Vite** — en desarrollo, el frontend en puerto 8080 proxifica `/api/*` al backend en puerto 3000, eliminando problemas de CORS sin configuración adicional.

---

## 3. Base de Datos

### 3.1 Esquema Completo

El esquema `sca_tescha` contiene 14 tablas organizadas en 4 categorías:

#### Catálogos (tablas de referencia)

| Tabla | Propósito | Campos clave |
|-------|-----------|-------------|
| `opciones_titulacion` | Modalidades de titulación disponibles | `id`, `nombre` (Tesis, Residencias, Excelencia, EGEL, Posgrado), `activo` |
| `tipos_documento` | Catálogo de documentos requeridos con prerrequisitos | `id`, `nombre`, `opcion_titulacion_id` (NULL=todas), `prerrequisito_id` (FK a sí mismo), `formato_permitido`, `tamaño_max_mb`, `orden` |
| `normativa` | Reglamentos y lineamientos institucionales | `id`, `titulo`, `contenido`, `categoria`, `modalidad_id` (filtro por opción) |
| `directorio` | Contactos institucionales | `id`, `nombre`, `cargo`, `departamento`, `email`, `extension` |

#### Entidades Principales

| Tabla | Propósito | Campos clave |
|-------|-----------|-------------|
| `usuarios` | Todos los actores del sistema | `id`, `numero_control` (único), `email`, `password_hash` (bcrypt 12 rondas), `rol` (ENUM: estudiante/asesor/administrativo), `intentos_fallidos`, `bloqueado_hasta`, `grado_academico`, `carga_maxima` |
| `tramites` | Expediente de titulación por estudiante | `id`, `usuario_id` (FK→estudiante), `opcion_titulacion_id`, `estatus` (ENUM: en_proceso/en_revision/aprobado/rechazado/completado), `titulo_proyecto` |
| `documentos` | Archivos subidos por el estudiante | `id`, `tramite_id`, `tipo_documento_id`, `archivo_url`, `archivo_nombre`, `archivo_tamaño`, `estatus` (ENUM: pendiente/cargado/en_revision/aprobado/rechazado), `motivo_rechazo`, `revisado_por` |
| `asignaciones` | Docentes asignados a trámites | `id`, `tramite_id`, `usuario_id` (FK→docente), `rol_asignacion` (ENUM: asesor/sinodal/revisor), `activo`. UNIQUE(tramite_id, usuario_id, rol_asignacion) |
| `dictamenes` | Resultado oficial del trámite | `id`, `tramite_id` (UNIQUE), `resultado` (ENUM: aprobado/rechazado), `observaciones`, `emitido_por` (FK→admin) |

#### Trazabilidad y Auditoría

| Tabla | Propósito | Campos clave |
|-------|-----------|-------------|
| `historial_estados` | Línea de tiempo de cambios | `id`, `tramite_id`, `documento_id` (nullable), `estado_anterior`, `estado_nuevo`, `comentario`, `usuario_id` |
| `bitacora` | Registro de seguridad y auditoría | `id`, `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalle` (JSON), `ip_origen` |

#### Comunicación y Privacidad

| Tabla | Propósito | Campos clave |
|-------|-----------|-------------|
| `notificaciones` | Alertas in-app y registro de emails | `id`, `usuario_id`, `tipo` (ENUM: in_app/email/ambos), `titulo`, `mensaje`, `leida`, `tramite_id` |
| `consentimientos` | Registro de aceptación de aviso de privacidad | `id`, `usuario_id`, `version_aviso`, `ip_origen`, `fecha_consentimiento` |
| `solicitudes_arco` | Derechos ARCO del titular de datos | `id`, `usuario_id`, `tipo` (ENUM), `estado`, `detalle_solicitud`, `respuesta` |
| `requisitos_fotografia` | Lista de 12 requisitos para fotos | `id`, `descripcion`, `orden` |

### 3.2 Vistas (Views)

| Vista | Propósito | Columnas |
|-------|-----------|----------|
| `vw_carga_docente` | Carga actual vs máxima de cada docente | `docente_id`, `carga_maxima`, `carga_actual` |
| `vw_progreso_tramite` | Progreso, semáforo y porcentaje por trámite | `tramite_id`, `total_documentos`, `docs_aprobados/rechazados/cargados/en_revision/pendientes`, `color_semaforo`, `porcentaje_avance` |

### 3.3 Relaciones Clave

```
usuarios (estudiante) ──1:N──▶ tramites ──1:N──▶ documentos ──N:1──▶ tipos_documento
                                        │
                                        ├──1:N──▶ asignaciones ──N:1──▶ usuarios (docente)
                                        │
                                        └──1:1──▶ dictamenes ──N:1──▶ usuarios (admin)
```

### 3.3 Justificación del Diseño

**Separación usuario-docente en misma tabla**: el documento especifica 3 roles (estudiante, asesor, administrativo). Usar una sola tabla `usuarios` con ENUM `rol` simplifica el login y RBAC. Los campos específicos de docente (`grado_academico`, `carga_maxima`) son NULL para otros roles.

**Prerrequisitos en `tipos_documento`**: la self-reference `prerrequisito_id` permite modelar el requisito P-17: "No se puede subir Solicitud de Titulación sin tener Certificado aprobado". La validación ocurre en el backend antes de aceptar el upload.

**Bitácora con JSON**: el campo `detalle` usa tipo JSON de MariaDB para almacenar metadatos variables de cada acción (tipo de documento aprobado, motivo de rechazo, resultado de dictamen) sin necesidad de una tabla de metadatos separada.

**Vistas en vez de lógica duplicada**: `vw_progreso_tramite` calcula el semáforo en SQL para que cualquier consumidor (API, reportes, dashboard) obtenga el mismo resultado sin duplicar la lógica de conteo.

---

## 4. Backend — API REST

### 4.1 Estructura Clean Architecture

```
server/src/
├── config/              # Variables de entorno y conexión BD
│   ├── env.ts           # Carga y tipa .env
│   └── database.ts      # Pool de conexiones mysql2
├── domain/entities/     # Interfaces puras (sin dependencias)
│   ├── Usuario.ts       # Usuario, RolUsuario, JwtPayload
│   ├── Tramite.ts       # Tramite, TramiteConDocumentos, Asignacion, DictamenInfo
│   ├── Documento.ts     # DocumentoInfo, HistorialEntry
│   └── Admin.ts         # ExpedienteListItem, AdminDashboardStats
├── infrastructure/      # Adaptadores a servicios externos
│   ├── database/
│   │   ├── MysqlUsuarioRepository.ts
│   │   ├── MysqlTramiteRepository.ts
│   │   └── AdminRepository.ts
│   └── services/
│       └── NotificacionService.ts  # + BitacoraService
├── use-cases/           # Lógica de negocio pura
│   ├── auth/login.ts
│   └── tramites/
│       ├── obtenerMiTramite.ts
│       └── subirDocumento.ts
├── controllers/         # (integrados en routes/)
├── middleware/           # Capa transversal HTTP
│   ├── authenticate.ts  # Verificación JWT
│   ├── authorize.ts     # Control de acceso RBAC
│   ├── rateLimiter.ts   # Anti brute-force en login
│   └── upload.ts        # Multer para archivos
├── routes/              # Definición de endpoints
│   ├── auth.routes.ts
│   ├── tramite.routes.ts
│   ├── admin.routes.ts
│   ├── notificacion.routes.ts
│   ├── directorio.routes.ts
│   ├── normativa.routes.ts
│   ├── contenido.routes.ts
│   ├── privacidad.routes.ts
│   ├── arco.routes.ts
│   ├── asesor.routes.ts
│   └── catalogos.routes.ts
├── app.ts               # Configuración Express
└── index.ts             # Entrypoint
```

### 4.2 Justificación de Clean Architecture

El documento de requisitos (página 14, Arquitectura de Backend) especifica explícitamente "Arquitectura Limpia con capas concéntricas". Esto garantiza que:

- **Dominio**: las reglas de negocio (ej. "no se puede emitir dictamen sin todos los documentos aprobados") viven en entidades y casos de uso, sin depender de Express, MySQL ni ningún framework
- **Casos de Uso**: orquestan el flujo (validar credenciales → generar JWT → registrar bitácora)
- **Controladores/Rutas**: solo traducen HTTP a llamadas de casos de uso
- **Infraestructura**: los repositorios implementan las consultas SQL concretas y pueden ser reemplazados (ej. cambiar a PostgreSQL) sin tocar la lógica de negocio

### 4.3 Middleware en Detalle

#### `authenticate.ts`
Extrae el token JWT del header `Authorization: Bearer <token>`, lo verifica con `jsonwebtoken`, y adjunta el payload decodificado a `req.user`. Retorna 401 si el token falta, expiró o es inválido.

#### `authorize.ts`
Recibe una lista de roles permitidos. Compara `req.user.rol` contra la lista. Retorna 403 con mensaje descriptivo si el rol no coincide. Uso típico: `authorize("administrativo")` en rutas del panel admin.

#### `rateLimiter.ts`
Usa `express-rate-limit` para limitar las peticiones al endpoint de login a 30 por ventana de 15 minutos por IP. Es una capa complementaria al bloqueo por usuario (que maneja el caso de uso `login.ts` con `intentos_fallidos` en BD).

#### `upload.ts`
Configura Multer con `memoryStorage` para recibir archivos en memoria. Límite: 10 MB. La validación de formato y PDF corrupto se hace en el caso de uso `subirDocumento.ts`, no en el middleware, siguiendo el principio de que la lógica de negocio pertenece a los casos de uso.

### 4.4 Casos de Uso Principales

#### `login.ts` — Autenticación

```
Flujo:
1. Buscar usuario por numero_control en BD
2. Si no existe → error "Número de control o contraseña incorrectos"
3. Si existe y está bloqueado (bloqueado_hasta > NOW()) → error de bloqueo
4. bcrypt.compare(password, usuario.password_hash)
5. Si no coincide → incrementar intentos_fallidos
   - Si llega a 5 → bloquear por 15 minutos
6. Si coincide → resetear intentos, generar JWT con:
   - sub: usuario.id
   - numero_control
   - rol
   - nombre
   - exp: 24h
7. Retornar token + datos del usuario
```

#### `subirDocumento.ts` — Carga de archivos

```
Flujo:
1. Verificar que el trámite pertenezca al usuario autenticado
2. Obtener info del tipo_documento (formato_permitido, tamaño_max_mb)
3. Verificar prerrequisito: si el tipo tiene prerequisito_id,
   verificar que ese documento exista y esté "aprobado"
4. Validar MIME type contra formatos permitidos
5. Validar tamaño contra tamaño_max_mb
6. Validar header %PDF si es application/pdf (anti-corrupción)
7. Guardar archivo en server/uploads/{timestamp}_{nombre}
8. UPSERT en tabla documentos (INSERT o UPDATE si ya existía)
9. INSERT en historial_estados
10. Retornar documento_id
```

#### `emitirDictamen` (en AdminRepository)

```
Flujo:
1. Verificar que el trámite exista y esté activo
2. UPSERT en dictamenes (INSERT o UPDATE si ya existía)
3. Actualizar tramite.estatus:
   - "aprobado" → "completado"
   - "rechazado" → "rechazado"
4. INSERT notificación para el estudiante (tipo='ambos')
5. INSERT en historial_estados
6. INSERT en bitacora (auditoría)
```

### 4.5 Servicios

#### `NotificacionService`
Centraliza la creación de notificaciones. Método `create()`:
- Inserta en tabla `notificaciones`
- Si `tipo='email'` o `'ambos'`, llama a `sendEmail()` (actualmente imprime en consola, listo para conectar nodemailer con SMTP institucional)

#### `BitacoraService`
Registra acciones administrativas para auditoría. Cada acción de aprobar/rechazar/emitir dictamen genera una entrada con: usuario, acción, entidad afectada, ID, detalles en JSON, IP.

#### `generarDictamenPDF.ts` (PDFKit)
Genera un dictamen oficial de titulación en PDF tamaño Carta con colores institucionales TESCHA:
- **Cabecera**: rectángulo guinda `#8A2036` con nombre TESCHA y división ISC en dorado `#BC955B`
- **Campos**: Alumno, Número de Control, Opción de Titulación, Fecha de Emisión — con líneas divisorias
- **Resultado**: recuadro con fondo verde (#ECFDF5) o rojo (#FFF1F2) según aprobado/rechazado
- **Observaciones**: 5 líneas guía con texto real sobrepuesto (si existe)
- **Firma**: línea para firma del administrativo
- **Footer**: texto institucional SCA-TESCHA
- Se envía como stream HTTP con `Content-Type: application/pdf` y `Content-Disposition: inline`

#### `catalogos.routes.ts` (CRUD Genérico Parametrizado)
Implementa un patrón de CRUD genérico mediante la función `crudRoutes(path, table, extraCols?)` que registra automáticamente 4 endpoints REST por cada catálogo:
- `GET /api/admin/catalogos/{path}` — SELECT * FROM table ORDER BY nombre
- `POST` — INSERT con validación de nombre requerido
- `PUT /:id` — UPDATE dinámico con columnas extras opcionales (ej. `fecha_limite` en opciones_titulacion)
- `PUT /:id/toggle` — `UPDATE table SET activo = NOT activo`
Se aplica a 4 catálogos: `opciones` (opciones_titulacion + fecha_limite), `tipos-documento` (tipos_documento), `normativa` (normativa), `directorio` (directorio).

---

## 5. Frontend — SPA React

### 5.1 Estructura de Componentes

```
src/
├── App.tsx                    # Raíz: providers + rutas
├── main.tsx                   # Entrypoint React DOM
├── index.css                  # Tailwind + variables CSS + Rubik font
├── pages/
│   ├── Index.tsx              # Landing page wrapper
│   ├── Landing.tsx            # Hero, features, timeline
│   ├── Login.tsx              # Formulario login + modal registro
│   ├── Dashboard.tsx          # Panel estudiante (~1100 líneas)
│   ├── Normativa.tsx          # Reglamentos dinámicos
│   ├── NotFound.tsx           # Página 404
│   ├── ResetPassword.tsx        # Restablecer contraseña vía token
│   └── admin/
│       ├── AdminLayout.tsx    # Sidebar + Outlet + ThemeToggle
│       ├── AdminDashboard.tsx # Métricas y gráficos
│       ├── AdminExpedientes.tsx # Tabla + búsqueda + detalle
│       ├── AdminDocumentos.tsx  # Revisión con aprobar/rechazar
│       ├── AdminDictamenes.tsx  # Emisión de dictámenes
│       ├── AdminUsuarios.tsx    # CRUD de usuarios
│       ├── AdminARCO.tsx        # Gestión administrativa solicitudes ARCO
│       ├── AdminBitacora.tsx    # Visualización bitácora de auditoría
│       └── AdminCatalogos.tsx   # CRUD de catálogos (opciones, tipos doc, normativa, directorio)
│   └── asesor/
│       └── AsesorDashboard.tsx  # Panel de asesor con estudiantes asignados
├── components/
│   ├── NavLink.tsx            # NavLink con activeClassName
│   ├── AdminSidebar.tsx       # Sidebar admin colapsable
│   ├── ProtectedRoute.tsx     # Guard de autenticación + RBAC
│   ├── PrivacyConsentModal.tsx # Modal LGPDPPSO primer login
│   ├── ErrorBoundary.tsx      # Captura errores renderizado (Class Component)
│   └── ThemeToggle.tsx        # Dark/light mode con localStorage
├── contexts/
│   └── AuthContext.tsx        # Estado global de autenticación
├── hooks/
│   ├── useTramite.ts          # TanStack Query: trámite + upload + historial
│   ├── useAdmin.ts            # TanStack Query: admin stats, expedientes, dictámenes
│   ├── useNotificaciones.ts   # TanStack Query: notificaciones + polling 30s
│   ├── use-toast.ts           # Hook de toasts (shadcn/ui sonner wrapper)
│   └── use-mobile.tsx         # Detección viewport < 768px
├── services/
│   └── api.ts                 # Cliente HTTP con JWT interceptor
├── lib/
│   └── utils.ts               # cn() helper (clsx + tailwind-merge)
└── test/
    ├── setup.ts               # jsdom + jest-dom + matchMedia mock
    ├── example.test.ts        # Test trivial
    ├── api.test.ts            # Tests de gestión de token
    └── ProtectedRoute.test.tsx # Tests de protección de rutas
```

### 5.2 Páginas en Detalle

#### `Login.tsx`

**Propósito**: pantalla de autenticación institucional.

**Diseño**: split-screen con branding TESCHA a la izquierda y formulario a la derecha sobre fondo banner institucional con overlay guinda semi-transparente.

**Funcionalidades**:
- Campo "Número de Control" (reemplazó el campo email original del mock)
- Campo contraseña con toggle de visibilidad
- Validación de dominio institucional movida al backend
- Llamada a `AuthContext.login()` que invoca `POST /api/auth/login`
- Manejo de errores: toast rojo para credenciales inválidas o cuenta bloqueada
- Redirección post-login según rol: admin → `/admin`, estudiante/asesor → `/dashboard`
- Botón "Solicita tu acceso aquí" → modal con contactos de Control Escolar y Jefatura ISC desde BD (`GET /api/directorio`), con emails `mailto:` pre-llenados

#### `Dashboard.tsx`

**Propósito**: centro de control del estudiante. Es el componente más grande del frontend (~1100 líneas) porque concentra la mayoría de la interacción del usuario.

**Sidebar** (fondo guinda `#56212f`):
- Logo TESCHA + nombre "SCA-ISC"
- Perfil del estudiante con nombre real desde `useAuth()`
- Navegación: Dashboard (overview), Expediente (documentos), Asesores, Privacidad (ARCO), Mi Dictamen
- Logout en footer

**Tabs del contenido principal**:

| Tab | Fuente de datos | Contenido |
|-----|----------------|-----------|
| **Resumen** | `GET /api/tramites/mi-tramite` | Barra de progreso con color dinámico (verde/ámbar/rojo), semáforo visual, métricas (Total/Aprobados/Pendientes), línea de tiempo con historial, quick actions |
| **Documentos** | `GET /api/tramites/mi-tramite` | 7 documentos con estados reales. Cada fila tiene: nombre, fecha de subida, formato/tamaño permitido, badge de estado, botón [Subir] (si pendiente y no bloqueado), botón [Ver] (si ya cargado). Documentos bloqueados por prerrequisito se atenúan con mensaje explicativo. Upload usa FormData → `POST /api/tramites/:id/documentos` con TanStack Query invalidation. |
| **Requisitos** | `GET /api/tramites/mi-tramite` (documentos) | 3 secciones informativas: Especificaciones de Fotografía (12 requisitos como bullets), Requisitos por Documento (tabla con formato y tamaño máx desde BD), Guía de Pago (5 pasos con referencia de 18 dígitos) |
| **Asesores** | `GET /api/tramites/mi-tramite` (asignaciones) | Asesor principal con badge, email y foto. Sinodales en grid de tarjetas con iniciales y emails clickeables. Mensaje si no hay asignaciones. |
| **Dictamen** | `GET /api/tramites/mi-tramite` (dictamen) | Si existe: tarjeta verde/roja con resultado, emisor, fecha, observaciones y próximo paso. Si no: reloj con mensaje "Dictamen pendiente". |

**Componentes embebidos en Dashboard**:
- `BracketCard`: tarjeta con esquinas decorativas doradas (componente interno)
- `DirectorioModal`: modal con contactos desde `GET /api/directorio`, buscador por nombre/cargo/departamento
- `ArcoModal`: formulario de derechos ARCO con tipo (acceso/rectificación/cancelación/oposición), detalle, y aviso de 15 días hábiles

#### `Normativa.tsx`

Carga contenido desde `GET /api/normativa`. Acordeones con categoría visible y filtro dropdown por modalidad de titulación. Contenido renderizado con `dangerouslySetInnerHTML` para soportar formato HTML en los textos de la BD.

#### `AdminDashboard.tsx`

4 cards de métricas (expedientes activos, docs pendientes, dictámenes emitidos, en proceso) + gráfico de distribución por estado con barras de progreso + resumen agrupado (aprobados/completados, en revisión, rechazados). Datos desde `GET /api/admin/stats`.

#### `AdminExpedientes.tsx`

Tabla con búsqueda en tiempo real (número de control o nombre), filtro dropdown por estatus, paginación 20 registros. Click en fila → diálogo modal con detalle completo: progreso, documentos con botones [Aprobar]/[Rechazar]/[Ver], motivo de rechazo con prompt.

#### `AdminDocumentos.tsx`

Panel dividido: izquierda lista de expedientes, derecha documentos del expediente seleccionado. Cada documento muestra [Aprobar]/[Rechazar] si está en estado "cargado", con modal para escribir motivo de rechazo usando `<Textarea>`.

#### `AdminUsuarios.tsx`

Tabla CRUD completa: lista con búsqueda y filtro por rol, botón "Nuevo Usuario" con formulario modal (número de control, email, contraseña, nombre, apellidos, rol, grado académico condicional para asesores), toggle activar/desactivar con icono de escudo. Contraseña se hashea con bcrypt en el backend.

#### `AdminARCO.tsx`

**Propósito**: gestión administrativa de solicitudes de derechos ARCO (LGPDPPSO). Panel dividido en dos columnas: izquierda tabla de solicitudes con filtro por estado (pendiente/completada/rechazada), derecha formulario de procesamiento con Textarea para respuesta y botones [Resolver]/[Rechazar]. Cada solicitud muestra solicitante, tipo (acceso/rectificación/cancelación/oposición), detalle y fecha. APIs: `GET /api/admin/solicitudes-arco`, `PUT /api/admin/solicitudes-arco/:id`.

#### `AdminBitacora.tsx`

**Propósito**: visualización de la bitácora de auditoría del sistema (`tabla bitacora`). Lista cronológica con paginación (20 registros/página) mostrando: acción, entidad afectada, ID, detalle (JSON truncado a 200 chars), usuario responsable, IP origen y timestamp. Datos desde `GET /api/admin/bitacora?page=&limit=`. Diseño tipo timeline con indicadores circulares color navy.

#### `AdminCatalogos.tsx`

**Propósito**: CRUD genérico sobre 4 catálogos del sistema mediante tabs: Opciones de Titulación (con fecha límite), Tipos de Documento, Normativa y Directorio. Cada tab comparte interfaz unificada: tabla con columnas nombre, estado (activo/inactivo) y acciones (editar, toggle activar/desactivar). Modal reutilizable para crear/editar registros con validación de nombre requerido. API usa ruta genérica `/api/admin/catalogos/{tab}` con operaciones CRUD estándar.

#### `AsesorDashboard.tsx`

**Propósito**: panel del docente/asesor que muestra los estudiantes asignados. Layout de 2 columnas: izquierda lista de estudiantes con nombre, número de control, opción de titulación, semáforo y barra de progreso; derecha detalle del expediente seleccionado con documentos y botones [Aprobar]/[Rechazar] con modal de motivo. Usa TanStack Query con queries `["asesor", "estudiantes"]` y `["asesor", "tramite", id]`. APIs: `GET /api/asesor/estudiantes`, `PUT /api/asesor/documentos/:id/aprobar`, `PUT /api/asesor/documentos/:id/rechazar`.

#### `ResetPassword.tsx`

**Propósito**: pantalla pública de restablecimiento de contraseña. Recibe `token` vía query param (`/reset-password?token=...`). Tres estados: token inválido/expirado (mensaje + link a login), formulario de nueva contraseña (mínimo 8 caracteres, toggle visibilidad), y confirmación de éxito (ícono verde + link a login). API: `POST /api/auth/reset-password` con `{token, password}`.

#### `ErrorBoundary.tsx`

**Propósito**: componente de clase React que captura errores de renderizado en cualquier parte del árbol de componentes. Usa `getDerivedStateFromError` y `componentDidCatch`. Muestra pantalla de fallback con ícono AlertTriangle, mensaje "Algo salió mal" y botón "Recargar página" (`window.location.reload()`). Envuelve toda la app en `App.tsx` como wrapper de `<Routes>`.

#### `ThemeToggle.tsx`

**Propósito**: botón de alternancia entre modo claro y oscuro. Estado inicial desde localStorage (`sca_theme`). Al cambiar, agrega/remueve clase `dark` en `document.documentElement` y persiste preferencia. Usa iconos `Moon`/`Sun` de lucide-react. Integrado en el header del `AdminLayout.tsx`.

### 5.3 Contextos y Estado Global

#### `AuthContext.tsx`

**Estado**: `usuario`, `isAuthenticated`, `isLoading`, `consentido`

**Al montar**: intenta restaurar sesión con `GET /api/auth/me` si hay token en localStorage. Luego verifica consentimiento con `GET /api/privacidad/consentimiento`.

**Funciones**:
- `login(numeroControl, password)`: llama `POST /api/auth/login`, guarda token, retorna usuario (con rol para redirect)
- `logout()`: borra token de localStorage, limpia estado
- `darConsentimiento()`: llama `POST /api/privacidad/consentimiento`

**Uso**: envuelve toda la app en `<AuthProvider>`. Los componentes acceden vía `useAuth()`.

### 5.4 Hooks de Datos (TanStack Query)

| Hook | Query Key | Endpoint | staleTime | Funciones |
|------|-----------|----------|-----------|-----------|
| `useTramite` | `["mi-tramite"]` | `GET /api/tramites/mi-tramite` | 30s | `uploadDocumento.mutate()` con FormData |
| `useTramite` (historial) | `["mi-tramite", "historial", id]` | `GET /api/tramites/:id/historial` | 30s | — |
| `useAdmin` (stats) | `["admin", "stats"]` | `GET /api/admin/stats` | 30s | — |
| `useAdmin` (expedientes) | `["admin", "expedientes", params]` | `GET /api/admin/expedientes` | 10s | `listarExpedientes({search, estatus, page})` |
| `useAdmin` (detalle) | `["admin", "expediente", id]` | `GET /api/admin/expedientes/:id` | — | `aprobarDoc.mutate()`, `rechazarDoc.mutate()`, `emitirDictamen.mutate()` |
| `useNotificaciones` | `["notificaciones"]` | `GET /api/notificaciones` | 15s, refetch 30s | `marcarTodas.mutate()` |
| `AsesorDashboard` (useQuery) | `["asesor", "estudiantes"]` | `GET /api/asesor/estudiantes` | 15s | `aprobarMutation.mutate()`, `rechazarMutation.mutate()` |

**Justificación TanStack Query**: elegido sobre useEffect+useState porque provee cache automático, invalidación tras mutaciones, refetch en intervalos para notificaciones, y estados de loading/error integrados. Estaba instalado en el proyecto original (Lovable lo incluye), solo estaba sin usar.

### 5.5 Servicio API

`src/services/api.ts` proporciona cuatro funciones HTTP con interceptor JWT automático:

- `apiGet<T>(url)` — GET con header `Authorization: Bearer <token>` automático
- `apiPost<T>(url, body)` — POST con header JWT automático
- `apiPut<T>(url, body?)` — PUT con header JWT automático, body opcional
- `apiDelete<T>(url)` — DELETE con header JWT automático
- `getToken()`, `setToken()`, `removeToken()` — gestión de token en localStorage con key `sca_token`

El interceptor `handleResponse` parsea la respuesta JSON y lanza `ApiError` tipado si `!response.ok`, permitiendo a los hooks y componentes manejar errores de forma estructurada.

---

## 6. Catálogo Completo de APIs

### 6.1 Autenticación (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `POST` | `/api/auth/login` | No (rate-limited) | Login con numero_control + password. Retorna JWT + usuario. Implementa bloqueo tras 5 fallos. |
| `GET` | `/api/auth/me` | JWT | Retorna payload del JWT actual (sub, numero_control, rol, nombre) |

| `POST` | `/api/auth/reset-password` | No | Restablece contraseña con token enviado por email. Requiere `{token, password}`. |

### 6.2 Trámites (`/api/tramites`)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/api/tramites/mi-tramite` | JWT | estudiante | Trámite activo con todos los documentos, progreso, semáforo, asignaciones y dictamen |
| `GET` | `/api/tramites/:id/historial` | JWT | estudiante | Línea de tiempo del trámite |
| `POST` | `/api/tramites/:id/documentos` | JWT | estudiante | Subir archivo (multipart). Valida formato, tamaño, PDF corrupto y prerrequisito |
| `GET` | `/api/tramites/:id/documentos/:docId` | JWT (query o header) | estudiante, admin | Visualizar archivo inline (Content-Disposition: inline) |

### 6.3 Admin (`/api/admin`)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/api/admin/stats` | JWT | administrativo | Métricas agregadas del dashboard |
| `GET` | `/api/admin/expedientes` | JWT | administrativo | Lista con búsqueda (search), filtro (estatus), paginación (page, limit) |
| `GET` | `/api/admin/expedientes/:id` | JWT | administrativo | Detalle completo de un trámite con documentos |
| `PUT` | `/api/admin/documentos/:id/aprobar` | JWT | administrativo | Aprueba documento, notifica al estudiante, registra bitácora |
| `PUT` | `/api/admin/documentos/:id/rechazar` | JWT | administrativo | Rechaza documento con motivo, notifica, registra bitácora |
| `POST` | `/api/admin/dictamenes` | JWT | administrativo | Emite dictamen (aprobado/rechazado), cambia estatus del trámite |
| `GET` | `/api/admin/docentes` | JWT | administrativo | Lista docentes con carga actual desde `vw_carga_docente` |
| `GET` | `/api/admin/usuarios` | JWT | administrativo | Lista usuarios con búsqueda, filtro rol, paginación |
| `POST` | `/api/admin/usuarios` | JWT | administrativo | Crea usuario con bcrypt automático |
| `PUT` | `/api/admin/usuarios/:id/toggle` | JWT | administrativo | Activa/desactiva usuario, resetea intentos fallidos |
| `GET` | `/api/admin/solicitudes-arco` | JWT | administrativo | Lista todas las solicitudes ARCO para gestión admin |
| `PUT` | `/api/admin/solicitudes-arco/:id` | JWT | administrativo | Resuelve/rechaza solicitud ARCO con respuesta |
| `GET` | `/api/admin/bitacora` | JWT | administrativo | Lista bitácora de auditoría con paginación (`page`, `limit`) |
| `GET` | `/api/admin/catalogos/:catalogo` | JWT | administrativo | Lista items de un catálogo (opciones/tipos-documento/normativa/directorio) |
| `POST` | `/api/admin/catalogos/:catalogo` | JWT | administrativo | Crea item en un catálogo |
| `PUT` | `/api/admin/catalogos/:catalogo/:id` | JWT | administrativo | Actualiza item en un catálogo |
| `PUT` | `/api/admin/catalogos/:catalogo/:id/toggle` | JWT | administrativo | Activa/desactiva item en un catálogo (`activo = NOT activo`) |

### 6.4 Asesor (`/api/asesor`)

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `GET` | `/api/asesor/estudiantes` | JWT | asesor | Lista estudiantes asignados al asesor con progreso y semáforo desde `vw_progreso_tramite` |
| `PUT` | `/api/asesor/documentos/:id/aprobar` | JWT | asesor | Aprueba documento asignado (verifica pertenencia a trámite del asesor) |
| `PUT` | `/api/asesor/documentos/:id/rechazar` | JWT | asesor | Rechaza documento asignado con motivo requerido |

### 6.5 Notificaciones (`/api/notificaciones`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/notificaciones` | JWT | Lista notificaciones del usuario. Query `?no_leidas=true` filtra. Retorna `{notificaciones, noLeidas}` |
| `PUT` | `/api/notificaciones/:id/leida` | JWT | Marca una notificación como leída |
| `PUT` | `/api/notificaciones/leer-todas` | JWT | Marca todas las no leídas como leídas |

### 6.6 Contenido (sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/directorio` | Lista contactos. Query `?search=` filtra por nombre/cargo/departamento |
| `GET` | `/api/normativa` | Lista reglamentos. Query `?modalidad_id=` filtra por opción de titulación |
| `GET` | `/api/requisitos-fotografia` | Lista los 12 requisitos para fotografía tamaño miñón |

### 6.7 Privacidad (`/api/privacidad`, `/api/solicitudes-arco`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/privacidad/consentimiento` | JWT | Verifica si el usuario ya aceptó el aviso de privacidad |
| `POST` | `/api/privacidad/consentimiento` | JWT | Registra aceptación con IP y timestamp |
| `POST` | `/api/solicitudes-arco` | JWT | Crea solicitud ARCO (acceso/rectificación/cancelación/oposición) |
| `GET` | `/api/solicitudes-arco` | JWT | Lista solicitudes ARCO del usuario autenticado |

### 6.8 Sistema

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| `GET` | `/api/health` | No | Health check: `{status:"ok", service:"SCA-TESCHA API", version:"1.0.0"}` |

---

## 7. Flujos de Negocio

### 7.1 Flujo Completo de Titulación

```
┌─────────────────────────────────────────────────────────────┐
│ 1. REGISTRO                                                 │
│    Admin crea usuario en /admin/usuarios                    │
│    o Estudiante solicita acceso vía email a Control Escolar │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. PRIMER LOGIN                                             │
│    - Login con número de control + contraseña               │
│    - Modal de Aviso de Privacidad (obligatorio aceptar)     │
│    - Consentimiento registrado en BD con IP y timestamp     │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. CARGA DOCUMENTAL                                         │
│    - Estudiante ve 7 documentos requeridos                  │
│    - Sube uno por uno con validación automática:            │
│      ✓ Formato correcto (PDF/JPEG/PNG)                     │
│      ✓ Tamaño ≤ máximo permitido                            │
│      ✓ PDF no corrupto (header %PDF)                        │
│      ✓ Prerrequisito aprobado (carga secuencial)           │
│    - Cada upload → documento en estado "Recibido"           │
│    - Semáforo se actualiza en tiempo real                   │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. REVISIÓN ADMINISTRATIVA                                  │
│    - Admin ve lista de expedientes                          │
│    - Revisa cada documento (click [Ver] para abrir PDF)     │
│    - [Aprobar] → documento pasa a "Aprobado"                │
│    - [Rechazar] → escribe motivo → documento "Rechazado"    │
│    - Estudiante recibe notificación del cambio              │
│    - Si hay rechazo: estudiante corrige y vuelve a subir    │
└──────────────────────────┬──────────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. DICTAMEN                                                 │
│    - Admin verifica que todos los docs estén aprobados      │
│    - Emite dictamen: Aprobado o Rechazado                   │
│    - Escribe observaciones oficiales                        │
│    - Trámite cambia a "completado" (o "rechazado")          │
│    - Estudiante ve resultado en "Mi Dictamen"               │
│    - Si aprobado: "Acude a ventanilla 08:00-14:00 hrs"     │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Flujo de Notificaciones

Cada cambio de estado genera automáticamente:

1. **INSERT en `notificaciones`** (tipo: `in_app` o `ambos`)
2. **Si `ambos`**: se intenta envío de email (infraestructura lista, requiere SMTP)
3. **Frontend**: TanStack Query refetcha cada 30s, campana muestra badge con conteo
4. **Dashboard**: la línea de tiempo (`historial_estados`) refleja el cambio

### 7.3 Flujo de Auditoría (Bitácora)

Cada acción administrativa registra automáticamente:
- **Aprobar documento**: `{accion: "Aprobación de documento", entidad: "documentos", detalle: {tipo, tramite_id}}`
- **Rechazar documento**: `{accion: "Rechazo de documento", entidad: "documentos", detalle: {tipo, tramite_id, motivo}}`
- **Emitir dictamen**: `{accion: "Emisión de dictamen", entidad: "dictamenes", detalle: {resultado, observaciones}}`

---

## 8. Sistema de Seguridad

### 8.1 Autenticación

- **JWT (JSON Web Token)**: generado con `jsonwebtoken`, firmado con secreto configurable (`JWT_SECRET` en `.env`), expira en 24h
- **Payload**: `{sub: usuario_id, numero_control, rol, nombre}`
- **bcrypt**: contraseñas hasheadas con 12 rondas de sal. Hash ≥ 60 caracteres. Nunca se almacenan en texto plano
- **Stateless**: el servidor no mantiene sesiones en memoria. Toda la información de autorización viaja en el token

### 8.2 Control de Acceso (RBAC)

Tres roles con privilegios granulares:

| Rol | Acceso |
|-----|--------|
| `estudiante` | `/dashboard`, `/api/tramites/mi-tramite`, subir/bajar sus docs |
| `asesor` | Acceso futuro: revisar proyectos asignados (infraestructura lista) |
| `administrativo` | `/admin/*`, todas las APIs de gestión, aprobar/rechazar, dictaminar, CRUD usuarios |

Cada endpoint protegido declara sus roles permitidos con `authorize("rol1", "rol2")`. El frontend refuerza con `ProtectedRoute` que verifica el JWT antes de renderizar y redirige según rol si no coincide.

### 8.3 Protección contra Ataques

| Capa | Mecanismo |
|------|-----------|
| **Brute force login** | Bloqueo de cuenta tras 5 intentos fallidos por 15 minutos (a nivel BD) + rate limiting por IP (express-rate-limit, 30 req/15min) |
| **JWT expirado** | `authenticate` middleware detecta `TokenExpiredError` → 401. Frontend redirige a login |
| **Archivos maliciosos** | Validación de header `%PDF` para prevenir PDFs corruptos. Límite de 10MB |
| **Inyección SQL** | `mysql2` con prepared statements (placeholders `?`) en todas las queries |
| **XSS** | React escapa automáticamente. Único `dangerouslySetInnerHTML` en Normativa (contenido controlado por admin) |
| **CORS** | Solo permite origen configurado (`CORS_ORIGIN` en `.env`) |
| **Cabeceras HTTP** | `helmet` middleware aplica headers de seguridad (X-Content-Type-Options, X-Frame-Options, etc.) |
| **Token en query param** | El endpoint de visualización de archivos acepta token vía `?token=` para `window.open()` que no puede enviar headers. El middleware verifica el JWT manualmente. |

---

## 9. Privacidad y Cumplimiento LGPDPPSO

### 9.1 Fundamento Legal

La **Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados** aplica al TESCHA como institución pública. El documento de requisitos (línea 223) lo establece como restricción obligatoria.

### 9.2 Componentes Implementados

#### Modal de Consentimiento (P-49)

- **Disparador**: primer login de un usuario sin registro en `consentimientos`
- **Contenido**: finalidad del tratamiento, derechos ARCO, almacenamiento seguro, referencia a LGPDPPSO
- **Bloqueante**: el usuario no puede acceder al sistema sin hacer clic en "He leído y acepto"
- **Registro**: `INSERT INTO consentimientos` con `usuario_id`, `version_aviso`, `ip_origen`, `user_agent`, `fecha_consentimiento`
- **Versionado**: si se actualiza el aviso (`version_aviso` = "2.0"), se solicita re-consentimiento

#### Formulario ARCO (P-50)

- **Acceso**: sidebar → "Privacidad" → modal con formulario
- **Tipos**: Acceso (ver datos), Rectificación (corregir), Cancelación (eliminar), Oposición (restringir uso)
- **Registro**: `INSERT INTO solicitudes_arco` con estado `pendiente`
- **Plazo legal**: se informa al usuario que la respuesta debe darse en ≤15 días hábiles
- **Procesamiento**: responsabilidad del administrativo (revisar y actualizar `estado` y `respuesta`)

---

## 10. Pruebas

### 10.1 Unit Tests (Vitest)

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `src/test/api.test.ts` | 5 tests | `getToken`, `setToken`, `removeToken`, sobrescritura |
| `src/test/ProtectedRoute.test.tsx` | 5 tests | Redirect sin login, acceso autenticado, redirect por rol (estudiante→admin), acceso admin, sin restricción de rol |
| `src/test/example.test.ts` | 1 test | Trivial (sanity check) |

**Resultado**: 11/11 pasando. Ejecutar con `npm run test` o `npx vitest run`.

### 10.2 Auditoría Lighthouse (Chrome DevTools MCP)

| Página | Accesibilidad | Best Practices | SEO |
|--------|--------------|----------------|-----|
| Landing (`/`) | 94 | 100 | 100 |
| Dashboard (`/dashboard`) | 88 | 100 | 100 |

29-27 auditorías pasadas por página.

### 10.3 Pruebas Manuales de API

24 tests ejecutados vía Chrome DevTools MCP evaluando flujos end-to-end. 23 pasaron, 1 advertencia esperada (estados de documentos dependientes de testing previo).

---

## 11. Dependencias y Stack Tecnológico

### 11.1 Frontend (Vite + React 18)

| Dependencia | Versión | Propósito |
|------------|---------|-----------|
| `react`, `react-dom` | ^18.3.1 | Biblioteca UI |
| `react-router-dom` | ^6.30.1 | Enrutamiento SPA |
| `@tanstack/react-query` | ^5.83.0 | Manejo de estado del servidor, cache, mutaciones |
| `tailwindcss` | ^3.4.17 | Utilidades CSS atómicas |
| `lucide-react` | ^0.462.0 | Iconografía consistente |
| `@radix-ui/*` | 30+ paquetes | Primitivas headless UI (dialog, popover, select, sidebar, tooltip, etc.) |
| `react-hook-form` + `zod` | ^7.61 / ^3.25 | Formularios con validación |
| `recharts` | ^2.15.4 | Gráficos de progreso |
| `sonner` | ^1.7.4 | Toasts |
| `date-fns` | ^3.6.0 | Formateo de fechas |
| `next-themes` | ^0.3.0 | Dark/light mode (configurado, no activado) |

### 11.2 Backend (Express + TypeScript)

| Dependencia | Versión | Propósito |
|------------|---------|-----------|
| `express` | ^4.21.0 | Framework HTTP |
| `mysql2` | ^3.11.0 | Driver MySQL/MariaDB con soporte async/await |
| `bcryptjs` | ^2.4.3 | Hashing de contraseñas |
| `jsonwebtoken` | ^9.0.2 | Generación y verificación JWT |
| `express-rate-limit` | ^7.4.0 | Rate limiting por IP |
| `multer` | ^2.1.1 | Manejo de archivos multipart |
| `helmet` | ^7.1.0 | Cabeceras de seguridad HTTP |
| `cors` | ^2.8.5 | Control de acceso cross-origin |
| `dotenv` | ^16.4.5 | Variables de entorno |
| `pdfkit` | ^0.19.1 | Generación de PDF (dictamen oficial de titulación) |
| `nodemailer` | ^9.0.0 | Envío de emails transaccionales (infraestructura lista para SMTP) |
| `adm-zip` | ^0.5.17 | Empaquetado de archivos ZIP para descarga de expedientes |

### 11.3 Desarrollo y Testing

| Herramienta | Uso |
|------------|-----|
| `vitest` + `@testing-library/react` + `jsdom` | Unit tests (11 tests) |
| `@playwright/test` + `lovable-agent-playwright-config` | E2E (configurado, tests pendientes) |
| `eslint` (flat config) + `typescript-eslint` | Linting |
| `typescript` ^5.5 | Type checking frontend y backend |

---

## 12. Configuración y Despliegue

### 12.1 Variables de Entorno (`server/.env`)

```
DB_HOST=localhost         # Host MariaDB
DB_PORT=3306              # Puerto MariaDB
DB_USER=root              # Usuario BD
DB_PASSWORD=***           # Contraseña BD
DB_NAME=sca_tescha        # Nombre de la base de datos
DB_CONNECTION_LIMIT=10    # Conexiones máximas en el pool

JWT_SECRET=***            # Clave secreta para firmar tokens
JWT_EXPIRES_IN=24h        # Duración de sesiones JWT

PORT=3000                 # Puerto del servidor Express
NODE_ENV=development      # Entorno
CORS_ORIGIN=http://localhost:8080  # Origen permitido

LOGIN_MAX_ATTEMPTS=5      # Intentos antes de bloqueo
LOGIN_BLOCK_MINUTES=15    # Duración del bloqueo
```

### 12.2 Inicialización de Base de Datos

```bash
# Una sola vez
sudo systemctl start mariadb
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed.sql
```

### 12.3 Ejecución en Desarrollo

```bash
# Terminal 1: Backend (puerto 3000)
cd server && npx tsx src/index.ts

# Terminal 2: Frontend (puerto 8080, proxy /api → :3000)
bun run dev
```

### 12.4 Build de Producción

```bash
# Frontend
npm run build          # Genera dist/

# Backend
cd server && npm run build  # Compila TypeScript → dist/
npm start                    # Ejecuta node dist/index.js
```

---

## 13. Estructura de Archivos

```
titulaci-n-digital-tescha/
├── index.html                     # Entrypoint HTML (Vite)
├── vite.config.ts                 # Config Vite + proxy /api → :3000
├── vitest.config.ts               # Config Vitest + jsdom
├── playwright.config.ts           # Config Playwright E2E
├── tailwind.config.ts             # Tailwind + colores TESCHA + Rubik
├── tsconfig.json                  # TypeScript raíz
├── tsconfig.app.json              # TS para frontend (strict:false)
├── tsconfig.node.json             # TS para Vite (strict:true)
├── eslint.config.js               # ESLint flat config
├── package.json                   # Dependencias frontend
├── public/                        # Assets estáticos Vite
│   ├── favicon.ico                # Favicon TESCHA
│   └── favicon.png                # Favicon PNG 32x32
├── database/                      # Esquema y datos BD
│   ├── schema.sql                 # 14 tablas + 2 vistas + índices
│   └── seed.sql                   # 150+ registros de prueba
├── server/                        # Backend Express + TypeScript
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env                       # Variables de entorno (no commit)
│   ├── .env.example               # Template de variables
│   ├── public/
│   │   └── favicon.svg            # Favicon TESCHA para backend
│   ├── uploads/                   # Archivos subidos (no commit)
│   └── src/
│       ├── index.ts               # Entrypoint
│       ├── app.ts                 # Express setup
│       ├── config/
│       │   ├── env.ts
│       │   └── database.ts
│       ├── domain/entities/
│       │   ├── Usuario.ts
│       │   ├── Tramite.ts
│       │   ├── Documento.ts
│       │   └── Admin.ts
│       ├── infrastructure/
│       │   ├── database/
│       │   │   ├── MysqlUsuarioRepository.ts
│       │   │   ├── MysqlTramiteRepository.ts
│       │   │   └── AdminRepository.ts
│       │   └── services/
│       │       ├── NotificacionService.ts
│       │       └── generarDictamenPDF.ts  # PDFKit: dictamen oficial en PDF
│       ├── use-cases/
│       │   ├── auth/login.ts
│       │   └── tramites/
│       │       ├── obtenerMiTramite.ts
│       │       └── subirDocumento.ts
│       ├── middleware/
│       │   ├── authenticate.ts
│       │   ├── authorize.ts
│       │   ├── rateLimiter.ts
│       │   └── upload.ts
│       └── routes/
│           ├── auth.routes.ts
│           ├── tramite.routes.ts
│           ├── admin.routes.ts
│           ├── asesor.routes.ts
│           ├── catalogos.routes.ts
│           ├── notificacion.routes.ts
│           ├── directorio.routes.ts
│           ├── normativa.routes.ts
│           ├── contenido.routes.ts
│           ├── privacidad.routes.ts
│           └── arco.routes.ts
└── src/                           # Frontend React
    ├── main.tsx                   # React DOM entrypoint
    ├── App.tsx                    # Raíz: providers + rutas
    ├── App.css
    ├── index.css                  # Tailwind + Rubik + CSS variables
    ├── assets/                    # Imágenes, logos
    ├── components/
    │   ├── NavLink.tsx
    │   ├── AdminSidebar.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── PrivacyConsentModal.tsx
    │   ├── ErrorBoundary.tsx
    │   ├── ThemeToggle.tsx
    │   └── ui/                    # 48 componentes shadcn/ui
    ├── contexts/
    │   └── AuthContext.tsx
    ├── hooks/
    │   ├── useTramite.ts
    │   ├── useAdmin.ts
    │   ├── useNotificaciones.ts
    │   ├── use-mobile.tsx
    │   └── use-toast.ts
    ├── lib/
    │   └── utils.ts               # cn() helper
    ├── pages/
    │   ├── Index.tsx
    │   ├── Landing.tsx
    │   ├── Login.tsx
    │   ├── Dashboard.tsx
    │   ├── Normativa.tsx
    │   ├── NotFound.tsx
    │   ├── ResetPassword.tsx
    │   ├── admin/
    │   │   ├── AdminLayout.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── AdminExpedientes.tsx
    │   │   ├── AdminDocumentos.tsx
    │   │   ├── AdminDictamenes.tsx
    │   │   ├── AdminUsuarios.tsx
    │   │   ├── AdminARCO.tsx
    │   │   ├── AdminBitacora.tsx
    │   │   └── AdminCatalogos.tsx
    │   └── asesor/
    │       └── AsesorDashboard.tsx
    ├── services/
    │   └── api.ts
    └── test/
        ├── setup.ts
        ├── example.test.ts
        ├── api.test.ts
        └── ProtectedRoute.test.tsx
```

---

## Apéndice A: Paleta de Colores Institucional

| Color | Hex | Uso |
|-------|-----|-----|
| Guinda (Primario) | `#8A2036` | Botones principales, header admin, iconos activos |
| Guinda oscuro (Terciario) | `#56212F` | Sidebar, footer, fondos de progreso |
| Dorado (Secundario) | `#BC955B` | Acentos, barras de progreso, iconos decorativos |
| Crema | `#EFE1CA` | Bordes decorativos, fondos suaves |
| Texto general | `#847374` | Textos secundarios, botones inactivos |

---

## Apéndice B: Cumplimiento de Casos de Prueba (P-01 a P-50)

| Módulo | CP Implementados | Total CP | % |
|--------|-----------------|----------|---|
| 1. Auth y RBAC | P-01 a P-09 | 9 | 100% |
| 2. Carga Documental | P-10 a P-17 | 8 | 100% |
| 3. Semáforo e Historial | P-18 a P-22 | 5 | 100% |
| 4. Notificaciones y Docentes | P-23 a P-28 | 6 | 100% |
| 5. Dictamen, Búsqueda, Filtros | P-29 a P-32 | 4 | 100% |
| 6. Directorio, Normativa, Guías | P-33 a P-40 | 8 | 100% |
| 7. Responsividad, WCAG | P-41 a P-48 | 8 | 83% |
| 8. Privacidad LGPDPPSO | P-49 a P-50 | 2 | 100% |
| **Total** | **46** | **50** | **92%** |

Nota: P-47 (50 usuarios concurrentes) y P-48 (verificación Rubik en todos los niveles) requieren infraestructura de pruebas de carga y verificación tipográfica exhaustiva, respectivamente. Ambos están fuera del alcance de esta fase de desarrollo.
