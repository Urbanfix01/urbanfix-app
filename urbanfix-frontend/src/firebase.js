// src/firebase.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Configuración de Firebase (Tus claves)
const firebaseConfig = {
  apiKey: "AIzaSyCXncqtl4F6QMg05qi7zCRHZn5dxbnbAEc",
  authDomain: "urbanfix-crm-backend.firebaseapp.com",
  projectId: "urbanfix-crm-backend",
  storageBucket: "urbanfix-crm-backend.firebasestorage.app",
  messagingSenderId: "625706288709",
  appId: "1:625706288709:web:2c1031210da66e2d4dc52c",
  measurementId: "G-Z3NKV5XNWC"
};

// 2. Inicializar Firebase
const app = initializeApp(firebaseConfig);

// 3. Inicializar servicios clave y exportar
export const auth = getAuth(app); 
export const db = getFirestore(app);

// Exportamos 'auth' y 'db' para que el Login y las Solicitudes funcionen en React.
