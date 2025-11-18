// src/components/Header.jsx
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { Navbar, Nav, Button, Container } from 'react-bootstrap';
import { useAuth } from '../AuthContext'; 
import { auth } from '../firebase'; 

function AdminHeader() {
    const { currentUser } = useAuth(); 
    const navigate = useNavigate();
    
    // Función de Cerrar Sesión
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login'); 
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
    };

    if (!currentUser) {
        return null;
    }

    return (
        // Estilos de la barra naranja (background-color)
        <Navbar expand="lg" className="dashboard-navbar" data-bs-theme="dark" style={{ backgroundColor: '#ff7f41' }}>
            <Container fluid className="px-4">
                
                {/* 1. Logo y Título de Marca */}
                <Navbar.Brand as={Link} to="/dashboard" className="d-flex align-items-center me-4">
                    <img 
                        src="/logo_blanco.png" // <-- RUTA ACTUALIZADA PARA EL LOGO BLANCO
                        alt="Urbanfix Logo" 
                        style={{ height: '35px' }} 
                    />
                    {/* Texto Admin (Opcional, si quieres que se vea) */}
                    <span className="fw-bold text-light ms-2">Admin</span> 
                </Navbar.Brand>

                {/* 2. Enlaces de Navegación */}
                <Navbar.Toggle aria-controls="admin-navbar-nav" />
                <Navbar.Collapse id="admin-navbar-nav">
                    <Nav className="me-auto"> 
                        {/* Se usa Nav.Link as={Link} para una navegación fluida con React Router */}
                        <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                        <Nav.Link as={Link} to="/solicitudes">Solicitudes</Nav.Link>
                    </Nav>
                    
                    {/* 3. Información de Sesión y Logout */}
                    <Nav className="d-flex align-items-center">
                        <Nav.Item className="text-light me-3">
                            <small>Conectado como:</small> <strong>{currentUser.email}</strong>
                        </Nav.Item>
                        <Button 
                            variant="outline-light" 
                            onClick={handleLogout}
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
}

export default AdminHeader;