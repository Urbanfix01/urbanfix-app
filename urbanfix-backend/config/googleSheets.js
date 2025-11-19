const { google } = require('googleapis');

// --- VARIABLES DE CONFIGURACIÓN ---
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

let sheetsClient = null;

// ====================================================================
// FUNCIÓN DE AUTENTICACIÓN
// ====================================================================
function getGoogleAuth() {
    
    // ***** 🛠️ ESTA ES LA CORRECCIÓN MÁS IMPORTANTE 🛠️ ****
    // Añade el permiso (scope) de Google Drive para "encontrar" el archivo.
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.readonly' 
    ];
    // *************************************************

    let auth;
    
    const email = process.env.GOOGLE_SHEETS_EMAIL;
    const key = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    if (email && key) {
        // --- Estrategia para Entorno de Producción (Render) ---
        console.log("Cargando credenciales desde variables separadas (EMAIL y KEY)...");
        try {
            const formattedKey = key.replace(/\\n/g, '\n');
            auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: email,
                    private_key: formattedKey,
                },
                scopes: SCOPES, // Usamos los scopes corregidos
            });
        } catch (error) {
            console.error("ERROR CRÍTICO: Fallo en la autenticación de Google Sheets.", error.message);
            throw new Error("Fallo en la configuración de autenticación de Google.");
        }
    } else {
        // --- Estrategia para Entorno de Desarrollo (Local) ---
        console.error("ADVERTENCIA: Cargando desde 'credentials.json' (Error en Render si ves esto)");
        const path = require('path');
        const CREDENTIALS_PATH = path.join(__dirname, '..', 'credentials.json');
        
        auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: SCOPES, // Usamos los scopes corregidos
        });
    }
    return auth;
}

// Inicializa el cliente Sheets
function getSheetsClient() {
    if (sheetsClient) {
        return sheetsClient;
    }
    try {
        const authClient = getGoogleAuth();
        sheetsClient = google.sheets({ version: 'v4', auth: authClient });
        console.log("Cliente de Google Sheets inicializado y autenticado.");
        return sheetsClient;
    } catch (error) {
        console.error("Error al inicializar el cliente de Google Sheets:", error.message);
        throw error;
    }
}

// Exportamos solo lo que se necesita
module.exports = {
    getSheetsClient,
    SPREADSHEET_ID
};