const { getSheetsClient, SPREADSHEET_ID } = require('../config/googleSheets.js');
const sheets = getSheetsClient();

// ***** 🛠️ CORRECCIÓN DEL NOMBRE DE LA HOJA 🛠️ *****
// Pega el valor EXACTO aquí, reemplazando el antiguo
const SHEET_NAME = 'Form_Responses';

const HEADERS = [
    'MARCA_TEMPORAL', 'NOMBRE_APELLIDO', 'TELEFONO', 'DIRECCION', 
    'CATEGORIA_TRABAJO', 'DESCRIPCION_PROBLEMA', 'FOTOS_VIDEOS', 'URGENCIA',
    'VENTANAS_HORARIAS', 'ESTADO', 'PRESUPUESTO', 'MONTO_COTIZADO',
    'LINK_PAGO', 'NOTAS', 'PAGO_RECIBIDO', 'COLUMNA_P_EXTRA'
];

const formatRowsToJSON = (rows) => {
    if (!rows || rows.length === 0) return [];
    return rows.map((row, index) => {
        const solicitud = {};
        HEADERS.forEach((header, i) => {
            solicitud[header] = row[i] || '';
        });
        solicitud.sheetRowIndex = index + 2; 
        return solicitud;
    });
};

const getSolicitudes = async (req, res) => {
    // ✅ CORRECCIÓN: 'Solicitudes de trabajo' DEBE ir entre comillas simples.
    const READ_RANGE = `'${SHEET_NAME}'!A2:P`; 

    try {
        console.log(`Intentando leer rango: ${READ_RANGE}`); // Log para debugging
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: READ_RANGE, 
        });
        const rows = response.data.values;
        const solicitudesJSON = formatRowsToJSON(rows);
        res.status(200).json({ success: true, data: solicitudesJSON });
    } catch (error) {
        console.error('Error [getSolicitudes]:', error.message);
        console.error('Rango que intentó leer:', READ_RANGE); 
        res.status(500).json({ success: false, message: 'Error al conectar con Google Sheets.', error: error.message });
    }
};

const createSolicitud = async (req, res) => {
    try {
        const { nombre_apellido, telefono, direccion, categoria_trabajo, descripcion_problema, urgencia, ventanas_horarias } = req.body;
        const newRow = [ new Date().toISOString(), nombre_apellido || '', telefono || '', direccion || '', categoria_trabajo || '', descripcion_problema || '', '', urgencia || '', ventanas_horarias || '', 'PENDIENTE', '', '', '', '', '', '' ];
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_NAME}'!A1:P1`, 
            valueInputOption: 'USER_ENTERED',
            resource: { values: [newRow] },
        });
        res.status(201).json({ success: true, message: 'Solicitud creada con éxito.' });
    } catch (error) {
        console.error('Error [crearSolicitud]:', error.message);
        res.status(500).json({ success: false, message: 'Error al guardar en Google Sheets.', error: error.message });
    }
};

const updateSolicitud = async (req, res) => {
    try {
        const { sheetRowIndex, estado, monto_cotizado, presupuesto } = req.body;
        if (!sheetRowIndex) return res.status(400).json({ success: false, message: 'Falta sheetRowIndex.' });
        const requests = [];
        if (estado) requests.push({ range: `'${SHEET_NAME}'!J${sheetRowIndex}`, values: [[estado]] });
        if (monto_cotizado !== undefined) requests.push({ range: `'${SHEET_NAME}'!L${sheetRowIndex}`, values: [[monto_cotizado]] });
        if (presupuesto) requests.push({ range: `'${SHEET_NAME}'!K${sheetRowIndex}`, values: [[presupuesto]] });
        if (requests.length === 0) return res.status(400).json({ success: false, message: 'No hay datos para actualizar.' });
        
        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: { valueInputOption: 'USER_ENTERED', data: requests }
        });
        res.status(200).json({ success: true, message: 'Solicitud actualizada.' });
    } catch (error) {
        console.error('Error [updateSolicitud]:', error.message);
        res.status(500).json({ success: false, message: 'Error al actualizar en Google Sheets.', error: error.message });
    }
};

const deleteSolicitud = async (req, res) => {
    try {
        const { sheetRowIndex } = req.body;
        if (!sheetRowIndex) return res.status(400).json({ success: false, message: 'Falta sheetRowIndex.' });
        const clearedValues = Array(16).fill('');
        clearedValues[9] = 'ELIMINADO'; // Columna J = ESTADO
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `'${SHEET_NAME}'!A${sheetRowIndex}:P${sheetRowIndex}`,
            valueInputOption: 'RAW',
            resource: { values: [clearedValues] }
        });
        res.status(200).json({ success: true, message: 'Solicitud marcada como eliminada.' });
    } catch (error) {
         console.error('Error [deleteSolicitud]:', error.message);
        res.status(500).json({ success: false, message: 'Error al eliminar en Google Sheets.', error: error.message });
    }
};

const getDashboardSummary = async (req, res) => {
    try {
        const SUMMARY_RANGE = `'${SHEET_NAME}'!J2:J`;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: SUMMARY_RANGE });
        const rows = response.data.values;
        if (!rows) return res.status(200).json({ success: true, data: { total: 0, pendientes: 0, nuevos: 0, cotizados: 0, finalizados: 0 }});
        let total = rows.length, pendientes = 0, nuevos = 0, cotizados = 0, finalizados = 0;
        rows.forEach(row => {
            const estado = (row[0] || '').toUpperCase();
            switch (estado) {
                case 'PENDIENTE': pendientes++; break;
                case 'NUEVO': nuevos++; break;
                case 'COTIZADO': cotizados++; break;
                case 'FINALIZADO': finalizados++; break;
            }
        });
        res.status(200).json({ success: true, data: { total, pendientes, nuevos, cotizados, finalizados } });
    } catch (error) {
        console.error('Error [getDashboardSummary]:', error.message);
        console.error('Rango que intentó leer:', SUMMARY_RANGE); 
        res.status(500).json({ success: false, message: 'Error al calcular el resumen.', error: error.message });
    }
};

module.exports = {
    getSolicitudes,
    createSolicitud,
    updateSolicitud,
    deleteSolicitud,
    getDashboardSummary
};