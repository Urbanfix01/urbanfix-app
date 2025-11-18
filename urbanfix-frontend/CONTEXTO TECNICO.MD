Contexto Técnico del Proyecto: UrbanFix (v1.2)

Este documento resume la arquitectura técnica y el estado actual del proyecto UrbanFix, diseñado para que un nuevo asistente de IA o desarrollador pueda sincronizarse de inmediato.

1. Resumen del Proyecto

UrbanFix es una aplicación de gestión de solicitudes de mantenimiento. Consta de un Frontend (para clientes y administradores) y un Backend (que actúa como API).

Objetivo: Permitir a los clientes enviar solicitudes de trabajo y a los administradores gestionarlas.

Base de Datos: Google Sheets. Toda la información se lee y escribe en una hoja de cálculo de Google.

2. Arquitectura General (Desplegada)

La aplicación está 100% en la nube y funciona conectando dos servicios principales:

Frontend (React) @ Vercel:

URL: https://urbanfix-frontend.vercel.app

Función: Sirve la interfaz de usuario (formulario de solicitud y panel de admin).

Backend (Node.js) @ Render:

URL: https://urbanfix-backend-4sfg.onrender.com

Función: Actúa como una API RESTful que se conecta a Google Sheets.

El flujo es: Vercel (React) -> Render (Node.js API) -> Google Sheets.

3. Detalles del Frontend (urbanfix-frontend)

Stack: React (creado con create-react-app).

UI: react-bootstrap.

Autenticación (Admin): firebase/auth (solo para proteger las rutas del panel de admin en el frontend).

Gestión de API (Clave):

Toda la lógica de fetch está centralizada en src/services/api.js.

Este archivo exporta funciones (getSolicitudes, createSolicitud, etc.) que los componentes consumen.

Variables de Entorno (.env):

REACT_APP_API_URL: Apunta a la URL del backend en Render (ej: https://urbanfix-backend-4sfg.onrender.com).

REACT_APP_FIREBASE_...: Claves de Firebase para la autenticación del admin.

4. Detalles del Backend (urbanfix-backend)

Stack: Node.js + Express.

Estructura: MVC (routes, controllers, config).

Endpoints Principales (en /api/...):

GET /solicitudes-sheet: Obtiene todas las filas.

GET /dashboard-summary: Obtiene contadores (total, pendientes, etc.).

POST /crear-solicitud: Añade una nueva fila.

PATCH /update-solicitud: Actualiza el estado/monto de una fila (usa sheetRowIndex en el body).

DELETE /eliminar-solicitud: Limpia una fila (usa sheetRowIndex en el body).

5. ¡¡IMPORTANTE!! Lógica de Autenticación del Backend

Esta es la parte más crítica y la que ha requerido más depuración. La conexión a la API de Google Sheets usa un método de autenticación híbrido definido en src/config/googleSheets.js:

A. Entorno de Desarrollo (Local)

Condición: process.env.NODE_ENV !== 'production'.

Método: Busca un archivo llamado credentials.json en la carpeta raíz del proyecto backend (fuera de src).

Log: Imprime "📂 Modo Desarrollo. Buscando 'credentials.json' local..."

B. Entorno de Producción (Render)

Condición: process.env.NODE_ENV === 'production'.

Método: NO USA variables de entorno como GOOGLE_CLIENT_EMAIL o GOOGLE_PRIVATE_KEY (esto falló).

Método Correcto: Lee un "Secret File" de Render.

Ruta del Archivo en Render: /etc/secrets/credentials.json

Configuración en Render: Se debe subir el archivo credentials.json completo en la sección "Secret Files" del servicio.

Log: Imprime "🔐 Modo Producción. Buscando 'Secret File' en Render..." y "📂 'Secret File' de Render encontrado."

Variable Adicional: La variable de entorno GOOGLE_SPREADSHEET_ID sí se lee desde "Environment Variables".

6. Estado Actual (Estable)

Tras una larga sesión de depuración (Errores text/html, Error 500, DECODER routines), la arquitectura híbrida de "Secret Files" (Producción) y archivo local (Desarrollo) está implementada y funcionando.

El sistema completo (Vercel + Render + Google Sheets) está estable y operativo.