import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import axios from 'axios'

import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardCliente from './pages/DashboardCliente.jsx'
import DashboardAdmin from './pages/DashboardAdmin.jsx'
import DashboardProfissional from './pages/DashboardProfissional.jsx'

// Pega o token do (localStorage) se ele existir
const token = localStorage.getItem("authToken");
if (token) {
  // Coloca o (token) em todas as requisições futuras
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// --- INTERCEPTOR GLOBAL DE ERROS ---
axios.interceptors.response.use(
  (response) => {
    // Se a resposta for sucesso (2xx), apenas continue
    return response;
  },
  (error) => {
    // Se der erro...
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {

      // Verifica se o erro NÃO aconteceu nas telas de login ou registro.
      // Se o erro foi em qualquer OUTRA tela, significa que o token venceu e devemos deslogar.
      const url = error.config.url;
      if (!url.endsWith('/auth/login') && !url.endsWith('/auth/registrar')) {
        
        console.warn("Token vencido ou inválido! Forçando logout...");
        localStorage.removeItem("authToken");
        delete axios.defaults.headers.common['Authorization'];
        
        // Redireciona para o login
        window.location.href = "/";
      }
    }
    // Repassa o erro para o componente local (ex: LoginPage) poder tratar
    return Promise.reject(error);
  }
);

const router = createBrowserRouter([
  {
    path: "/", 
    element: <LoginPage />, 
  },
  {
    path: "/registrar",
    element: <RegisterPage />,
  },
  {
    path: "/dashboard-cliente",
    element: <DashboardCliente />,
  },
  {
    path: "/dashboard-admin",
    element: <DashboardAdmin />,
  },
  {
    path: "/dashboard-profissional",
    element: <DashboardProfissional />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} /> 
  </React.StrictMode>,
)