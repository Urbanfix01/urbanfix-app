// src/routes/apiRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/solicitudesController');

// Definición de endpoints
router.get('/solicitudes-sheet', controller.getSolicitudes);
router.get('/dashboard-summary', controller.getDashboardSummary);
router.post('/crear-solicitud', controller.createSolicitud);
router.patch('/update-solicitud', controller.updateSolicitud);
router.delete('/eliminar-solicitud', controller.deleteSolicitud);

module.exports = router;