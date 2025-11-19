import React, { useState, useEffect } from 'react';
import { getSolicitudes, updateSolicitud, deleteSolicitud, createSolicitud } from '../../services/api';
import { Container, Table, Button, Form, Alert, Spinner, Stack, Row, Col, Modal, ListGroup, Card, Navbar, Nav } from 'react-bootstrap'; 
import { ArrowClockwise, PencilFill, CurrencyDollar, EyeFill, TrashFill, SaveFill, XCircleFill } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext'; 
import { auth } from '../../firebase'; 
import { signOut } from 'firebase/auth';

// 🐦 PÁJARO 2: FUNCIÓN PARA ARREGLAR LA FECHA
const formatExcelDate = (serial) => {
   if (!serial || serial === 'N/A') return 'N/A';
   // Si ya es texto con fecha, devolverlo
   if (typeof serial === 'string' && serial.includes('/')) return serial;
   
   // Convertir número de Excel a Fecha JS
   const val = parseFloat(serial);
   if (isNaN(val)) return 'N/A';

   const utc_days  = Math.floor(val - 25569);
   const utc_value = utc_days * 86400;                                      
   const date_info = new Date(utc_value * 1000);
   
   return date_info.toLocaleDateString('es-AR'); 
};

const DashboardNavbar = ({ userEmail, onLogout }) => {
    return (
        <Navbar expand="lg" className="dashboard-navbar" data-bs-theme="dark">
            <Container fluid className="px-4">
                <Navbar.Brand href="/dashboard" className="fw-bold">UrbanFix Admin</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto d-flex align-items-center">
                        <Nav.Item className="text-light me-3"><small>Conectado como:</small> <strong>{userEmail}</strong></Nav.Item>
                        <Button variant="outline-light" onClick={onLogout} size="sm">Cerrar Sesión</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

const getStatusVariant = (estado) => {
    const estadoNorm = estado?.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'PENDIENTE';
    switch (estadoNorm) {
        case 'ACEPTADO': case 'FINALIZADO': case 'CERRADO': return 'success'; 
        case 'PENDIENTE': case 'EN CURSO': case 'NUEVO': return 'primary'; 
        case 'CANCELADO': case 'ELIMINADO': return 'danger'; 
        case 'VISITA COTIZADA': case 'VISITA AGENDADA': return 'info'; 
        default: return 'secondary';
    }
};

const Solicitudes = () => {
    const [solicitudes, setSolicitudes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); 
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [editingRowId, setEditingRowId] = useState(null);
    const [originalRowData, setOriginalRowData] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedSolicitud, setSelectedSolicitud] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [solicitudToDelete, setSolicitudToDelete] = useState(null);

    const estadosValidos = ['NUEVO', 'COTIZADO', 'ACEPTADO', 'EN CURSO', 'FINALIZADO', 'CERRADO', 'CANCELADO', 'VISITA COTIZADA', 'VISITA AGENDADA', 'COTIZADO (PV)', 'PENDIENTE'];

    const fetchSolicitudes = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getSolicitudes();
            setSolicitudes(data.data || []); 
        } catch (err) {
            console.error("Error:", err);
            setError(err.message || 'Fallo al cargar datos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSolicitudes(); }, []); 

    const handleLogout = async () => {
        try { await signOut(auth); navigate('/login'); } catch (error) { console.error(error); }
    };

    const handleEstadoChange = (id, val) => setSolicitudes(s => s.map(i => i.id === id ? { ...i, estado: val } : i));
    const handleMontoChange = (id, val) => setSolicitudes(s => s.map(i => i.id === id ? { ...i, monto_cotizado: val } : i));
    
    const handleEditClick = (sol) => { setEditingRowId(sol.id); setOriginalRowData(sol); };
    const handleCancelClick = (id) => {
        setSolicitudes(s => s.map(i => i.id === id ? originalRowData : i));
        setEditingRowId(null); setOriginalRowData(null);
    };

    const handleSaveClick = async (solicitud) => {
        const dataToSave = {
            sheetRowIndex: solicitud.sheetRowIndex,
            newStatus: solicitud.estado, 
            newMonto: solicitud.monto_cotizado || '0',
            newPresupuesto: solicitud.presupuesto || '' 
        };
        try {
            await updateSolicitud(dataToSave);
            setEditingRowId(null); setOriginalRowData(null);
        } catch (error) {
            setError(error.message);
            setTimeout(() => window.location.reload(), 2000); 
        }
    };

    const handleCotizarClick = (sol) => navigate(`/cotizar/${sol.id}`, { state: { solicitud: sol } });
    const handleShowModal = (sol) => { setSelectedSolicitud(sol); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setSelectedSolicitud(null); };
    const handleShowDeleteModal = (sol) => { setSolicitudToDelete(sol); setShowDeleteModal(true); };
    const handleCloseDeleteModal = () => { setShowDeleteModal(false); setSolicitudToDelete(null); };

    const handleConfirmDelete = async () => {
        if (!solicitudToDelete) return;
        setLoading(true); setError(null);
        try {
            await deleteSolicitud({ sheetRowIndex: solicitudToDelete.sheetRowIndex });
            // Actualizamos localmente para que desaparezca al instante
            setSolicitudes(prev => prev.filter(s => s.id !== solicitudToDelete.id));
            handleCloseDeleteModal(); 
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (error && solicitudes.length === 0) return <Alert variant="danger">{error}</Alert>;

    // 🐦 PÁJARO 1: FILTRO MAESTRO
    // Ocultamos los que dicen "ELIMINADO" o "N/A" en el nombre para limpiar la lista
    const filteredSolicitudes = solicitudes.filter(sol => {
        // 1. Ocultar eliminados
        if (sol.estado === 'ELIMINADO') return false;
        if (sol.nombre_apellido === 'N/A' || !sol.nombre_apellido) return false; 

        // 2. Búsqueda y Filtro normal
        const matchesSearch = (sol.nombre_apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (sol.direccion || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (sol.telefono || '').includes(searchTerm);
        const matchesStatus = statusFilter ? sol.estado === statusFilter : true;
        return matchesSearch && matchesStatus;
    });

    return (
        <>
            <DashboardNavbar userEmail={currentUser?.email} onLogout={handleLogout}/>
            <div className="dashboard-content">
                <Container className="py-5"> 
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <h3 className="dashboard-title">Gestión de Solicitudes ({filteredSolicitudes.length})</h3>
                        <Stack direction="horizontal" gap={2}>
                            <Button variant="outline-primary" onClick={fetchSolicitudes} disabled={loading}>
                                {loading && !error ? <Spinner animation="border" size="sm" /> : <ArrowClockwise size={20} />}
                            </Button>
                            <Link to="/dashboard"><Button variant="primary">Volver al Panel</Button></Link>
                        </Stack>
                    </div>

                    {error && (<Alert variant="danger" onClose={() => setError(null)} dismissible>{error}</Alert>)}

                    <Card className="mb-4 shadow-sm">
                        <Card.Body className="p-4">
                            <Row>
                                <Col md={8}>
                                    <Form.Control type="text" placeholder="Buscar Cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="lg" />
                                </Col>
                                <Col md={4}>
                                    <Form.Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} size="lg">
                                        <option value="">Todos los Estados</option>
                                        {estadosValidos.map(e => <option key={e} value={e}>{e}</option>)}
                                    </Form.Select>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>

                    {loading && solicitudes.length === 0 && <div className="text-center mt-5"><Spinner animation="border" /></div>}
                    {!loading && filteredSolicitudes.length === 0 && <Alert variant="info" className="text-center">No hay solicitudes.</Alert>}

                    {filteredSolicitudes.length > 0 && (
                        <Table hover responsive className="shadow-sm align-middle bg-white border">
                            {/* 🐦 PÁJARO 3: ESTILOS FORZADOS PARA QUE SE LEA EL TÍTULO */}
                            <thead style={{ backgroundColor: '#212529', color: 'white' }}>
                                <tr>
                                    <th className="py-3">#</th>
                                    <th className="py-3">Fecha</th>
                                    <th className="py-3">Cliente</th>
                                    <th className="py-3">Teléfono</th>
                                    <th className="py-3">Dirección</th>
                                    <th className="py-3">Categoría</th>
                                    <th className="py-3">Monto</th>
                                    <th className="py-3">Estado</th>
                                    <th className="py-3">Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSolicitudes.map((solicitud, index) => {
                                    const isEditing = editingRowId === solicitud.id;
                                    return (
                                        <tr key={solicitud.id}>
                                            <td>{index + 1}</td> 
                                            {/* FECHA ARREGLADA */}
                                            <td>{formatExcelDate(solicitud.marca_temporal)}</td> 
                                            <td>{solicitud.nombre_apellido || 'N/A'}</td>
                                            <td>{solicitud.telefono || 'N/A'}</td>
                                            <td>{solicitud.direccion || 'N/A'}</td>
                                            <td>{solicitud.categoria_trabajo || 'N/A'}</td>
                                            <td>
                                                {isEditing ? (
                                                    <Form.Control type="text" size="sm" value={solicitud.monto_cotizado || ''} onChange={(e) => handleMontoChange(solicitud.id, e.target.value)} />
                                                ) : (solicitud.monto_cotizado ? `$${solicitud.monto_cotizado}` : 'N/A')}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <Form.Select size="sm" value={solicitud.estado || 'PENDIENTE'} onChange={(e) => handleEstadoChange(solicitud.id, e.target.value)}>
                                                        {estadosValidos.map(e => <option key={e} value={e}>{e}</option>)}
                                                    </Form.Select>
                                                ) : (
                                                    <Button variant={getStatusVariant(solicitud.estado)} size="sm" className="fw-bold" style={{ minWidth: '110px' }} onClick={() => handleEditClick(solicitud)}>
                                                        {solicitud.estado || 'PENDIENTE'}
                                                    </Button>
                                                )}
                                            </td>
                                            <td>
                                                {isEditing ? (
                                                    <Stack direction="horizontal" gap={2}>
                                                        <Button variant="success" size="sm" onClick={() => handleSaveClick(solicitud)}><SaveFill /></Button>
                                                        <Button variant="danger" size="sm" onClick={() => handleCancelClick(solicitud.id)}><XCircleFill /></Button>
                                                    </Stack>
                                                ) : (
                                                    <Stack direction="horizontal" gap={2}>
                                                        <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(solicitud)}><PencilFill /></Button>
                                                        <Button variant="outline-success" size="sm" onClick={() => handleCotizarClick(solicitud)}><CurrencyDollar /></Button>
                                                        <Button variant="outline-info" size="sm" onClick={() => handleShowModal(solicitud)}><EyeFill /></Button>
                                                        <Button variant="outline-danger" size="sm" onClick={() => handleShowDeleteModal(solicitud)}><TrashFill /></Button>
                                                    </Stack>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    )}
                    
                    {/* MODALES (Mantienen su lugar, no cambian) */}
                    {selectedSolicitud && (
                        <Modal show={showModal} onHide={handleCloseModal} centered>
                            <Modal.Header closeButton><Modal.Title>Detalles</Modal.Title></Modal.Header>
                            <Modal.Body>
                                <ListGroup variant="flush">
                                    <ListGroup.Item><strong>Descripción:</strong> {selectedSolicitud.descripcion_problema}</ListGroup.Item>
                                    <ListGroup.Item><strong>Notas:</strong> {selectedSolicitud.notas}</ListGroup.Item>
                                </ListGroup>
                            </Modal.Body>
                            <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Cerrar</Button></Modal.Footer>
                        </Modal>
                    )}
                     {solicitudToDelete && (
                        <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
                             <Modal.Header closeButton><Modal.Title className="text-danger">Borrar</Modal.Title></Modal.Header>
                             <Modal.Body>¿Seguro que deseas eliminar a <strong>{solicitudToDelete.nombre_apellido}</strong>?</Modal.Body>
                             <Modal.Footer>
                                <Button variant="secondary" onClick={handleCloseDeleteModal}>Cancelar</Button>
                                <Button variant="danger" onClick={handleConfirmDelete}>Sí, Borrar</Button>
                             </Modal.Footer>
                        </Modal>
                    )}
                </Container>
            </div>
        </>
    );
};

export default Solicitudes;