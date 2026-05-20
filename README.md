# Sistema de Titulación Digital - TESCHA

Plataforma web para la gestión y seguimiento del proceso de titulación de los alumnos del Tecnológico de Estudios Superiores de Chalco (TESCHA). Permite tanto a estudiantes como a administradores gestionar expedientes, validar documentación y emitir dictámenes de manera digital y eficiente.

## 🚀 Tecnologías Utilizadas

- **Core:** React (v18) + TypeScript
- **Herramienta de Construcción:** Vite
- **Estilos:** Tailwind CSS + Shadcn UI (componentes de UI accesibles y modernos)
- **Rutas:** React Router DOM (v6)
- **Gestión de Estado y Consultas:** React Query (TanStack Query v5)
- **Iconografía:** Lucide React

## 📋 Características Principales

### Portal de Estudiantes
- **Landing Page:** Información general del proceso de titulación y acceso a la normativa vigente.
- **Inicio de Sesión:** Acceso seguro para alumnos.
- **Dashboard del Alumno:** Visualización del progreso del trámite, subida de documentos y estado del expediente en tiempo real.

### Panel de Administración
- **Dashboard de Administrador:** Resumen estadístico del estado de los trámites globales.
- **Gestión de Expedientes:** Revisión detallada del avance de cada alumno.
- **Gestión de Documentos:** Validación y aprobación/rechazo de los archivos subidos.
- **Dictámenes:** Generación y gestión de los dictámenes correspondientes.
- **Configuración:** Ajustes del sistema y parámetros de titulación.

---

## 🛠️ Instalación y Configuración Local

Sigue estos pasos para ejecutar el proyecto en tu entorno local:

### 1. Prerrequisitos
Asegúrate de tener instalado:
- **Node.js** (versión 18 o superior recomendada)
- **npm** (incluido con Node.js)

### 2. Instalar Dependencias
Instala los paquetes necesarios ejecutando el siguiente comando en la raíz del proyecto:

```bash
npm install
```

> [!NOTE]
> El proyecto está configurado con un archivo `.npmrc` que redirige la caché de npm a una carpeta local (`.npm-cache`). Esto evita errores comunes de permisos de acceso de administrador (`EACCES: permission denied`) al realizar la instalación en diferentes computadoras o cuentas de usuario.

### 3. Iniciar el Servidor de Desarrollo
Una vez instaladas las dependencias, inicia el entorno de desarrollo local con:

```bash
npm run dev
```

El servidor local se abrirá típicamente en `http://localhost:5173`.

---

## 📁 Estructura del Proyecto

El código fuente principal se encuentra en la carpeta `/src`:

- `/components`: Componentes visuales reutilizables de UI y Shadcn.
- `/hooks`: Hooks personalizados de React.
- `/lib`: Configuración de utilidades (como `utils.ts` para clases de Tailwind).
- `/pages`: Las páginas y vistas principales de la aplicación:
  - `Landing.tsx` y `Normativa.tsx`: Vistas públicas informativas.
  - `Login.tsx`: Portal de acceso.
  - `Dashboard.tsx`: Panel principal del estudiante.
  - `/admin`: Panel administrativo (expedientes, documentos, dictámenes, etc.).

---

## 🔧 Otros Comandos Útiles

- **Compilar para Producción:** Genera los archivos listos para producción en la carpeta `/dist`:
  ```bash
  npm run build
  ```
- **Ejecutar Pruebas:** Corre la suite de pruebas unitarias con Vitest:
  ```bash
  npm run test
  ```
- **Analizar Código (Lint):** Verifica problemas de estilo o sintaxis con ESLint:
  ```bash
  npm run lint
  ```
