# Documentación Técnica Completa

## Sistema de Control y Administración de Titulación ISC

**Tecnológico de Estudios Superiores de Chalco (TESCHA)**
**División de Ingeniería en Sistemas Computacionales**

Estado documentado: aplicación Laravel 13 + Inertia (React / TypeScript), rama `feat/laravel-migration`.

---

## Índice

1. [Visión general](#1-visión-general)
2. [Arquitectura](#2-arquitectura)
3. [Base de datos](#3-base-de-datos)
4. [Backend](#4-backend)
5. [Frontend](#5-frontend)
6. [Catálogo de rutas](#6-catálogo-de-rutas)
7. [Flujos de negocio](#7-flujos-de-negocio)
8. [Pruebas](#8-pruebas)
9. [Operación y despliegue local](#9-operación-y-despliegue-local)
10. [Decisiones de diseño y comportamientos heredados](#10-decisiones-de-diseño-y-comportamientos-heredados)
11. [Historial / migración desde Express](#11-historial--migración-desde-express)

---

## 1. Visión general

### 1.1 Propósito

El SCA-ISC es una plataforma web que digitaliza el proceso de titulación de los egresados de Ingeniería en Sistemas Computacionales del TESCHA. Coordina a tres actores: **estudiantes** (cargan documentos y dan seguimiento), **asesores** (revisan los documentos de sus estudiantes asignados) y **administrativos** (validan expedientes, emiten dictámenes y gestionan usuarios y catálogos).

### 1.2 Problema que resuelve

El trámite tradicional exige varias visitas presenciales, expedientes físicos propensos a errores, fotografías rechazadas por incumplir la normativa y comunicación asíncrona que genera incertidumbre. El sistema concentra en una sola plataforma la carga documental con validación automática, un semáforo de estatus, notificaciones y la normativa vigente, de modo que las visitas presenciales se reduzcan al mínimo.

### 1.3 Roles

| Rol (`usuarios.rol`) | Página de inicio | Qué hace |
|---|---|---|
| `estudiante` | `/dashboard` | Ve su trámite, sube documentos, consulta el historial y su dictamen (con PDF), crea solicitudes ARCO. |
| `asesor` | `/asesor` | Ve los estudiantes en los que tiene alguna asignación y revisa (aprueba o rechaza) sus documentos. |
| `administrativo` | `/admin` | Gestiona expedientes, documentos, dictámenes, usuarios, asignaciones, catálogos, solicitudes ARCO y consulta la bitácora. |

La ruta de inicio por rol la decide `Usuario::homePath()`.

### 1.4 Alcance funcional

| Módulo | Funcionalidades |
|---|---|
| Autenticación | Sesión de Laravel, acceso con número de control, bloqueo por intentos fallidos, recuperación de contraseña con token. |
| Expediente digital | Carga por tipo de documento con validación de formato, tamaño, PDF íntegro y prerrequisitos. |
| Semáforo y trazabilidad | Porcentaje de avance, semáforo rojo/ámbar/verde (vista SQL) y línea de tiempo (`historial_estados`). |
| Panel administrativo | Métricas, listado y detalle de expedientes (con cancelación/reactivación), revisión de documentos, dictámenes con PDF, exportación CSV y descarga ZIP. |
| Panel del asesor | Lista de estudiantes asignados y revisión de documentos. |
| Notificaciones | Campana in-app con conteo de no leídas y copia por correo para los tipos `email` y `ambos`. |
| Contenido informativo | Normativa filtrable por modalidad, directorio institucional, requisitos de fotografía. Lectura pública. |
| Privacidad | Aviso de privacidad con consentimiento registrado, solicitudes ARCO y su atención por administración. |
| Gestión de usuarios | Alta, edición, activación/desactivación y baja; asignación de asesor, sinodal o revisor; control de carga docente. |
| Catálogos | CRUD de opciones de titulación, tipos de documento, normativa y directorio. |
| Auditoría | Bitácora paginada de revisiones de documentos y dictámenes. |
| Interfaz | Modo claro/oscuro, `ErrorBoundary` global, notificaciones tipo toast. |

---

## 2. Arquitectura

### 2.1 Monolito Laravel + Inertia

La aplicación es un único proyecto Laravel (raíz del repositorio). Laravel responde cada petición web; las pantallas son componentes React que Inertia monta con las *props* que entrega el controlador. No hay una API separada ni un SPA que consuma `/api`.

```
 Navegador
    |  1ª visita: GET /admin/expedientes  (HTML con <div data-page="...">)
    |  siguientes: XHR con cabecera X-Inertia (respuesta JSON con component + props)
    v
 routes/web.php, routes/auth.php
    v
 Middleware: web (sesión, CSRF) -> auth -> role:<rol> -> HandleInertiaRequests
    v
 Controller  --->  FormRequest (validación)
    |         --->  Gate/Policy (autorización por recurso)
    |         --->  Action (escritura transaccional)  /  Service (lectura y utilidades)
    v                         v
 Inertia::render('Pagina', props)      Eloquent / Query Builder -> MariaDB
    o  JSON plano  o  redirect()->back()->with('success', ...)
```

### 2.2 Ciclo de una petición

1. `bootstrap/app.php` registra las rutas web, el endpoint de salud `/up` y el alias de middleware `role`.
2. Las rutas protegidas pasan por `auth` (sin sesión: redirección a `/login`, o 401 si el cliente espera JSON) y por `role:...` (`EnsureRole`): con rol no permitido, 403.
3. `HandleInertiaRequests` comparte en cada respuesta `auth.user`, `auth.consentimiento` y `flash.success`.
4. El controlador valida con un `FormRequest`, autoriza con una Policy cuando el recurso tiene dueño y delega la escritura en una Action o en un Service.
5. La respuesta depende del cliente (ver 2.5): página Inertia, JSON o redirección con mensaje flash.
6. Un 404 de navegador renderiza la página Inertia `NotFound`; una petición que espera JSON recibe JSON.

### 2.3 Justificación

- **Un solo despliegue y una sola sesión.** Se elimina la gestión de tokens en el cliente, CORS y el proxy de desarrollo.
- **Validación y autorización en el servidor.** Cada regla de negocio vive en una Action o Policy comprobable por pruebas de funcionalidad.
- **Base de datos relacional.** Las relaciones usuario, trámite, documentos, asignaciones y dictamen exigen integridad referencial; parte de la lógica (semáforo, carga docente) vive en vistas SQL.
- **Inertia.** Conserva la experiencia de navegación sin recarga sin mantener una capa REST paralela.

### 2.4 Mapa de directorios

```
app/
  Actions/{Admin,Documentos,Tramites}   Casos de uso de escritura (una clase, un método execute/approve/reject)
  Services/ (+ Admin/)                  Lectura, utilidades y servicios transversales
  Policies/                             TramitePolicy, DocumentoPolicy
  Http/
    Controllers/{Admin,Asesor,Estudiante,Auth,Public}  + NotificacionController, PrivacidadController, SolicitudArcoController
    Controllers/Concerns/RespondsInertiaOrJson.php
    Middleware/                         EnsureRole, HandleInertiaRequests
    Requests/{Admin,Arco,Auth,Estudiante,Review}       FormRequests
  Models/                               17 modelos Eloquent (15 tablas + 2 vistas)
  Mail/                                 NotificacionMail, ResetPasswordMail
  Support/                              ServerUploadLimit, StoredUploadPath
  Contracts/                            DictamenPdfRenderer
  Console/Commands/                     ScaTestDb (sca:test-db)
bootstrap/app.php                       Middleware, excepciones, salud
config/                                 auth (bloqueo), hashing, session, filesystems, mail, database, ...
database/{migrations,seeders}           Migración base y seeders de demostración
resources/
  js/                                   Aplicación React (ver 2.6 y sección 5)
  css/app.css                           Tokens de tema (variables CSS) y Tailwind
  views/{app,mail,pdf}.blade.php        Plantilla raíz de Inertia, correos y PDF del dictamen
routes/{web,auth,console}.php
scripts/demo.sh                         Entorno de demostración local
tests/{Feature,Unit}                    Pruebas (sección 8)
```

### 2.5 Inertia frente a JSON: `RespondsInertiaOrJson`

Los endpoints nacieron como JSON y ahora alimentan también las páginas. El *trait* `RespondsInertiaOrJson` (`app/Http/Controllers/Concerns`) resuelve la dualidad con una regla:

- `wantsPlainJson($request)` es verdadero si el cliente acepta JSON y **no** envía `X-Inertia`.
- `mutated($request, $mensaje, $extra)` responde `{"message": ...} + $extra` a un cliente JSON plano y `back()->with('success', $mensaje)` a una visita Inertia.

Resultado por tipo de endpoint:

| Tipo | Navegador (Inertia) | Cliente JSON plano |
|---|---|---|
| Páginas con datos (p. ej. `/admin/expedientes`, `/admin/usuarios`, `/admin/bitacora`, `/asesor`) | Página Inertia con props | Mismo payload en JSON |
| Mutaciones (`PUT`, `POST`, `DELETE`) | Redirección atrás con `flash.success` | `{"message": ...}` |
| Solo JSON (notificaciones, directorio, consentimiento, ARCO propio, catálogos `GET`, `admin/stats`, `admin/docentes`, `asesor/expedientes/{id}`) | Se consumen con `lib/http.ts` | JSON |
| Archivos (PDF, CSV, ZIP, documento subido) | Respuesta binaria | Respuesta binaria |

Errores de validación: en visitas Inertia llegan como *error bag* de la página; en JSON, como 422 con la clave `message` y `errors`.

### 2.6 Estructura de `resources/js`

```
resources/js/
  app.tsx                    createInertiaApp: resuelve Pages/**, ThemeProvider (next-themes), layout AppShell por defecto
  Pages/                     Una pantalla por archivo (sección 5.1)
  components/
    AppShell.tsx             Toaster, flash, modal de privacidad, ErrorBoundary
    ErrorBoundary.tsx, PrivacyConsentModal.tsx, ThemeToggle.tsx
    admin/                   AdminLayout, RechazoModal, ExpedienteDocumentos, useExpedienteDetalle, adminToasts, documentoBadge
    ui/                      48 archivos de shadcn/ui (generados)
  hooks/                     useNotificaciones, use-toast, use-mobile
  lib/                       http.ts (fetch JSON), utils.ts
  types/                     Tipos de props (tramite, admin, PageProps)
  assets/                    Logotipos y banner
```

El alias `@` apunta a `resources/js`.

---

## 3. Base de datos

### 3.1 Esquema

El esquema `sca_tescha` (MariaDB/MySQL) lo crea la migración `database/migrations/2026_01_01_000000_create_sca_baseline_schema.php` con DDL nativo: **15 tablas y 2 vistas**. No funciona con SQLite.

#### Catálogos

| Tabla | Propósito | Campos clave |
|---|---|---|
| `opciones_titulacion` | Modalidades de titulación | `nombre` (único), `fecha_limite`, `activo` |
| `tipos_documento` | Documentos requeridos | `opcion_titulacion_id` (NULL = todas), `obligatorio`, `prerrequisito_id` (autorreferencia), `formato_permitido`, `tamaño_max_mb`, `orden`, `activo` |
| `normativa` | Lineamientos institucionales | `titulo`, `contenido`, `categoria`, `modalidad_id`, `orden`, `activo` |
| `directorio` | Contactos | `nombre`, `cargo`, `departamento`, `email`, `telefono`, `extension`, `orden`, `activo` |
| `requisitos_fotografia` | Requisitos de la fotografía | `descripcion`, `orden`, `activo` |

#### Entidades principales

| Tabla | Propósito | Campos clave |
|---|---|---|
| `usuarios` | Todos los actores | `numero_control` (único), `email` (único), `password_hash`, `rol` (`estudiante`/`asesor`/`administrativo`), `activo`, `intentos_fallidos`, `bloqueado_hasta`, `grado_academico`, `carga_maxima` (5 por defecto), `programa_academico`, `reset_token`, `reset_expira` |
| `tramites` | Expediente de un estudiante | `usuario_id`, `opcion_titulacion_id`, `estatus` (`en_proceso`/`en_revision`/`aprobado`/`rechazado`/`completado`), `titulo_proyecto`, `fecha_inicio`, `fecha_fin`, `activo` |
| `documentos` | Archivo por tipo y trámite | `archivo_url`, `archivo_nombre`, `archivo_tamaño`, `estatus` (`pendiente`/`cargado`/`en_revision`/`aprobado`/`rechazado`), `revisado_por`, `motivo_rechazo`; único (`tramite_id`, `tipo_documento_id`) |
| `asignaciones` | Docentes asignados a un trámite | `rol_asignacion` (`asesor`/`sinodal`/`revisor`), `activo`; único (`tramite_id`, `usuario_id`, `rol_asignacion`) |
| `dictamenes` | Resultado oficial | `tramite_id` **único**, `resultado` (`aprobado`/`rechazado`), `observaciones`, `emitido_por`, `fecha_emision` |

#### Trazabilidad y auditoría

| Tabla | Propósito | Campos clave |
|---|---|---|
| `historial_estados` | Línea de tiempo | `tramite_id`, `documento_id` (nullable), `estado_anterior`, `estado_nuevo`, `comentario`, `usuario_id` |
| `bitacora` | Auditoría | `usuario_id`, `accion`, `entidad`, `entidad_id`, `detalle` (JSON), `ip_origen`, `user_agent`, `fecha` |

#### Comunicación y privacidad

| Tabla | Propósito | Campos clave |
|---|---|---|
| `notificaciones` | Alertas in-app y copia por correo | `usuario_id`, `tipo` (`in_app`/`email`/`ambos`), `titulo`, `mensaje`, `leida`, `tramite_id` |
| `consentimientos` | Aceptación del aviso de privacidad | `usuario_id`, `version_aviso`, `ip_origen`, `user_agent`, `fecha_consentimiento` |
| `solicitudes_arco` | Derechos ARCO | `tipo` (`acceso`/`rectificacion`/`cancelacion`/`oposicion`), `estado` (`pendiente`/`en_proceso`/`completada`/`rechazada`), `detalle_solicitud`, `respuesta`, `atendido_por`, `fecha_resolucion` |

### 3.2 Vistas

| Vista | Propósito | Columnas |
|---|---|---|
| `vw_carga_docente` | Carga de cada asesor activo | `docente_id`, `numero_control`, `nombre_completo`, `carga_maxima`, `carga_actual` (asignaciones activas, sea cual sea su rol) |
| `vw_progreso_tramite` | Progreso y semáforo por trámite | `tramite_id`, `usuario_id`, `estatus_tramite`, `total_documentos`, `docs_aprobados/rechazados/cargados/en_revision/pendientes`, `color_semaforo`, `porcentaje_avance` (con un decimal) |

Regla del semáforo en la vista: **rojo** si hay algún documento rechazado; **ámbar** si hay documentos pendientes, cargados o en revisión; **verde** si todos los documentos existentes están aprobados. Los modelos `VwCargaDocente` y `VwProgresoTramite` leen las vistas.

### 3.3 Relaciones clave

```
usuarios (estudiante) --1:N--> tramites --1:N--> documentos --N:1--> tipos_documento
                                  |
                                  +--1:N--> asignaciones --N:1--> usuarios (docente)
                                  +--1:N--> historial_estados
                                  +--1:1--> dictamenes --N:1--> usuarios (admin)
                                  +--1:1--> vw_progreso_tramite (solo lectura)
```

Las claves foráneas definen el comportamiento de borrado: eliminar un usuario elimina en cascada sus trámites, documentos, asignaciones, notificaciones, consentimientos y solicitudes ARCO; `dictamenes.emitido_por` y `tramites.opcion_titulacion_id` son `RESTRICT`; `revisado_por`, `atendido_por` y `usuario_id` de bitácora/historial pasan a `NULL`.

### 3.4 Justificación del diseño

- **Una tabla `usuarios` con `rol`.** Simplifica el login y la autorización; los campos de docente (`grado_academico`, `carga_maxima`) son nulos en otros roles.
- **Prerrequisitos en `tipos_documento`.** La autorreferencia `prerrequisito_id` modela la regla de carga secuencial (por ejemplo, la solicitud exige el certificado aprobado). El servidor la valida antes de aceptar un archivo.
- **Bitácora con JSON.** `detalle` guarda metadatos variables (tipo de documento, motivo de rechazo, resultado del dictamen) sin tablas auxiliares.
- **Vistas en lugar de lógica duplicada.** El semáforo y la carga docente se calculan una vez en SQL y los consume cualquier pantalla.

### 3.5 Migración adoptable

La migración base está pensada para adoptar bases existentes: `up()` no hace nada si la tabla `usuarios` ya existe, de modo que `php artisan migrate` sobre una base `sca_tescha` previa solo registra la migración sin tocar sus tablas. `down()` se niega a ejecutarse salvo que la base termine en `_test`.

### 3.6 Seeders y datos de demostración

`php artisan migrate --seed` ejecuta `DatabaseSeeder`, que llama en orden a `CatalogoSeeder`, `UsuarioSeeder`, `TramiteSeeder` y `TrazabilidadSeeder` (todos con `insertOrIgnore`).

| Seeder | Contenido |
|---|---|
| `CatalogoSeeder` | 5 opciones de titulación, 11 tipos de documento, 6 normas, 6 contactos, 12 requisitos de fotografía |
| `UsuarioSeeder` | 13 usuarios: 5 estudiantes (`2021-0001` a `2021-0005`), 6 asesores (`DOC-0001` a `DOC-0006`), 2 administrativos (`ADM-0001`, `ADM-0002`) |
| `TramiteSeeder` | 5 trámites en distintos estados, 34 documentos y 9 asignaciones |
| `TrazabilidadSeeder` | 11 registros de historial, 7 notificaciones y 8 de bitácora |

La contraseña de todos los usuarios de demostración es `Demo1234!` (hashes `$2b$12$...`). Deben reemplazarse antes de producción.

### 3.7 Regla de la base de pruebas

Las pruebas solo pueden correr contra `sca_tescha_test`. `tests/TestCase.php` aborta con `RuntimeException` si la base conectada tiene otro nombre, y `sca:test-db` (`ScaTestDb`) solo ejecuta `migrate:fresh --seed` sobre bases cuyo nombre termina en `_test`. Ver sección 8.

---

## 4. Backend

### 4.1 Autenticación

- **Sesión de Laravel** con un único *guard* `web` y el proveedor Eloquent `App\Models\Usuario`. No existen JWT ni tokens de API.
- **Identificador de acceso: `numero_control`**, no el correo. `LoginRequest` exige `numero_control` y `password`.
- **Hash de contraseña**: `Hash::make` (bcrypt, 12 rondas por defecto; `BCRYPT_ROUNDS`). Los hashes heredados de Node tienen el prefijo `$2b$`; la verificación estricta de algoritmo de Laravel (`bcrypt.verify`) está desactivada por defecto (`HASH_VERIFY=false`) para que `password_verify()` los acepte.
- **Sin "recordarme"**: la tabla no tiene `remember_token`; `Usuario` anula los métodos correspondientes.
- **Inicio de sesión** (`AuthenticatedSessionController@store` + `LoginAttemptService`): rechaza usuarios inexistentes o inactivos con el mismo mensaje genérico; regenera la sesión al entrar y redirige al destino previsto o a `homePath()`.
- **Bloqueo por intentos fallidos**: tras 5 intentos fallidos (`LOGIN_MAX_ATTEMPTS`) la cuenta se bloquea 15 minutos (`LOGIN_BLOCK_MINUTES`) mediante `usuarios.intentos_fallidos` y `bloqueado_hasta`, usando el reloj de la base (`NOW()`). Un bloqueo vencido se limpia en el siguiente intento; un acceso correcto reinicia el contador. Los mensajes informan los intentos restantes.
- **Límite por IP**: `throttle:30,15` en `POST /login` como capa adicional; el bloqueo por cuenta es el mecanismo principal.
- **Cierre de sesión**: `POST /logout` invalida la sesión y regenera el token CSRF.

#### Recuperación de contraseña

1. `POST /forgot-password` (`throttle:10,1`) recibe el número de control. Si existe un usuario activo, genera un token aleatorio de 32 bytes (hex), **guarda solo su SHA-256** en `reset_token`, fija `reset_expira` a una hora y envía `ResetPasswordMail` con el enlace `/reset-password/{token}`.
2. La respuesta es la misma exista o no la cuenta ("Si el número de control existe, recibirás un correo...").
3. `POST /reset-password` busca por el hash del token, vigencia y usuario activo; exige contraseña de al menos 8 caracteres con confirmación; guarda el nuevo hash, borra el token y reinicia el bloqueo.
4. `GET /forgot-password` redirige al login: la recuperación vive en un modal de la página de acceso.

### 4.2 Autorización

- **Middleware `role:`** (`EnsureRole`): acepta uno o varios roles (`role:asesor,administrativo`). Las rutas agrupadas por área lo declaran una sola vez.
- **Policies** (registradas en `AppServiceProvider`):

| Policy | Método | Regla |
|---|---|---|
| `TramitePolicy` | `view`, `uploadDocument` | El estudiante solo accede a su propio trámite |
| `TramitePolicy` | `viewAsAsesor` | El asesor solo ve trámites en los que tiene una asignación (de cualquier rol de asignación) |
| `DocumentoPolicy` | `view` | El administrativo ve cualquier documento; el estudiante solo los de su trámite |
| `DocumentoPolicy` | `review` | El administrativo revisa cualquier documento; el asesor solo los de trámites donde está asignado |

- Los controladores invocan `Gate::authorize(...)`; un recurso ajeno responde 403 o 404 según el caso (el trámite inexistente o inactivo es 404).

### 4.3 Privacidad y consentimiento

- `HandleInertiaRequests` comparte `auth.consentimiento` (verdadero si el usuario tiene al menos un registro en `consentimientos`).
- Mientras sea falso, `PrivacyConsentModal` cubre la pantalla con el aviso de privacidad; al aceptar, `POST /privacidad/consentimiento` crea el registro con `version_aviso = '1.0'`, IP y *user agent*, y se recarga solo la prop `auth`.
- `GET /privacidad/consentimiento` devuelve `{consentido, version, fecha}`.
- La versión no se compara al decidir si se muestra el modal: un único registro basta. Cambiar `VERSION_AVISO` no vuelve a pedir consentimiento por sí solo.
- Las **solicitudes ARCO** (`/solicitudes-arco`) están disponibles para cualquier rol autenticado; la interfaz de creación existe en el panel del estudiante. La atención por administración se describe en 7.5.

### 4.4 Validación (FormRequests)

| FormRequest | Uso |
|---|---|
| `Auth\LoginRequest` | `numero_control` y `password` requeridos |
| `Estudiante\UploadDocumentoRequest` | Autoriza (`Gate uploadDocument`, trámite activo), `archivo` requerido hasta 20 MB y `tipo_documento_id`; sustituye el mensaje por el de `ServerUploadLimit` si PHP rechazó el archivo |
| `Review\RejectDocumentoRequest` | `motivo` requerido |
| `Admin\StoreUsuarioRequest` / `UpdateUsuarioRequest` | Alta y edición de usuarios, unicidad de `numero_control` y `email` |
| `Admin\UpdateExpedienteRequest` | `opcion_titulacion_id` y `titulo_proyecto` |
| `Admin\ListExpedientesRequest` | `search`, `estatus`, `activo` (0/1), paginación (límite 1 a 100, 20 por defecto) |
| `Admin\StoreAsignacionRequest` / `ReplaceAsesorRequest` | Asignaciones; `usuario_id` debe estar presente en el reemplazo (`null` quita al asesor) |
| `Admin\StoreDictamenRequest` | `tramite_id`, `resultado` (`aprobado`/`rechazado`), `observaciones` |
| `Admin\CatalogoRequest` | Reglas según el catálogo de la ruta |
| `Admin\ResolveSolicitudArcoRequest` | `estado` (`en_proceso`/`completada`/`rechazada`) y `respuesta` |
| `Arco\StoreSolicitudArcoRequest` | `tipo` válido y `detalle` opcional |

Los mensajes de validación están en español y conservan los textos del sistema anterior.

### 4.5 Actions (escritura)

| Action | Responsabilidad |
|---|---|
| `Tramites\UploadDocumento` | Valida tipo activo y aplicable, prerrequisito aprobado, formato por contenido (MIME real), tamaño por tipo y cabecera `%PDF`; bloquea reemplazo de documentos aprobados o en revisión; guarda el archivo, actualiza o crea el documento (`cargado`) y registra historial, todo en transacción (borra el archivo si la transacción falla). |
| `Documentos\ReviewDocumento` | `approve` y `reject` compartidos por asesor y administrativo: cambia el estatus, registra historial, crea notificación `ambos`, escribe bitácora y recalcula el estatus del trámite. |
| `Admin\EmitirDictamen` | Valida trámite activo, un solo dictamen por trámite y documentos obligatorios aprobados; crea el dictamen, actualiza el trámite (`completado` o `rechazado`, `fecha_fin`), notifica, audita y registra historial. |
| `Admin\CreateUsuario` | Crea el usuario; si es estudiante, abre su trámite con un documento `pendiente` por cada tipo aplicable y asigna al asesor indicado si tiene cupo. |
| `Admin\CreateAsignacion` | Crea la asignación (idempotente) aplicando la regla de carga máxima del docente. |
| `Admin\ReplaceAsesorAsignacion` | Sustituye (o retira) al asesor de un trámite en una transacción; no toca sinodales ni revisores. |

### 4.6 Services (lectura y utilidades)

| Service | Responsabilidad |
|---|---|
| `TramiteReadService` | Trámite activo del estudiante, detalle con documentos, bloqueos por prerrequisito, asignaciones, dictamen y progreso; historial |
| `AsesorReadService` | Estudiantes asignados a un asesor con avance y semáforo |
| `Admin\ExpedienteService` | Listado paginado (con `activo`), detalle, actualización, cancelar/reactivar |
| `Admin\ExpedienteExporter` | Exportación CSV y descarga ZIP del expediente |
| `Admin\UsuarioService` | Listado, detalle, activar/desactivar, edición, baja, docentes y opciones |
| `Admin\CatalogoService` | CRUD genérico de los cuatro catálogos |
| `Admin\AdminStatsService` | Métricas del panel general |
| `BitacoraService` | Registro y paginación de la bitácora |
| `NotificacionService` | Crear (con correo opcional), listar, marcar leída |
| `SolicitudArcoService` | Crear, listar y resolver solicitudes ARCO |
| `PublicContentService` | Normativa, directorio y requisitos de fotografía |
| `LoginAttemptService` | Verificación de credenciales con bloqueo |
| `DompdfDictamenPdfRenderer` | Implementación del contrato `DictamenPdfRenderer` |

### 4.7 Archivos y almacenamiento

- Los documentos se guardan en el disco `uploads` (`App\Support\Uploads::disk()`), elegido con `UPLOADS_DISK`: `local` (por defecto, `storage/app/private`, privado), `r2` (Cloudflare R2, recomendado, variables `R2_*`) o `s3` (genérico compatible con S3: AWS, Backblaze B2, DigitalOcean Spaces, MinIO; variables `AWS_*`, convención del SDK sin necesidad de cuenta AWS); ambos con el driver `s3` del paquete `league/flysystem-aws-s3-v3`. Las variantes se construyen en `App\Support\UploadsDiskConfig` (llamada desde `config/filesystems.php`, que además define el disco `r2` como destino de `sca:uploads-copy --to=r2`). **Nunca en `public/`** y nunca con URLs públicas o prefirmadas: solo se sirven por controlador, con autorización, en streaming (`InlineDocumentResponse`). El ZIP de expediente copia cada objeto por flujo a un temporal antes de comprimirlo y lo borra después.
- `php artisan sca:uploads-test` diagnostica el disco `uploads`: imprime la configuración efectiva (proveedor `local`/`s3`/`r2`; sin secreto; clave y Account ID de R2 enmascarados, solo el host del endpoint, opciones de checksum) y hace put, lectura, exists, delete y comprobación de un objeto temporal en `uploads/_healthcheck/`, con pistas en español para errores comunes (con `r2` nombran las variables `R2_*` y detecta antes de conectar las que faltan); sale con 1 si algún paso falla. El disco `s3` fija `request_checksum_calculation` y `response_checksum_validation` en `when_required` (el SDK >= 3.337 envía CRC32 por defecto y algunos servicios compatibles lo rechazan); `AWS_ENDPOINT` vacío equivale a AWS S3 (variante `s3`).
- `php artisan sca:uploads-copy {--from=local} {--to=} {--dry-run} {--delete-source}` copia los archivos referenciados por `documentos.archivo_url` entre discos (omite los ya presentes con el mismo tamaño, verifica el tamaño, nunca borra el origen salvo `--delete-source` tras verificar; sale con 1 si algo falló).
- Las pruebas fuerzan el disco `uploads` local; `tests/Feature/RealS3ProtocolTest.php` es opt-in (`SCA_TEST_REAL_S3=1` con `UPLOADS_DISK=r2`/`s3` y un MinIO desechable) y se omite por defecto.
- Convención de ruta: `uploads/{tramite_id}/<epoch_ms>_<nombre_sanitizado>`; el nombre se limpia con `[^a-zA-Z0-9._-]` a `_`. `documentos.archivo_url` guarda esa ruta relativa y `archivo_nombre` el nombre original.
- `StoredUploadPath::resolve()` rechaza rutas con `..` o absolutas, y trata un nombre sin `/` como `uploads/<nombre>` (compatibilidad con valores heredados).
- **Visualización**: `GET /tramites/{tramite}/documentos/{documento}` (estudiante) y `GET /admin/tramites/{tramite}/documentos/{documento}` (administrativo) usan el mismo controlador; responden en línea con `Content-Type` según la extensión (`pdf`, `jpg`, `jpeg`, `png`, `webp`) y `scopeBindings` garantiza que el documento pertenezca al trámite. Un asesor no tiene ruta para abrir archivos.
- **Límites de subida**: tope fijo de 20 MB en `UploadDocumentoRequest`, límite por tipo en `tipos_documento.tamaño_max_mb` (10 MB por defecto) y los límites de PHP.
- **`ServerUploadLimit`**: PHP descarta silenciosamente un archivo que excede `upload_max_filesize` o `post_max_size`, lo cual aparecería como "no se recibió ningún archivo". La clase detecta ambos casos (`UPLOAD_ERR_INI_SIZE`/`FORM_SIZE` y `Content-Length` mayor a `post_max_size` sin archivo) y devuelve un mensaje con el límite real del servidor. `bootstrap/app.php` aplica lo mismo a `PostTooLargeException` (422 con `errors.archivo`).

### 4.8 PDF del dictamen

- Contrato `App\Contracts\DictamenPdfRenderer::render(Dictamen): Response`, enlazado en `AppServiceProvider` a `DompdfDictamenPdfRenderer` (paquete `barryvdh/laravel-dompdf`).
- La vista `resources/views/pdf/dictamen.blade.php` dibuja el documento en tamaño carta con posiciones absolutas y colores institucionales; muestra alumno, número de control, opción de titulación, fecha de emisión, resultado y observaciones.
- Se entrega como `dictamen_<numero_control>.pdf`. Rutas: `GET /tramites/mi-dictamen/pdf` (último dictamen del estudiante; 404 si no hay) y `GET /admin/dictamenes/{tramite}/pdf`.

### 4.9 Correo y notificaciones

- `NotificacionService::create()` inserta siempre la fila in-app y, si `tipo` es `email` o `ambos`, envía `NotificacionMail` (asunto = título). Un fallo de correo se registra en el log (solo dominio del destinatario, mensaje sin direcciones) con `App\Support\MailFailure` pero **no interrumpe** la operación; lo mismo en la recuperación de contraseña. El envío es síncrono.
- La campana (`useNotificaciones`) consulta `GET /notificaciones` cada 30 segundos; el listado devuelve las últimas 50 notificaciones del usuario y `noLeidas`.
- `ResetPasswordMail` envía el enlace de recuperación. Con `MAIL_MAILER=log` (valor por defecto) los correos se escriben en el log; en producción debe configurarse SMTP.
- **Plantillas**: `resources/views/mail/layout.blade.php` (600 px, solo claro, tablas con CSS en línea, cabecera grafito con el texto «SCA-TESCHA», sin imágenes remotas) la comparten `reset-password`, `notificacion` y `test`; cada Mailable tiene además versión de texto plano en `resources/views/mail/text/`.
- **`MAIL_ALWAYS_TO`**: si es una dirección válida, el listener `RedirectOutgoingMail` (evento `MessageSending`, registrado en `AppServiceProvider`) entrega todo correo a esa dirección, quita Cc/Cco, antepone `[Para: original]` al asunto y conserva el destinatario en `X-Original-To`. (`Mail::alwaysTo()` de Laravel descarta los originales, por eso no se usa.)
- **Configuración SMTP** (Laravel 13): `MAIL_SCHEME` (`smtp` = STARTTLS si el servidor lo ofrece, `smtps` = SSL; sin valor, el puerto 465 usa `smtps`), `MAIL_TIMEOUT` (10 s por defecto), remitente `MAIL_FROM_ADDRESS`/`MAIL_FROM_NAME` (por defecto `SCA-TESCHA`).
- **Diagnóstico**: `php artisan sca:mail-test {email}` (`ScaMailTest`) imprime la configuración efectiva sin contraseña, rechaza direcciones inválidas, envía `TestMail` y devuelve código 1 si falla. Pruebas en `tests/Feature/Mail/MailDeliveryTest.php`.

### 4.10 Exportación CSV y ZIP

- `GET /admin/expedientes/export`: CSV UTF-8 con BOM (`expedientes.csv`), filtros `search` y `estatus`, hasta 10 000 filas; columnas Matrícula, Estudiante, Opción Titulación, Avance, Estado, Docs Aprobados, Docs Rechazados, Última Actualización. Solo incluye expedientes activos.
- `GET /admin/expedientes/{tramite}/descargar`: ZIP `expediente_{id}.zip` con los archivos existentes del trámite; omite archivos faltantes en disco y antepone el id del documento si dos nombres chocan. Sin documentos con archivo, responde 404.

### 4.11 Límites de tasa

| Ruta | Límite |
|---|---|
| `POST /login` | `throttle:30,15` (30 por 15 minutos) |
| `POST /forgot-password` | `throttle:10,1` (10 por minuto) |
| `POST /invitacion/{token}` | `throttle:10,1` (10 por minuto) |
| `POST /admin/invitaciones/masiva/{validar,crear}` | `throttle:10,1` (10 por minuto) |

Cada ruta usa su propio contador (prefijos `login`, `forgot-password`, `invitacion`, `invitacion-masiva`) para que no se compartan intentos entre rutas; hay una prueba de aislamiento (`ThrottleIsolationTest`). No hay otros límites de tasa. La protección CSRF de `web` aplica a todas las mutaciones.

### 4.12 Invitaciones

- **Individual**: el administrativo crea una invitación (`POST /admin/invitaciones`, acción `CreateInvitacion`). El token (64 hex) se guarda solo como SHA-256 en la tabla `invitaciones`; el enlace en claro se devuelve **una vez**. Vigencia 72 h (`INVITATION_EXPIRE_HOURS`), un solo uso (`lockForUpdate` y actualización condicional). `AcceptInvitacion` crea la cuenta con `CreateUsuario`; si había otra sesión abierta en el navegador, se cierra. Reenviar genera un enlace nuevo e invalida el anterior; revocar lo cancela. El resultado del correo es `enviado`, `fallido` o `no_configurado`.
- **Carga masiva** (`Admin/InvitacionMasivaController`, `Services/Admin/InvitacionMasivaService`): se sube un `.xlsx` o `.csv` (máx. 2 MB y `INVITATION_BULK_MAX_ROWS` filas, 50 por defecto). El CSV acepta `,` o `;`, UTF-8 con o sin BOM y Windows-1252; todas las celdas se leen como texto (las matrículas no pierden ceros). Columnas: `numero_control`, `correo`, `nombre`, `apellido_paterno`, `apellido_materno`, `rol`, `opcion_titulacion` (nombre del catálogo, obligatoria para estudiantes), `asesor` (número de control, opcional) y `grado_academico`.
- **Dos pasos sin estado en el servidor**: `POST /admin/invitaciones/masiva/validar` revisa todo y **no escribe**; `POST .../crear` vuelve a recibir el mismo archivo, lo revalida y crea solo las filas válidas (con `omitir_errores=true` si hay errores; si no, responde 422 y no crea nada). Cada invitación pasa por `CreateInvitacion` (bitácora por fila) más una entrada resumen `invitaciones_carga_masiva`. El enlace solo viaja en la respuesta de `crear` y es `null` para las filas cuyo correo sí salió; nunca se guarda ni se registra en el log.
- **Plantillas**: `GET /admin/invitaciones/plantilla.xlsx` (hojas Invitaciones, Instrucciones y Catálogos con las opciones y los asesores con su carga) y `plantilla.csv`. La lectura y escritura de Excel usa `openspout/openspout`.
- **Interfaz**: `components/admin/invitaciones/BulkInvitationsDialog.tsx` (pasos Archivo, Revisión y Resultado). Los enlaces viven solo en el estado del componente; el CSV de enlaces (solo filas sin correo entregado) se genera en el navegador con escape de fórmulas. Pruebas en `tests/Feature/Invitaciones/`.

### 4.13 Otras utilidades

- Mail y vistas: `resources/views/mail/{layout,notificacion,reset-password,test}.blade.php` y `mail/text/*`.
- `Support\StoredUploadPath` y `Support\ServerUploadLimit` están descritos en 4.7.
- `bootstrap/app.php` conserva comprobaciones heredadas de `api/*` para formatear errores como JSON; la aplicación actual no define rutas `api`.

---

## 5. Frontend

### 5.1 Páginas Inertia por rol

| Página (`resources/js/Pages`) | Rol | Descripción |
|---|---|---|
| `Landing` | Público | Presentación del sistema; un usuario autenticado es redirigido a su inicio |
| `Auth/Login` | Invitado | Acceso con número de control; modal de recuperación de contraseña y de contacto de las oficinas que dan de alta usuarios |
| `Auth/ResetPassword` | Invitado | Nueva contraseña con el token del correo |
| `Normativa` | Público | Normativa con filtro por modalidad (`modalidad_id`) |
| `NotFound` | Todos | Página 404 |
| `Dashboard` | Estudiante | Pestañas Resumen, Documentos, Requisitos, Asesores y Dictamen; semáforo y progreso, carga de archivos, historial diferido (`Inertia::defer`), campana de notificaciones, directorio, guía de pago y especificaciones de fotografía, solicitud ARCO, descarga del dictamen |
| `Asesor/Home` | Asesor | Estudiantes asignados, detalle del expediente en lectura (JSON) y aprobar/rechazar documentos |
| `Admin/Home` | Administrativo | Métricas (`admin/stats`) y distribución por estatus |
| `Admin/Expedientes/Index` | Administrativo | Listado con búsqueda, filtro por estatus, alternancia de cancelados (`?activo=0`), edición, cancelar/reactivar, exportar CSV y descargar ZIP |
| `Admin/Expedientes/Show` | Administrativo | Detalle del expediente |
| `Admin/Documentos` | Administrativo | Cola de revisión: primeros 20 expedientes (con búsqueda); los documentos del seleccionado se cargan bajo demanda |
| `Admin/Dictamenes` | Administrativo | Candidatos (`aprobado`/`en_revision` sin dictamen) y emisión |
| `Admin/Usuarios` | Administrativo | Listado paginado (20), alta, edición, activar/desactivar, baja y asignación de asesor |
| `Admin/Catalogos` | Administrativo | Pestañas de los cuatro catálogos (pestaña activa en `?tab=`) |
| `Admin/Arco` | Administrativo | Solicitudes ARCO y su resolución |
| `Admin/Bitacora` | Administrativo | Bitácora paginada |

### 5.2 Shell y layouts

- `app.tsx` asigna por defecto el layout `AppShell` a toda página. `AppShell` aporta `TooltipProvider`, los dos *toasters* (`Toaster` y Sonner), `ErrorBoundary`, el alimentador de mensajes `FlashToaster` y `PrivacyConsentModal`.
- `components/admin/AdminLayout` es la barra lateral del área administrativa (Panel General, Expedientes, Documentos, Dictámenes, Usuarios, Catálogos, ARCO, Bitácora) y el cierre de sesión.
- Cada página declara su título con `<Head>`; `app.tsx` añade el sufijo "Sistema de Titulación ISC".

### 5.3 Toasts y mensajes

`FlashToaster` convierte `flash.success` y el primer error de validación de cada visita en toasts de Sonner. Las páginas que muestran su propio toast con título específico se excluyen mediante dos listas en `AppShell.tsx`:

- `SELF_HANDLED_FLASH` (Asesor, Expedientes, Documentos, Dictámenes, Usuarios, Catálogos, ARCO): evita duplicar el toast de éxito.
- `SELF_HANDLED_ERRORS` (Auth, Dashboard, Usuarios, Catálogos, ARCO): evita duplicar el de error.

`components/admin/adminToasts.ts` ofrece los helpers de las páginas administrativas.

### 5.4 `lib/http.ts`

`jsonRequest(url, método, cuerpo)` es un `fetch` mínimo de mismo origen para los endpoints que solo devuelven JSON (notificaciones, consentimiento, directorio, ARCO propio, detalles bajo demanda). Envía `Accept: application/json`, la cookie de sesión y, en métodos distintos de `GET`, la cabecera `X-XSRF-TOKEN` leída de la cookie `XSRF-TOKEN`. Ante una respuesta no exitosa lanza `Error` con `message` (o `error`). Las mutaciones de páginas usan `router` y `useForm` de Inertia.

### 5.5 Tema y estilos

- shadcn/ui (Radix) generado en `components/ui`: se compone, no se edita.
- Tailwind CSS 3.4 con tokens HSL en variables CSS (`resources/css/app.css`; color primario guinda, acento dorado). La tipografía es Rubik (Google Fonts, cargada en `app.blade.php`).
- Modo claro/oscuro con `next-themes` (`attribute="class"`, `storageKey="sca_theme"`, tema inicial claro) y el botón `ThemeToggle`.

### 5.6 Herramientas de compilación

- **Vite 8** con `laravel-vite-plugin` y `@vitejs/plugin-react`; entrada `resources/js/app.tsx`.
- **TypeScript 5** en modo `strict`; `npm run build` ejecuta `tsc && vite build`.
- Inertia React 2 / `inertia-laravel` 2 y Ziggy (`@routes` en la plantilla; el tipo global `route` está declarado, pero el código actual usa URLs directas).
- Dependencias de interfaz: Radix UI, `react-hook-form`, `zod`, `lucide-react`, `sonner`, `recharts`, `date-fns`.

---

## 6. Catálogo de rutas

Fuente: `php artisan route:list --except-vendor --json`, que reporta **63 rutas de aplicación**; todas se documentan abajo (7 + 6 + 4 + 4 + 35 + 7). Todas viven en el grupo `web` (sesión y CSRF). "Auth" significa usuario autenticado; "Invitado" significa usuario sin sesión.

Leyenda de respuesta: **I** = página Inertia (o JSON si el cliente pide JSON sin `X-Inertia`); **J** = solo JSON; **M** = mutación (redirección con flash o `{message}` en JSON); **F** = archivo.

### 6.1 Autenticación (7)

| Método | URI | Acceso | Respuesta | Propósito |
|---|---|---|---|---|
| GET | `/login` | Invitado | I | Página de acceso |
| POST | `/login` | Invitado, `throttle:30,15` | M | Inicia sesión (errores en `numero_control`; bandera `bloqueado`) |
| POST | `/logout` | Auth | M | Cierra la sesión |
| GET | `/forgot-password` | Invitado | Redirección | Vuelve al login (modal de recuperación) |
| POST | `/forgot-password` | Invitado, `throttle:10,1` | M | Solicita el correo de recuperación |
| GET | `/reset-password/{token}` | Invitado | I | Formulario de nueva contraseña |
| POST | `/reset-password` | Invitado | M | Restablece la contraseña |

### 6.2 Público (6)

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/` | I | Landing; autenticado redirige a su inicio |
| GET | `/normativa` | I / J | Normativa activa; `?modalidad_id=` filtra (incluye las generales) |
| GET | `/normativa/{id}` | J | Detalle de una norma |
| GET | `/directorio` | J | Contactos activos; `?search=` |
| GET | `/directorio/{id}` | J | Detalle de un contacto |
| GET | `/requisitos-fotografia` | J | Requisitos de la fotografía |

Los parámetros `{id}` son numéricos.

### 6.3 Estudiante (4) — `role:estudiante`

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/dashboard` | I | Trámite activo, documentos, asignaciones, dictamen y progreso; `historial` diferido. Sin trámite: página con `error` (404 en JSON) |
| GET | `/tramites/mi-dictamen/pdf` | F | PDF del último dictamen propio |
| POST | `/tramites/{tramite}/documentos` | M | Sube un documento (`archivo`, `tipo_documento_id`); en JSON devuelve `documento_id` |
| GET | `/tramites/{tramite}/documentos/{documento}` | F | Abre el archivo propio en línea |

### 6.4 Asesor (4) — `role:asesor`

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/asesor` | I / J | Estudiantes asignados (`estudiantes`) |
| GET | `/asesor/expedientes/{tramite}` | J | Detalle de lectura, solo si está asignado (`viewAsAsesor`) |
| PUT | `/asesor/documentos/{documento}/aprobar` | M | Aprueba un documento (`DocumentoPolicy::review`) |
| PUT | `/asesor/documentos/{documento}/rechazar` | M | Rechaza con `motivo` |

### 6.5 Administrativo (35) — `role:administrativo`, prefijo `/admin`

**Panel**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin` | I / J | Panel general con métricas |
| GET | `/admin/stats` | J | Métricas (siempre JSON) |

**Expedientes (7)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/expedientes` | I / J | Listado: `search`, `estatus`, `activo` (`0` = cancelados), `page`, `limit` |
| GET | `/admin/expedientes/export` | F | CSV de expedientes activos |
| GET | `/admin/expedientes/{tramite}` | I / J | Detalle; incluye trámites cancelados |
| PUT | `/admin/expedientes/{tramite}` | M | Edita `opcion_titulacion_id` y `titulo_proyecto` (solo trámites activos) |
| PUT | `/admin/expedientes/{tramite}/toggle` | M | Cancela o reactiva (`activo` en JSON) |
| GET | `/admin/expedientes/{tramite}/descargar` | F | ZIP del expediente |
| GET | `/admin/tramites/{tramite}/documentos/{documento}` | F | Abre el archivo de un documento |

**Documentos (3)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/documentos` | I | Cola de revisión (`?search=`) |
| PUT | `/admin/documentos/{documento}/aprobar` | M | Aprueba (JSON incluye `tramite_id`) |
| PUT | `/admin/documentos/{documento}/rechazar` | M | Rechaza con `motivo` |

**Dictámenes (3)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/dictamenes` | I | Candidatos a dictamen |
| POST | `/admin/dictamenes` | M | Emite el dictamen |
| GET | `/admin/dictamenes/{tramite}/pdf` | F | PDF del dictamen |

**Asignaciones (3)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| POST | `/admin/asignaciones` | M | Crea una asignación (`tramite_id`, `usuario_id`, `rol_asignacion`) |
| PUT | `/admin/tramites/{tramite}/asesor` | M | Reemplaza o retira (`usuario_id: null`) al asesor |
| DELETE | `/admin/asignaciones/{asignacion}` | M | Elimina una asignación (responde éxito aunque no exista) |

**Usuarios y listas de apoyo (8)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/usuarios` | I / J | Listado paginado (`search`, `rol`, `page`) con docentes y opciones como props |
| POST | `/admin/usuarios` | M | Alta (`id` en JSON) |
| GET | `/admin/usuarios/{usuario}` | J | Detalle (sin hash ni token) |
| PUT | `/admin/usuarios/{usuario}` | M | Edición |
| PUT | `/admin/usuarios/{usuario}/toggle` | M | Activa o desactiva y limpia el bloqueo |
| DELETE | `/admin/usuarios/{usuario}` | M | Baja |
| GET | `/admin/docentes` | J | Vista `vw_carga_docente` |
| GET | `/admin/opciones-titulacion` | J | Opciones activas (`id`, `nombre`) |

**Catálogos (5)** — `{catalogo}` ∈ `opciones`, `tipos-documento`, `normativa`, `directorio`

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/catalogos` | I | Página con pestañas (`?tab=`) |
| GET | `/admin/catalogos/{catalogo}` | J | Registros del catálogo |
| POST | `/admin/catalogos/{catalogo}` | M | Crea (`id` en JSON) |
| PUT | `/admin/catalogos/{catalogo}/{id}` | M | Actualiza |
| PUT | `/admin/catalogos/{catalogo}/{id}/toggle` | M | Alterna `activo` |

**ARCO y bitácora (4)**

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/admin/arco` | I | Página de solicitudes ARCO |
| GET | `/admin/solicitudes-arco` | J | Lista de solicitudes |
| PUT | `/admin/solicitudes-arco/{solicitud}` | M | Resuelve (`estado`, `respuesta`) |
| GET | `/admin/bitacora` | I / J | Bitácora paginada (`page`, `limit` hasta 50, 20 por defecto) |

Recuento del área: 2 + 7 + 3 + 3 + 3 + 8 + 5 + 4 = 35.

### 6.6 Notificaciones (3) — Auth

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/notificaciones` | J | Últimas 50 del usuario y `noLeidas`; `?no_leidas=true` |
| PUT | `/notificaciones/leer-todas` | M | Marca todas como leídas |
| PUT | `/notificaciones/{notificacion}/leida` | M | Marca una; ajena es una operación sin efecto |

### 6.7 Privacidad y ARCO (4) — Auth, cualquier rol

| Método | URI | Respuesta | Propósito |
|---|---|---|---|
| GET | `/privacidad/consentimiento` | J | Estado del consentimiento |
| POST | `/privacidad/consentimiento` | J | Registra el consentimiento |
| GET | `/solicitudes-arco` | J | Solicitudes ARCO propias |
| POST | `/solicitudes-arco` | M | Crea una solicitud (`tipo`, `detalle`) |

Total del catálogo: 7 + 6 + 4 + 4 + 35 + 3 + 4 = 63.

### 6.8 Códigos de error habituales

| Código | Causa |
|---|---|
| 401 | Petición JSON sin sesión (un navegador sin sesión es redirigido a `/login`) |
| 403 | Rol no permitido o Policy denegada |
| 404 | Recurso inexistente; página `NotFound` en navegador |
| 419 | Token CSRF ausente o vencido |
| 422 | Validación o regla de negocio; en JSON llega con las claves `message` y `errors` |

---

## 7. Flujos de negocio

### 7.1 Flujo completo de titulación

```
1. ALTA
   Un administrativo crea al estudiante en /admin/usuarios (CreateUsuario).
   Se abre su trámite (opción indicada o la opción 1), un documento "pendiente" por cada
   tipo aplicable y, si el asesor elegido tiene cupo, la asignación de asesor.
        |
2. PRIMER ACCESO
   Login con número de control. Modal de aviso de privacidad: el usuario debe aceptar.
   Se guarda el consentimiento con versión, IP y user agent.
        |
3. CARGA DOCUMENTAL (estudiante)
   Para cada tipo de documento visible, el servidor valida:
     - tipo activo y aplicable a la opción del trámite
     - prerrequisito aprobado (carga secuencial)
     - formato permitido por el contenido real del archivo (PDF/JPEG/PNG)
     - tamaño máximo del tipo y tope de 20 MB
     - cabecera %PDF para los PDF
     - el documento actual no está aprobado ni en revisión
   El documento queda "cargado", se limpia el motivo de rechazo y se agrega historial.
        |
4. REVISIÓN (asesor o administrativo)
   Aprobar: solo documentos "cargado" o "en_revision". Rechazar: con motivo obligatorio.
   Cada revisión crea historial, notificación (in-app + correo), bitácora y recalcula
   el estatus del trámite. El estudiante corrige y vuelve a subir los rechazados.
        |
5. DICTAMEN (administrativo)
   Un solo dictamen por trámite. Para "aprobado" se exigen aprobados los documentos
   obligatorios existentes. El trámite pasa a "completado" (aprobado) o "rechazado";
   el estudiante es notificado y descarga el PDF.
```

Recalculo del estatus del trámite tras cada revisión (considera solo documentos obligatorios): todos aprobados da `aprobado`; algún rechazado da `rechazado`; en otro caso `en_revision`. Cuando todos quedan aprobados se agrega un historial automático ("Todos los documentos obligatorios aprobados").

### 7.2 Flujo de notificaciones

1. `NotificacionService::create()` inserta en `notificaciones` (`in_app`, `email` o `ambos`) vinculada al trámite.
2. Para `email` y `ambos` envía `NotificacionMail`; un error de envío se registra y se ignora.
3. La campana (en el panel del estudiante y el conteo en la barra lateral administrativa) consulta `/notificaciones` cada 30 s y muestra el conteo de no leídas; el usuario las marca leídas una a una o todas.
4. Generan notificación: aprobación y rechazo de documentos (`ambos`) y emisión de dictamen (`ambos`). La subida de documentos, las asignaciones y las solicitudes ARCO no generan notificaciones.

### 7.3 Flujo de auditoría (bitácora)

`BitacoraService::log()` se invoca desde las Actions de revisión y de dictamen:

| Acción | Entidad | Detalle (JSON) |
|---|---|---|
| Aprobación de documento | `documentos` | `tipo`, `tramite_id` |
| Rechazo de documento | `documentos` | `tipo`, `tramite_id`, `motivo` |
| Emisión de dictamen | `dictamenes` | `resultado`, `observaciones` |

`GET /admin/bitacora` las lista de la más reciente a la más antigua con el nombre del usuario. Ver 10.1 para lo que no se audita.

### 7.4 Reglas decididas en la migración

- **Aprobación**: solo se aprueban documentos en estado `cargado` o `en_revision`; un documento pendiente o rechazado devuelve 422.
- **Un dictamen por trámite**: `dictamenes.tramite_id` es único y la Action rechaza un segundo dictamen ("Este trámite ya tiene un dictamen emitido.").
- **Cambio de asesor**: `PUT /admin/tramites/{tramite}/asesor` **reemplaza** al asesor anterior en una transacción; si la carga del nuevo asesor está completa, la operación falla y se conserva el anterior. `usuario_id: null` retira al asesor. Los sinodales y revisores no se tocan.
- **Carga máxima**: un docente no recibe nuevas asignaciones si `carga_actual >= carga_maxima` (5 si no está definida); cuenta toda asignación activa, sea cual sea su rol.
- **Expedientes cancelados**: `toggle` cancela (`activo = 0`) o reactiva. El listado muestra solo activos por defecto; `?activo=0` lista los cancelados, y su detalle sigue disponible para revisarlos y reactivarlos. Un trámite cancelado no se puede editar ni recibir archivos ni dictamen.
- **Subidas grandes**: un archivo rechazado por los límites de PHP produce un 422 con el mensaje del límite real (`ServerUploadLimit`) en lugar de un genérico "no se recibió archivo".
- **Reemplazo de archivos**: un documento aprobado o en revisión no puede reemplazarse; el pendiente y el rechazado sí.
- **Baja de usuarios**: no se puede eliminar o desactivar a uno mismo, ni eliminar al último administrador activo; las restricciones de clave foránea (p. ej. un administrador que emitió dictámenes) devuelven un 422 con mensaje.

### 7.5 Privacidad y ARCO

- **Fundamento**: Ley General de Protección de Datos Personales en Posesión de Sujetos Obligados (LGPDPPSO), aplicable al TESCHA como institución pública.
- **Consentimiento**: ver 4.3.
- **Solicitud**: el usuario elige tipo (acceso, rectificación, cancelación u oposición) y un detalle opcional; se guarda como `pendiente` y se le informa un plazo máximo de 15 días hábiles.
- **Atención**: un administrativo revisa en `/admin/arco`, cambia el estado (`en_proceso`, `completada`, `rechazada`) y escribe la respuesta; se fija `fecha_resolucion`. No se registra `atendido_por`, bitácora ni notificación (ver 10.1).

### 7.6 Carga de usuarios por administración

`POST /admin/usuarios`: el administrador define la contraseña; el sistema no la genera ni envía correo al usuario nuevo. Un estudiante recibe su trámite y documentos pendientes; un asesor recibe `carga_maxima` (5 por defecto).

---

## 8. Pruebas

### 8.1 Estructura

| Directorio | Contenido |
|---|---|
| `tests/Feature/Admin` | Flujo administrativo, páginas, bitácora, catálogos, expedientes cancelados, reemplazo de asesor, CRUD de usuarios |
| `tests/Feature/Arco` | Solicitudes ARCO |
| `tests/Feature/Asesor` | Panel y detalle de expediente del asesor |
| `tests/Feature/Auth` | Inicio de sesión, bloqueo, recuperación de contraseña |
| `tests/Feature/Estudiante` | Trámite, subida y consulta de documentos |
| `tests/Feature/Public` | Contenido público y páginas Inertia |
| `tests/Feature/Services` | Servicios transversales (PDF del dictamen, correo de notificaciones, exportación CSV y ZIP) |
| `tests/Feature/NotificacionTest.php`, `T7dFixesTest.php` | Notificaciones y correcciones de paridad |
| `tests/Unit` | Prueba de ejemplo |

Resultado verificado de `php artisan test`: **172 pruebas, 172 correctas, 1837 aserciones** (suite completa en unos 4 segundos).

### 8.2 Seguridad de la base

- `phpunit.xml` fuerza `DB_DATABASE=sca_tescha_test`, mailer `array`, sesión y caché `array` y cola `sync`.
- `tests/TestCase.php` vuelve a forzar caché, sesión y correo en memoria (las variables exportadas en la shell prevalecen sobre `phpunit.xml`) y lanza `RuntimeException` si la base conectada no es `sca_tescha_test`.
- Se usa `DatabaseTransactions`; **nunca** `RefreshDatabase`, que borraría datos.
- `scripts/demo.sh test-db` crea `sca_tescha_test` y ejecuta `php artisan sca:test-db`, que hace `migrate:fresh --seed` solo si el nombre termina en `_test`. Debe ejecutarse una vez antes de la primera corrida.

### 8.3 Ejecución

```bash
scripts/demo.sh test-db   # una vez
composer test             # limpia la configuración en caché y ejecuta php artisan test
php artisan test --filter=AuthFlowTest
```

---

## 9. Operación y despliegue local

### 9.1 Requisitos

- PHP 8.3 o superior con `pdo_mysql`, `mbstring`, `xml`, `dom`, `zip`, `curl`, `fileinfo`, `openssl`, `tokenizer`, `ctype`, `bcmath`.
- Composer 2, Node.js 22 y npm.
- MariaDB o MySQL.

### 9.2 Instalación

```bash
composer install
npm ci --ignore-scripts
cp .env.example .env
php artisan key:generate
# editar .env (ver 9.4), crear la base vacía y luego:
php artisan migrate --seed
npm run build
php artisan serve
```

Cuentas de demostración (contraseña `Demo1234!`): estudiante `2021-0001`, asesor `DOC-0001`, administrativo `ADM-0001`. En desarrollo, `npm run dev` levanta Vite y `composer dev` lanza los procesos de desarrollo (`php artisan dev`).

### 9.3 `scripts/demo.sh`

Levanta una instancia propia de MariaDB (sin root, datos en `~/.local/share/sca-mariadb`) y sirve Laravel con `php -S` en `http://127.0.0.1:8001`.

| Comando | Efecto |
|---|---|
| `scripts/demo.sh up` | Inicia la base, la crea con migraciones y seeders si no existe, compila el frontend y arranca la aplicación |
| `scripts/demo.sh status` | Informa si la base y la aplicación responden (verifica que `/login` renderice realmente) |
| `scripts/demo.sh down` | Detiene aplicación y base |
| `scripts/demo.sh reset-db --yes` | Borra y recrea la base de demostración |
| `scripts/demo.sh test-db` | Prepara la base de pruebas |

Detalles relevantes:

- **`php -S` debe ejecutarse desde `public/`**: el script *router* de Laravel resuelve `index.php` desde el directorio de trabajo, por lo que el script hace `cd public` antes de iniciar el servidor.
- El servidor se inicia con `upload_max_filesize=25M` y `post_max_size=30M`, mayores que el tope de 20 MB de la aplicación.
- Variables opcionales del script: `SCA_PORT`, `SCA_DB_NAME`, `SCA_DB_DIR`.

### 9.4 Claves de `.env` relevantes

| Clave | Uso |
|---|---|
| `APP_KEY`, `APP_ENV`, `APP_DEBUG`, `APP_URL` | Identidad y modo de la aplicación |
| `DB_CONNECTION=mariadb`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Base de datos (`sca_tescha`) |
| `SESSION_DRIVER`, `SESSION_LIFETIME` | Sesión (`file` por defecto; 120 minutos) |
| `CACHE_STORE` | Caché (los contadores de `throttle` usan la caché) |
| `MAIL_MAILER` y `MAIL_*` | Correo (`log` por defecto) |
| `MAIL_HOST`, `MAIL_PORT`, `MAIL_SCHEME`, `MAIL_USERNAME`, `MAIL_PASSWORD` | Servidor SMTP (`MAIL_SCHEME=smtp` STARTTLS, `smtps` SSL) |
| `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` | Remitente (nombre `SCA-TESCHA` por defecto; con Gmail, la misma cuenta) |
| `MAIL_TIMEOUT` | Tiempo máximo de conexión SMTP en segundos (10) |
| `MAIL_ALWAYS_TO` | Si se define, todo correo se redirige a esa dirección (demos); vacío en producción |
| `LOGIN_MAX_ATTEMPTS`, `LOGIN_BLOCK_MINUTES` | Bloqueo de cuenta (5 y 15) |
| `BCRYPT_ROUNDS`, `HASH_VERIFY` | Hash de contraseñas |
| `FILESYSTEM_DISK` | Disco por defecto (`local`, privado) |
| `UPLOADS_DISK` | Disco de los documentos subidos: `local` (por defecto), `r2` o `s3` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | Cloudflare R2 cuando `UPLOADS_DISK=r2` (el endpoint es `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`; región `auto` y path style fijos; las credenciales y el bucket caen a `AWS_*` si faltan) |
| `R2_JURISDICTION`, `R2_ENDPOINT` | Opcionales: `eu` usa `<account>.eu.r2...` (solo valor admitido); `R2_ENDPOINT` reemplaza el endpoint calculado (MinIO, pruebas) |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET` | Credenciales y bucket cuando `UPLOADS_DISK=s3` (bucket privado; nombres de la convención del SDK de S3) |
| `AWS_ENDPOINT`, `AWS_USE_PATH_STYLE_ENDPOINT` | Endpoint de servicios compatibles con `UPLOADS_DISK=s3` (vacío en AWS S3; para R2 usa mejor `UPLOADS_DISK=r2`) |
| `AWS_REQUEST_CHECKSUM_CALCULATION`, `AWS_RESPONSE_CHECKSUM_VALIDATION` | `when_required` (por defecto) o `when_supported`; ver `sca:uploads-test` |

El archivo `.env` no se versiona.

### 9.5 Lista previa a producción

- `APP_DEBUG=false`, `APP_ENV=production` y un `APP_KEY` propio.
- HTTPS delante de la aplicación.
- SMTP real (`MAIL_*`); con el mailer `log` los correos no llegan a nadie.
- Sustituir las contraseñas de demostración y retirar o desactivar los usuarios de ejemplo.
- Respaldos de la base de datos **y** de los documentos subidos (`storage/app/private` o el bucket): ambos son necesarios para recuperar un expediente.
- Límites de PHP (`upload_max_filesize`, `post_max_size`) mayores que el máximo por tipo de documento y que el tope de 20 MB.
- `php artisan config:cache`, `route:cache` y `npm run build` en el despliegue.
- Sesión: `file` basta en un solo servidor; con varias instancias, usar `database` (o `redis`) y una caché compartida para que los contadores de límite de tasa sean coherentes. Para `database` debe crearse la tabla de sesiones (no la incluye la migración base).

### 9.6 Recomendación sobre contenedores

Se recomienda contenerizar la aplicación para fijar la versión de PHP, las extensiones requeridas y los límites de subida, y así reproducir el entorno entre equipos y servidores. Hoy **no existe** ningún `Dockerfile` ni `docker-compose` en el repositorio: es una mejora pendiente, no algo ya provisto.

---

## 10. Decisiones de diseño y comportamientos heredados

### 10.1 Paridad con el sistema anterior (se conserva a propósito)

| Comportamiento | Detalle |
|---|---|
| Sin bitácora en otras operaciones | CRUD de usuarios, ARCO, catálogos, edición y cancelación de expedientes y asignaciones no escriben en `bitacora`; tampoco el inicio de sesión ni la subida de documentos. Solo revisión de documentos y dictámenes |
| ARCO sin responsable ni aviso | `atendido_por` queda `NULL` y no se notifica al solicitante al resolver |
| Progreso sin redondear | La lista de expedientes y el trámite usan `porcentaje_avance` de la vista (un decimal); solo el detalle administrativo recalcula el porcentaje y lo redondea a entero |
| Exportación CSV | Se entrega `expedientes.csv` (UTF-8 con BOM) en lugar de un `.xlsx` |
| Errores 422 con clave `message` | En JSON, además de `errors` por campo, viene `message` (primer error), como el formato anterior |
| Aprobación del dictamen | Solo exige aprobados los documentos obligatorios que ya tienen fila; un tipo obligatorio nunca cargado no bloquea |
| Historial al aprobar todo | La fila automática registra siempre `en_revision` como estado anterior |
| Asesor con cualquier rol de asignación | `viewAsAsesor`, el panel del asesor y la revisión lo consideran asesor sin importar el `rol_asignacion` ni si la asignación está activa |
| Operaciones idempotentes | Crear una asignación repetida no falla; borrar una inexistente responde éxito; marcar la notificación de otro usuario no tiene efecto |
| Edición parcial de usuarios | `numero_control`, `email`, `nombre`, `apellido_paterno`, `rol` y `password` solo cambian si vienen con valor; `apellido_materno`, `grado_academico` y `carga_maxima` cambian si vienen presentes |
| Asesor sin archivos | El asesor puede revisar documentos pero no tiene ruta para abrir los archivos |
| `docentes` con `id` | La respuesta añade `id` a `docente_id` porque la interfaz lo lee así |

### 10.2 Mejoras sobre el sistema anterior

- Verificación del MIME real del archivo (no la cabecera del cliente) y rechazo de reemplazo de documentos aprobados o en revisión.
- Hash y token de recuperación guardados con SHA-256; el token en claro solo viaja por correo.
- Almacenamiento privado por trámite y autorización con Policies en toda lectura de archivos.
- El detalle de usuario no expone el hash de contraseña ni el token de recuperación.
- Reemplazo atómico del asesor y control de carga en el servidor.

### 10.3 Limitaciones y pendientes conocidos

- Sin `Dockerfile` ni integración continua en el repositorio.
- El aviso de privacidad no se vuelve a pedir al cambiar la versión (4.3).
- Sin notificaciones al asignar asesores ni al subir documentos.
- Sin filtros en la bitácora (solo paginación).
- La interfaz de creación de solicitudes ARCO existe en el panel del estudiante; los demás roles solo tienen el endpoint.
- Los usuarios de demostración comparten contraseña; hay que retirarlos en producción.
- La migración base solo funciona en MariaDB/MySQL.
- Paquetes instalados sin uso en el código: Sanctum.

---

## 11. Historial / migración desde Express

La versión anterior (SPA React + API Express con JWT) se conserva en la rama `legacy-express` y en el tag `pre-laravel-cleanup`. La migración conservó los endpoints, los textos y las reglas, y los reubicó en Laravel.

| Aspecto | Antes | Ahora |
|---|---|---|
| Servidor | Express + TypeScript (`server/`) | Laravel 13 (PHP 8.3+) |
| Cliente | SPA React 18 + React Router + TanStack Query | React 18 + TypeScript servido por Inertia |
| Autenticación | JWT en `localStorage` | Sesión de Laravel con CSRF |
| Control de acceso | `authenticate` / `authorize(rol)` | `auth` + `role:` + Policies |
| Casos de uso | `use-cases/` y repositorios | `app/Actions` y `app/Services` |
| Acceso a datos | `mysql2` con SQL directo | Eloquent y Query Builder |
| Esquema | `database/schema.sql` y `seed.sql` | Migración base adoptable y seeders |
| PDF | PDFKit | Dompdf mediante el contrato `DictamenPdfRenderer` |
| Subidas | `multer` en `server/uploads` | Disco `uploads` (local privado `storage/app/private/uploads/{tramite_id}` o bucket S3 privado) |
| Correo | `nodemailer` | `Mail` de Laravel (`NotificacionMail`, `ResetPasswordMail`) |
| Exportación | `.xlsx` y ZIP (`adm-zip`) | CSV y ZIP (`ZipArchive`) |
| Pruebas | Vitest en el frontend | PHPUnit (172 pruebas) sobre `sca_tescha_test` |
| Proxy de desarrollo | Vite proxy `/api` a `:3000` | No aplica (un solo servidor) |

Puntos de la migración:

- Los archivos subidos con el sistema anterior se localizan con la convención heredada: un nombre sin `/` se resuelve como `uploads/<nombre>` en el disco privado, por lo que basta copiar la carpeta antigua de subidas a `storage/app/private/uploads/`.
- Una base `sca_tescha` creada con el esquema anterior se adopta sin cambios (3.5); los hashes `$2b$` siguen siendo válidos (4.1).
- Las rutas del sistema anterior bajo `/api/...` dejaron de existir; las equivalentes están en la sección 6.
