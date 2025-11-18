const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');
const { getSheetsClient } = require('./config/googleSheets'); // Importar el cliente de Sheets

const app = express();

// Configuración de CORS dinámica
const corsOptions = {
    origin: (origin, callback) => {
        // Permitir peticiones sin 'origin' (como apps móviles, curl, o solicitudes locales)
        if (!origin) return callback(null, true); 
        
        // **!!! FIX TEMPORAL PARA SALTAR LA CACHÉ DE RENDER !!!**
        // Vamos a permitir todos los orígenes temporalmente para confirmar
        // que el resto del sistema funciona.
        console.warn(`Petición permitida desde origen (CORS ABIERTO): ${origin}`);
        callback(null, true);

        /*
        // Dominios permitidos (Render y Vercel)
        // **!!! ESTA ES LA LISTA FINAL CORREGIDA CON TU DOMINIO REAL !!!**
        const allowedOrigins = [
            'https://urbanfix-frontend-kf4v4.vercel.app', // <--- Dominio Principal de la captura
            'https://urbanfix-frontend-v4-git-main-urbanfix01-projects.vercel.app', // Dominio de Preview de la captura
            'https://urbanfix-frontend.vercel.app', // Dominio base por seguridad
        ];

        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost')) {
            callback(null, true);
        } else {
            console.error(`CORS Error: Origin ${origin} not allowed.`);
            // Pasar un error con un código 403 para que el middleware de error lo capture.
            const error = new Error('Not allowed by CORS');
            error.statusCode = 403;
            callback(error, false);
        }
        */
    }
};

app.use(cors(corsOptions));
app.use(express.json());

// -----------------------------------------------------
// FUNCIÓN DE INICIO
// Garantiza que la API de Google se inicialice ANTES de
// que el servidor escuche, para atrapar cualquier error
// de configuración inmediatamente.
// -----------------------------------------------------
async function startServer() {
    const PORT = process.env.PORT || 10000;

    try {
        // 1. **Punto CRÍTICO:** Intentar inicializar el cliente de Sheets.
        // Esto llamará a getGoogleAuth() y validará credenciales.
        getSheetsClient(); 
        
        console.log("Servicio de Google Sheets listo. Conectando API...");

        // Definición de Rutas
        app.use('/api', apiRoutes);

        // Middleware global de manejo de errores
        app.use((err, req, res, next) => {
            console.error("Error Global Capturado:", err.stack);
            res.status(err.statusCode || 500).json({
                status: 'error',
                message: err.message || 'Internal Server Error'
            });
        });

        // Iniciar el servidor
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Your service is live 🎉`);
        });

    } catch (error) {
        // Si el cliente de Sheets falla, el servidor se detiene.
        console.error("ERROR CRÍTICO: El servidor no pudo iniciar debido a un fallo en la inicialización de Google Sheets. Detalles:", error.message);
        // Terminar el proceso para que Render lo reinicie o notifique.
        process.exit(1); 
    }
}

startServer();