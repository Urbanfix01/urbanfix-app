// src/index.js 

import React from 'react';
import ReactDOM from 'react-dom/client';
// 🌟 ¡Esta es la línea clave que se movió al inicio! 🌟
import 'bootstrap/dist/css/bootstrap.min.css'; 

import { AuthProvider } from './AuthContext'; 
import App from './App';
import { BrowserRouter } from 'react-router-dom'; 

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter> 
      <AuthProvider> 
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);