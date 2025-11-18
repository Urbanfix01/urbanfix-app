// src/components/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../AuthContext'; 
import { Navigate } from 'react-router-dom';

// El componente ProtectedRoute recibe el componente que queremos proteger (Dashboard)
const ProtectedRoute = ({ children }) => {
  // Obtenemos el usuario autenticado del contexto
  const { currentUser, loading } = useAuth();
  
  // Muestra un estado de carga mientras Firebase verifica el estado de la sesión
  if (loading) {
    // Puedes reemplazar esto con un spinner de carga de Bootstrap
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando...</div>;
  }

  // Si el usuario existe (está logeado), renderiza el componente hijo (Dashboard)
  if (currentUser) {
    return children;
  }

  // Si el usuario NO existe, redirige a la ruta de login
  return <Navigate to="/login" replace />;
};

export default ProtectedRoute;