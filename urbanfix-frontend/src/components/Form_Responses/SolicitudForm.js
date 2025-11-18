import React, { useState } from 'react';
// ✅ CORRECCIÓN DE RUTA: Cambiado de '../../' a '../'
import { createSolicitud } from '../services/api'; 
import { Container, Row, Col, Form, Button, Card, Alert, Spinner } from 'react-bootstrap'; 
import { Link } from 'react-router-dom';

// ... (El resto del componente es idéntico) ...
const SolicitudForm = () => {
    // 🌟 ESTADOS AMPLIADOS PARA INCLUIR URGENCIA Y VENTANAS
    // (Estos estados se mantienen igual)
    const [formData, setFormData] = useState({
        nombre_apellido: '',
        telefono: '',
        direccion: '',
        categoria_trabajo: '',
        descripcion_problema: '',
        urgencia: 'Normal: Es un arreglo, pero no hay apuro.', 
        ventanas_horarias: [] 
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Opciones del Formulario (Se mantienen igual)
    const categorias = ['Plomería', 'Electricidad', 'Gas y termotanques (Calefones, estufas)', 'Aire Acondicionado (Instalación / Mantenimiento)', 'Cerrajería (Urgencias / Cambios)', 'Pintura', 'Albañilería (Arreglos menores, Durlock, etc.)', 'Carpintería / Herrería', 'Electrodomésticos (Lavarropas, heladeras, etc.)', 'Jardinería / Limpieza técnica', 'Otro'];
    
    const opcionesUrgencia = [
        'Normal: Es un arreglo, pero no hay apuro.', 
        'Moderado: Necesito resolverlo pronto. (Próximas 48hs)', 
        'Urgente: ¡Es una emergencia! (Necesito solución hoy. Entiendo que puede tener recargo)'
    ];

    const opcionesVentanas = [
        'Lunes a Viernes (Mañana 9-13hs)',
        'Lunes a Viernes (Tarde 14-18hs)',
        'Sábado (Mañana 9-13hs)',
        'A coordinar (Tengo horarios rotativos)',
        'Lo antes posible (Solo para urgencias)'
    ];

    // Esta lógica de manejo de inputs se mantiene idéntica
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        setFormData(prevData => {
            const currentVentanas = prevData.ventanas_horarias;
            if (checked) {
                return { ...prevData, ventanas_horarias: [...currentVentanas, value] };
            } else {
                return { ...prevData, ventanas_horarias: currentVentanas.filter(v => v !== value) };
            }
        });
    };

    // ✅ --- LÓGICA DE ENVÍO REFACTORIZADA ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        // La preparación de datos es idéntica
        const dataToSend = {
            ...formData,
            ventanas_horarias: formData.ventanas_horarias.join(', ') 
        };

        try {
            // 1. Llamamos a nuestra nueva función del servicio
            // 'response' ya es el objeto JSON parseado (gracias a handleResponse en api.js)
            const response = await createSolicitud(dataToSend);

            // 2. Comprobamos la respuesta del backend
            if (response.success) {
                setSuccess('¡Solicitud enviada con éxito! Nos pondremos en contacto a la brevedad.');
                // 3. Limpiamos el formulario (restaurando los valores por defecto)
                setFormData({
                    nombre_apellido: '',
                    telefono: '',
                    direccion: '',
                    categoria_trabajo: '',
                    descripcion_problema: '',
                    urgencia: opcionesUrgencia[0],
                    ventanas_horarias: []
                });
            } else {
                // Si el backend responde { success: false, message: "..." }
                throw new Error(response.message || 'Error al procesar la solicitud.');
            }
        
        } catch (err) {
            // 'err.message' vendrá del error lanzado en 'api.js' o del 'throw' de arriba
            console.error("Error al crear la solicitud:", err);
            setError(err.message || 'Error al enviar la solicitud. Por favor, intente más tarde.');
        } finally {
            setLoading(false);
        }
    };

    // --- El JSX (la UI) no necesita ningún cambio ---
    return (
        <Container fluid className="login-page-container d-flex align-items-center justify-content-center py-5">
            <Row className="justify-content-center w-100">
                <Col xs={11} sm={10} md={9} lg={8} xl={7}>
                    <Card className="login-card shadow-lg">
                        <Card.Body className="p-4 p-md-5">
                            <h2 className="text-center mb-3 user-login-title">Solicitar Presupuesto</h2>
                            <p className="text-center text-muted mb-4">
                                Complete el formulario y nos pondremos en contacto para coordinar una visita o enviarle una cotización.
                            </p>
                            
                            {success && <Alert variant="success">{success}</Alert>}
                            {error && <Alert variant="danger">{error}</Alert>}

                            <Form onSubmit={handleSubmit}>
                                {/* SECCIÓN DATOS DE CONTACTO */}
                                <h5 className="form-section-title">Datos de Contacto</h5>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formNombre">
                                            <Form.Label className="form-label-custom">Nombre y Apellido</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="nombre_apellido"
                                                value={formData.nombre_apellido}
                                                onChange={handleChange}
                                                required 
                                                size="lg" 
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3" controlId="formTelefono">
                                            <Form.Label className="form-label-custom">Teléfono (WhatsApp)</Form.Label>
                                            <Form.Control 
                                                type="text" 
                                                name="telefono"
                                                value={formData.telefono}
                                                onChange={handleChange}
                                                required 
                                                size="lg" 
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Form.Group className="mb-4" controlId="formDireccion">
                                    <Form.Label className="form-label-custom">Dirección / Localidad</Form.Label>
                                    <Form.Control 
                                        type="text" 
                                        name="direccion"
                                        value={formData.direccion}
                                        onChange={handleChange}
                                        placeholder="Ej: Av. Corrientes 1234, Almagro"
                                        required 
                                        size="lg" 
                                    />
                                </Form.Group>

                                {/* SECCIÓN PROBLEMA */}
                                <h5 className="form-section-title">Detalles del Trabajo</h5>
                                <Form.Group className="mb-3" controlId="formCategoria">
                                    <Form.Label className="form-label-custom">Categoría del Trabajo</Form.Label>
                                    <Form.Select
                                        name="categoria_trabajo"
                                        value={formData.categoria_trabajo}
                                        onChange={handleChange}
                                        required
                                        size="lg" 
                                    >
                                        <option value="">Seleccione una categoría...</option>
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                                <Form.Group className="mb-4" controlId="formDescripcion">
                                    <Form.Label className="form-label-custom">Descripción del Problema</Form.Label>
                                    <Form.Control 
                                        as="textarea"
                                        rows={4}
                                        name="descripcion_problema"
                                        value={formData.descripcion_problema}
                                        onChange={handleChange}
                                        placeholder="Lo más claro posible. Ej: La canilla pierde agua constantemente..."
                                        required
                                        size="lg" 
                                    />
                                </Form.Group>
                                
                                {/* SECCIÓN URGENCIA (Radio Buttons) */}
                                <Form.Group className="mb-4" controlId="formUrgencia">
                                    <Form.Label className="form-label-custom fw-bold">¿QUÉ TAN URGENTE ES?</Form.Label>
                                    {opcionesUrgencia.map((opcion, index) => (
                                        <Form.Check
                                            key={index}
                                            type="radio"
                                            name="urgencia"
                                            id={`urgencia-${index}`}
                                            label={opcion}
                                            value={opcion}
                                            checked={formData.urgencia === opcion}
                                            onChange={handleChange}
                                            className="ms-3"
                                        />
                                    ))}
                                </Form.Group>

                                {/* SECCIÓN HORARIOS (Checkboxes) */}
                                <Form.Group className="mb-4" controlId="formHorarios">
                                    <Form.Label className="form-label-custom fw-bold">VENTANAS HORARIAS</Form.Label>
                                    <p className="text-muted small mb-2">Seleccione todas las que apliquen:</p>
                                    {opcionesVentanas.map((opcion, index) => (
                                        <Form.Check
                                            key={index}
                                            type="checkbox"
                                            name="ventanas_horarias"
                                            id={`ventana-${index}`}
                                            label={opcion}
                                            value={opcion}
                                            checked={formData.ventanas_horarias.includes(opcion)}
                                            onChange={handleCheckboxChange}
                                            className="ms-3"
                                        />
                                    ))}
                                </Form.Group>

                                <div className="d-grid gap-3 mt-4">
                                    <Button variant="primary" type="submit" size="lg" disabled={loading} className="w-100 login-button-uf">
                                        {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Enviar Solicitud'}
                                    </Button>
                                    <Link to="/login" className="text-center">
                                        <Button variant="outline-secondary" className="w-100">
                                            Volver al Login de Administrador
                                        </Button>
                                    </Link>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SolicitudForm;