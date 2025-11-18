// Detecta si estamos en localhost o en prod
const BASE_URL = process.env.REACT_APP_API_URL;

// ✅ --- FUNCIÓN DE MANEJO DE RESPUESTA MEJORADA ---
// Esta versión es robusta y puede manejar errores que devuelven HTML (como los 500 de Render)
const handleResponse = async (response) => {
    
    // CASO 1: La respuesta fue exitosa (status 200-299)
    if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await response.json(); // El camino feliz
        }
        // Si el servidor da OK pero no es JSON (ej. llamó a la raíz '/')
        throw new Error(`Respuesta inesperada del servidor. Se esperaba JSON pero se recibió: ${contentType}`);
    }

    // CASO 2: La respuesta fue un error (status 404, 500, 502, etc.)
    // Los errores de servidor (Render, Vercel) casi siempre devuelven HTML o texto.
    const errorText = await response.text(); // Leemos como texto para evitar el crash de JSON

    // Intentamos ver si el texto es un JSON de error de nuestra API (ej: { "message": "..." })
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson && errorJson.message) {
            // ¡Perfecto! Es un error JSON enviado por nuestro backend
            throw new Error(errorJson.message); 
        }
    } catch (e) {
        // No era JSON. Era un error HTML.
        // Limpiamos el HTML para un mensaje de error más legible
        const cleanError = errorText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        // Mostramos solo el inicio del error
        throw new Error(`Error ${response.status}: ${cleanError.substring(0, 150)}...`);
    }

    // Fallback por si acaso
    throw new Error(`Error ${response.status} (${response.statusText})`);
};

// --- ENDPOINTS (Estos no cambian) ---

// 1. Obtener todas las solicitudes (Para solicitudes.js)
export const getSolicitudes = async () => {
  const response = await fetch(`${BASE_URL}/api/solicitudes-sheet`);
  return handleResponse(response);
};

// 2. Obtener resumen (Para Dashboard.js)
export const getDashboardSummary = async () => {
  const response = await fetch(`${BASE_URL}/api/dashboard-summary`);
  return handleResponse(response);
};

// 3. Crear solicitud (Para SolicitudForm.js)
export const createSolicitud = async (data) => {
  const response = await fetch(`${BASE_URL}/api/crear-solicitud`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

// 4. Actualizar solicitud
export const updateSolicitud = async (data) => {
  const response = await fetch(`${BASE_URL}/api/update-solicitud`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), 
  });
  return handleResponse(response);
};

// 5. Eliminar solicitud
export const deleteSolicitud = async (data) => {
  const response = await fetch(`${BASE_URL}/api/eliminar-solicitud`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data), 
  });
  return handleResponse(response);
};