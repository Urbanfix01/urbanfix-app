// src/App.js
// Componente principal de la aplicación que maneja las rutas.

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext.js'; 
import './App.css';
import './login.css'; 

// 1. Importamos los componentes de la interfaz
import Login from './components/login.js'; 
import Solicitudes from './components/Form_Responses/solicitudes.js';
import SolicitudForm from'./components/Form_Responses/SolicitudForm.js';
import Cotizacion from './components/Cotizacion.js'; 
// --- ¡NUEVA IMPORTACIÓN! ---
// Importamos el Dashboard para usarlo como lobby
import Dashboard from './components/Dashboard.js';

// 2. Definición del componente PrivateRoute (Guardia de Ruta)
// (Esta lógica está correcta)
const PrivateRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    
    if (loading) {
        return <p className="loading-message">Cargando...</p>;
    }

    return currentUser ? children : <Navigate to="/login" replace />;
};

function App() {
    return (
        <div className="App">
            <Routes>
                
                {/* Ruta pública: Login */}
                <Route path="/login" element={<Login />} />

                {/* Ruta pública: Solicitar */}
                <Route path="/solicitar" element={<SolicitudForm />} />
                
                {/* --- RUTA CORREGIDA: DASHBOARD (LOBBY) --- */}
                {/* Ahora esta es la ruta principal del admin */}
                <Route 
                    path="/dashboard"
                    element={
                        <PrivateRoute>
                            <Dashboard />
                        </PrivateRoute>
                    }
                />

                {/* RUTA SECUNDARIA: Solicitudes */}
                {/* Se mantiene protegida, pero ya no es la principal */}
                <Route 
                    path="/solicitudes"
                    element={
                        <PrivateRoute>
                            <Solicitudes />
                        </PrivateRoute>
                    }
                />

                {/* Ruta Privada: Cotización (Protegida) */}
                <Route
                    path="/cotizar/:id"
                    element={
                        <PrivateRoute>
                            <Cotizacion />
                        </PrivateRoute>
                    }
                />
                
                {/* --- REDIRECCIÓN CORREGIDA --- */}
                {/* Si alguien va a la raíz, lo mandamos al Dashboard (lobby) */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
            </Routes>
        </div>
    );
}

export default App;