// ⛔ ELIMINADO: axios
import React, { useState, useEffect } from 'react';
// ✅ AÑADIDO: Importamos nuestra función centralizada
import { getDashboardSummary } from '../services/api'; 
import { useAuth } from '../AuthContext'; 
import { auth } from '../firebase'; 
import { signOut } from 'firebase/auth';
import { useNavigate, Link, useLocation } from 'react-router-dom'; 
// ✅ AÑADIDO: Alert para manejo de errores
import { Container, Row, Col, Card, Button, Spinner, Navbar, Nav, Alert } from 'react-bootstrap'; 

// ⛔ ELIMINADO: La constante API_BASE_URL
// (Nuestra capa de servicio 'api.js' ahora maneja esto automáticamente)

// 🌟 COMPONENTE NAVBAR (Se mantiene idéntico)
const DashboardNavbar = ({ userEmail, onLogout }) => {
    return (
        <Navbar expand="lg" className="dashboard-navbar" data-bs-theme="dark">
            <Container fluid className="px-4">
                <Navbar.Brand href="/dashboard" className="fw-bold">
                    UrbanFix Admin
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="ms-auto d-flex align-items-center">
                        <Nav.Item className="text-light me-3">
                            <small>Conectado como:</small> <strong>{userEmail}</strong>
                        </Nav.Item>
                        <Button 
                            variant="outline-light" 
                            onClick={onLogout}
                            size="sm"
                            className="logout-button-uf"
                        >
                            Cerrar Sesión
                        </Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};


const Dashboard = () => {
    const { currentUser } = useAuth(); 
    const navigate = useNavigate(); 
    const location = useLocation();

    const [summary, setSummary] = useState({ total: 0, pendientes: 0, finalizadas: 0 });
    const [loading, setLoading] = useState(true);
    // ✅ AÑADIDO: Estado de error para la UI
    const [error, setError] = useState(null);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login'); 
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    // ✅ --- HOOK REFACTORIZADO para cargar datos ---
    useEffect(() => {
        const fetchSummary = async () => {
            setLoading(true); 
            setError(null); // Limpiamos error anterior
            try {
                // 1. Llamamos a nuestra nueva función del servicio
                // 'data' ya es el objeto JSON parseado
                const data = await getDashboardSummary();
                setSummary(data);
            } catch (err) {
                // 'err.message' viene del error lanzado en 'api.js'
                console.error("Error al cargar el resumen del dashboard:", err);
                setError(err.message); // Guardamos el error para la UI
                setSummary({ total: '!', pendientes: '!', finalizadas: '!' }); 
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, [location]); // 'location' es correcto para forzar un refresh si se navega al dashboard

    // Función auxiliar para mostrar el spinner o el número
    const renderStat = (value) => {
        // No mostramos spinner si hay un error, mostramos '!'
        if (error) return value; 
        
        return loading ? (
            <Spinner animation="border" size="sm" />
        ) : (
            value
        );
    };

    return (
        <>
            {/* 1. RENDERIZAMOS LA NAVBAR */}
            <DashboardNavbar 
                userEmail={currentUser ? currentUser.email : 'Usuario'}
                onLogout={handleLogout}
            />

            {/* 2. CONTENIDO PRINCIPAL DEL DASHBOARD */}
            <div className="dashboard-content">
                <Container className="py-5">
                    
                    {/* Título de la sección */}
                    <Row className="mb-4">
                        <Col>
                            <h1 className="dashboard-title">Resumen de Solicitudes</h1>
                            <p className="text-muted">
                                Un vistazo rápido a los trabajos pendientes y finalizados.
                            </p>
                        </Col>
                    </Row>
                    
                    {/* ✅ AÑADIDO: Alerta de error si falla el fetch */}
                    {error && (
                        <Row className="mb-4">
                            <Col>
                                <Alert variant="danger">
                                    <strong>Error al cargar datos:</strong> {error}
                                </Alert>
                            </Col>
                        </Row>
                    )}

                    {/* Sección de Estadísticas (AHORA CON ESTILO) */}
                    <Row>
                        {/* Tarjeta 1: Solicitudes Pendientes (NARANJA) */}
                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm stat-card pending">
                                <Card.Body>
                                    <h2 className="stat-card-number">{renderStat(summary.pendientes)}</h2>
                                    <p className="stat-card-title">PENDIENTES</p>
                                </Card.Body>
                            </Card>
                        </Col>
                        
                        {/* Tarjeta 2: Solicitudes Finalizadas (VERDE) */}
                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm stat-card completed">
                                <Card.Body>
                                    <h2 className="stat-card-number">{renderStat(summary.finalizadas)}</h2>
                                    <p className="stat-card-title">FINALIZADAS</p>
                                </Card.Body>
                            </Card>
                        </Col>

                        {/* Tarjeta 3: Solicitudes Totales (GRIS OSCURO) */}
                        <Col md={4} className="mb-4">
                            <Card className="shadow-sm stat-card total">
                                <Card.Body>
                                    <h2 className="stat-card-number">{renderStat(summary.total)}</h2>
                                    <p className="stat-card-title">TOTALES CREADAS</p>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    <hr className="my-4" />
                    
                    {/* Botón para Navegar a la Vista de Solicitudes */}
                    <Row>
                        <Col md={6} className="mx-auto">
                            <div className="d-grid gap-2">
                                <Link to="/solicitudes">
                                    <Button variant="primary" size="lg" className="w-100 login-button-uf">
                                        Administrar Solicitudes
                                    </Button>
                                </Link>
                            </div>
                        </Col>
                    </Row>
                    
                </Container>
            </div>
        </>
    );
};

export default Dashboard;