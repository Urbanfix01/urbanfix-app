// src/AuthContext.js
// Gestiona el estado global de autenticación (si el usuario está logueado o no).

import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from './firebase'; // Importa la instancia de Auth desde tu archivo de configuración
import { onAuthStateChanged } from 'firebase/auth';

// 1. Crear el Contexto
const AuthContext = createContext();

// 2. Hook personalizado para usar el contexto fácilmente
// Permite que cualquier componente acceda al estado del usuario con: const { currentUser } = useAuth();
export const useAuth = () => useContext(AuthContext);

// 3. Crear el Proveedor (Provider)
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Almacena el objeto de usuario de Firebase
  const [loading, setLoading] = useState(true);        // Indica si Firebase ya cargó el estado inicial

  useEffect(() => {
    // onAuthStateChanged es la función clave: escucha los cambios de estado de autenticación de Firebase
    // Se ejecuta una vez al cargar la app y luego en cada inicio/cierre de sesión.
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      setLoading(false);
    });

    // Limpia la suscripción al desmontar el componente (buena práctica de React)
    return unsubscribe; 
  }, []); // Se ejecuta solo al montar (como un setup inicial)

  const value = {
    currentUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Muestra los componentes hijos SÓLO después de que Firebase haya cargado el estado */}
      {!loading && children}
    </AuthContext.Provider>
  );
};