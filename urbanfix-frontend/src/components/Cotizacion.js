// src/components/Cotizacion.js
import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
// Card, Form, Button, etc. ya están importados
import { Container, Row, Col, Card, Form, Button, InputGroup, Alert, Spinner, Stack } from 'react-bootstrap';
// 🌟 Importamos el ícono (asegúrate de haber ejecutado 'npm install react-bootstrap-icons')
import { XCircleFill } from 'react-bootstrap-icons';
// 🌟 Importamos los paquetes de PDF (asegúrate de haber ejecutado 'npm install jspdf jspdf-autotable')
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://urbanfix-backend-4sfg.onrender.com'
    : 'http://localhost:3000';

const estadosValidos = [
    'NUEVO', 'COTIZADO', 'ACEPTADO', 'EN CURSO', 
    'FINALIZADO', 'CERRADO', 'CANCELADO', 'VISITA COTIZADA', 
    'VISITA AGENDADA', 'COTIZADO (PV)', 'PENDIENTE'
];

const Cotizacion = () => {
    useParams(); 
    const location = useLocation(); 
    const navigate = useNavigate();

    const [solicitud, setSolicitud] = useState(null);
    const [lineItems, setLineItems] = useState([{ descripcion: '', precio: 0 }]);
    const [costoManoDeObra, setCostoManoDeObra] = useState(0);
    const [costoMateriales, setCostoMateriales] = useState(0); 
    const [estadoActual, setEstadoActual] = useState('COTIZADO');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (location.state?.solicitud) {
            const data = location.state.solicitud;
            setSolicitud(data);
            setEstadoActual(data.estado || 'NUEVO');
            
            if (data.presupuesto) {
                try {
                    const parsedPresupuesto = JSON.parse(data.presupuesto);
                    if (parsedPresupuesto.items) {
                        setLineItems(parsedPresupuesto.items);
                    }
                    setCostoManoDeObra(parsedPresupuesto.manoDeObra || 0);
                } catch (e) {
                    console.warn("No se pudo parsear el presupuesto existente.");
                }
            }
            if (data.monto_cotizado) {
                 if (!data.presupuesto) {
                    // Si no hay presupuesto detallado, usamos el monto_cotizado como base de Materiales
                    setCostoMateriales(parseFloat(data.monto_cotizado) || 0);
                 }
            }
        }
    }, [location.state]);

    // --- Lógica del Formulario Dinámico ---
    const handleItemChange = (index, field, value) => {
        const updatedItems = [...lineItems];
        updatedItems[index][field] = value;
        setLineItems(updatedItems);
    };
    const handleAddItem = () => {
        setLineItems([...lineItems, { descripcion: '', precio: 0 }]);
    };
    const handleRemoveItem = (index) => {
        const updatedItems = lineItems.filter((_, i) => i !== index);
        setLineItems(updatedItems);
    };

    // --- Cálculos de Totales ---
    const calcularTotal = () => {
        // Sumamos el costo de materiales, mano de obra y todos los ítems descriptivos
        const totalItems = lineItems.reduce((acc, item) => acc + (parseFloat(item.precio) || 0), 0);
        const total = (parseFloat(costoMateriales) || 0) + (parseFloat(costoManoDeObra) || 0) + totalItems;
        return total;
    };

    // --- Lógica de Guardado (API) y PDF ---
    const handleSaveAndGeneratePDF = async (generarPDF = false) => {
        setLoading(true);
        setError(null);
        const totalFinal = calcularTotal();

        // Creamos el JSON del presupuesto
        const presupuestoJSON = JSON.stringify({
            items: lineItems,
            manoDeObra: costoManoDeObra,
            materiales: costoMateriales // Guardamos materiales también
        });

        const payload = {
            sheetRowIndex: solicitud.sheetRowIndex,
            newStatus: estadoActual,
            newMonto: totalFinal,
            newPresupuesto: presupuestoJSON 
        };

        try {
            await axios.patch(`${API_BASE_URL}/api/update-solicitud`, payload);
            console.log("Cotización guardada en Google Sheets.");

            if (generarPDF) {
                try {
                    generarPDFInterno(totalFinal);
                } catch (pdfError) {
                    console.error("¡Guardado exitoso, PERO falló el PDF!", pdfError);
                    setError(`Guardado en Sheets exitoso, pero falló la generación del PDF. Error: ${pdfError.message}`);
                    setLoading(false);
                    return; 
                }
            }
            // Navega de vuelta a la lista de solicitudes
            navigate('/solicitudes'); 

        } catch (apiError) {
            console.error("Error al guardar la cotización (API):", apiError);
            setError("Error al guardar en Google Sheets. Revisa los logs de Render para ver el error de la API.");
            setLoading(false); // Nos quedamos en la página si la API falla
        }
    };

    // --- Generador de PDF ---
    const generarPDFInterno = (total) => {
        const doc = new jsPDF();
        
        // Colores UrbanFix
        const ufOrange = '#FF8A3D';
        const ufGrey = '#3A3B3C';
        
        // Encabezado
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(ufGrey);
        doc.text("COTIZACIÓN DE SERVICIO", 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(ufGrey);
        doc.text("UrbanFix - Lo Hacemos Real", 105, 30, { align: 'center' });
        doc.setDrawColor(ufOrange); // Línea naranja
        doc.setLineWidth(1);
        doc.line(10, 35, 200, 35); 

        // Datos del Cliente y Presupuesto
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Cliente:", 10, 45);
        doc.setFont(undefined, 'normal');
        doc.text(solicitud?.nombre_apellido || 'N/A', 40, 45);
        
        doc.setFont(undefined, 'bold');
        doc.text("Dirección:", 10, 52);
        doc.setFont(undefined, 'normal');
        doc.text(solicitud?.direccion || 'N/A', 40, 52);
        
        doc.setFont(undefined, 'bold');
        doc.text("Teléfono:", 10, 59);
        doc.setFont(undefined, 'normal');
        doc.text(solicitud?.telefono || 'N/A', 40, 59);
        
        doc.setFont(undefined, 'bold');
        doc.text("N° Presupuesto:", 150, 45);
        doc.setFont(undefined, 'normal');
        doc.text(solicitud?.id || 'N/A', 185, 45);
        
        doc.setFont(undefined, 'bold');
        doc.text("Fecha:", 150, 52);
        doc.setFont(undefined, 'normal');
        doc.text(new Date().toLocaleDateString('es-AR'), 185, 52);
        doc.setDrawColor('#cccccc'); // Línea gris
        doc.setLineWidth(0.5);
        doc.line(10, 65, 200, 65);

        // --- AutoTable ---
        const tableColumn = ["Descripción", "Precio"];
        // Añadimos los ítems dinámicos
        const tableRows = lineItems.map(item => [item.descripcion, `$${parseFloat(item.precio) || 0}`]);
        
        // Añadimos Materiales y Mano de Obra
        tableRows.push(["Costo Materiales", `$${parseFloat(costoMateriales) || 0}`]);
        tableRows.push(["Costo Mano de Obra", `$${parseFloat(costoManoDeObra) || 0}`]);

        let startY = 75;
        
        if (autoTable) {
            autoTable(doc, { 
                head: [tableColumn],
                body: tableRows,
                startY: startY,
                headStyles: {
                    fillColor: ufGrey, // Cabecera Gris Oscuro
                    textColor: '#ffffff'
                },
                bodyStyles: {
                    cellPadding: 2,
                },
                footStyles: {
                    fillColor: '#ffffff',
                    textColor: ufGrey
                },
                theme: 'striped'
            });
            startY = doc.lastAutoTable.finalY; 
        } else {
            console.error("jsPDF autoTable plugin no está cargado.");
            doc.text("Error: No se pudo generar la tabla del PDF.", 10, startY);
            startY += 10; 
        }

        // --- Total ---
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(ufGrey);
        doc.text("TOTAL (Materiales + Mano de Obra + Ítems):", 10, startY + 20);
        
        // Total en Naranja
        doc.setTextColor(ufOrange);
        doc.text(`$${total.toFixed(2)}`, 190, startY + 20, { align: 'right' });

        doc.save(`Presupuesto_UrbanFix_${solicitud?.id}.pdf`);
    };

    // --- Renderizado de Carga ---
    if (!solicitud) {
        return (
            // Aplicamos el fondo gris de admin
            <div className="dashboard-content">
                <Container className="py-5 text-center">
                    <Spinner animation="border" variant="primary" />
                    <p className="text-primary fs-5 mt-2">Cargando datos de la solicitud...</p>
                    <Link to="/solicitudes">
                        <Button variant="secondary">Volver a Solicitudes</Button>
                    </Link>
                </Container>
            </div>
        );
    }

    // --- RENDERIZADO PRINCIPAL ---
    return (
        // 1. APLICAMOS EL FONDO GRIS DEL DASHBOARD
        <div className="dashboard-content">
            <Container className="py-5">
                <Row className="justify-content-center">
                    <Col md={10} lg={9}>
                        {/* 2. MANTENEMOS LA TARJETA BLANCA */}
                        <Card className="shadow-sm p-4">
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    {/* 3. APLICAMOS EL TÍTULO DEL DASHBOARD */}
                                    <h3 className="dashboard-title">Cotizar Solicitud</h3>
                                    <Link to="/solicitudes">
                                        {/* Botón secundario gris (React-Bootstrap) */}
                                        <Button variant="secondary" size="lg">Volver a Solicitudes</Button>
                                    </Link>
                                </div>

                                {error && <Alert variant="danger">{error}</Alert>}

                                {/* 4. DATOS DEL CLIENTE (TARJETA ESTÁNDAR) */}
                                <Card className="mb-4 shadow-sm">
                                    <Card.Body>
                                        <h5 className="mb-3">Datos del Cliente</h5>
                                        <p className="mb-1"><strong>Cliente:</strong> {solicitud.nombre_apellido}</p>
                                        <p className="mb-1"><strong>Teléfono:</strong> {solicitud.telefono}</p>
                                        <p className="mb-1"><strong>Dirección:</strong> {solicitud.direccion}</p>
                                        <p className="mb-0"><strong>Categoría:</strong> {solicitud.categoria_trabajo}</p>
                                    </Card.Body>
                                </Card>

                                <Form>
                                    {/* 5. APLICAMOS ETIQUETAS Y ESTILOS DE FORMULARIO */}
                                    <Form.Label className="form-label-custom mb-3">Detalle de Cotización (Ítems descriptivos)</Form.Label>
                                    {lineItems.map((item, index) => (
                                        <Row key={index} className="mb-2 align-items-center">
                                            <Col md={7}>
                                                <Form.Control
                                                    type="text"
                                                    placeholder={`Ítem ${index + 1}`}
                                                    value={item.descripcion}
                                                    onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                                                    size="lg" // Input grande
                                                />
                                            </Col>
                                            <Col md={4}>
                                                <InputGroup size="lg"> {/* InputGroup grande */}
                                                    <InputGroup.Text>$</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        placeholder="Precio"
                                                        value={item.precio}
                                                        onChange={(e) => handleItemChange(index, 'precio', e.target.value)}
                                                    />
                                                </InputGroup>
                                            </Col>
                                            <Col md={1}>
                                                <Button variant="danger" size="sm" onClick={() => handleRemoveItem(index)}>
                                                    <XCircleFill />
                                                </Button>
                                            </Col>
                                        </Row>
                                    ))}
                                    <Button variant="outline-primary" size="sm" onClick={handleAddItem} className="mt-2">
                                        + Agregar Ítem
                                    </Button>

                                    <hr className="my-4" />

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formManoDeObra">
                                                <Form.Label className="form-label-custom">Mano de Obra ($)</Form.Label>
                                                <InputGroup size="lg"> {/* InputGroup grande */}
                                                    <InputGroup.Text>$</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        value={costoManoDeObra}
                                                        onChange={(e) => setCostoManoDeObra(e.target.value)}
                                                    />
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formMateriales">
                                                <Form.Label className="form-label-custom">Materiales ($)</Form.Label>
                                                <InputGroup size="lg"> {/* InputGroup grande */}
                                                    <InputGroup.Text>$</InputGroup.Text>
                                                    <Form.Control
                                                        type="number"
                                                        value={costoMateriales}
                                                        onChange={(e) => setCostoMateriales(e.target.value)}
                                                    />
                                                </InputGroup>
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row className="mt-3">
                                        <Col md={6}>
                                            <Form.Group className="mb-3" controlId="formEstado">
                                                <Form.Label className="form-label-custom">Cambiar Estado</Form.Label>
                                                <Form.Select
                                                    value={estadoActual}
                                                    onChange={(e) => setEstadoActual(e.target.value)}
                                                    size="lg" // Select grande
                                                >
                                                    {estadosValidos.map(estado => (
                                                        <option key={estado} value={estado}>{estado}</option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6} className="d-flex align-items-center justify-content-end">
                                            <div className="text-end">
                                                <h4 className="text-dark fw-bold">Total: ${calcularTotal().toFixed(2)}</h4>
                                            </div>
                                        </Col>
                                    </Row>
                                    
                                    <Stack direction="horizontal" gap={3} className="mt-4 justify-content-end">
                                        <Button 
                                            variant="outline-primary" // Botón secundario
                                            onClick={() => handleSaveAndGeneratePDF(false)}
                                            disabled={loading}
                                            size="lg" // Botón grande
                                        >
                                            {loading ? <Spinner size="sm" animation="border" /> : "Solo Guardar Cambios"}
                                        </Button>
                                        <Button 
                                            variant="primary" // Botón principal (Naranja)
                                            onClick={() => handleSaveAndGeneratePDF(true)}
                                            disabled={loading}
                                            size="lg" // Botón grande
                                        >
                                            {loading ? <Spinner size="sm" animation="border" /> : "Guardar y Generar PDF"}
                                        </Button>
                                    </Stack>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default Cotizacion;