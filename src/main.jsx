import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
// Importa as ferramentas de roteamento (para definir as URLs do site)
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
// Importa o Axios (nosso "mensageiro" para a API)
import axios from 'axios'

// Importa todas as nossas Páginas
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardCliente from './pages/DashboardCliente.jsx'
import DashboardAdmin from './pages/DashboardAdmin.jsx'
import DashboardProfissional from './pages/DashboardProfissional.jsx'
import VerificarEmailPage from './pages/VerificarEmailPage.jsx'

// --- CONFIGURAÇÃO GLOBAL DO AXIOS ---

// Pega o token do (localStorage) se ele existir
const token = localStorage.getItem("authToken");
if (token) {
  // Coloca o (token) em todas as requisições futuras
  // Isso é o que mantém o usuário logado
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// URL Base da API (Backend)
axios.defaults.baseURL = 'http://localhost:8080';


// --- INTERCEPTOR GLOBAL DE ERROS ---
// (Isso é um "vigia" que olha todas as RESPOSTAS da API)
axios.interceptors.response.use(
  (response) => {
    // Se a resposta for sucesso (2xx), apenas continue
    return response;
  },
  (error) => {
    // Se der erro...
    // 401 (Não Autorizado) ou 403 (Proibido) significam que o token venceu ou é inválido.
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {

      // Verifica se o erro NÃO aconteceu nas telas de login ou registro ou verificação.
      const url = error.config.url;
      
      // Se o erro não foi no login, registro ou verificação de email, desloga o usuário
      if (!url.endsWith('/auth/login') && 
          !url.endsWith('/auth/registrar') && 
          !url.includes('/auth/verificar-email')) { // <--- PROTEÇÃO DE VERIFICAÇÃO
        
        console.warn("Token vencido ou inválido! Forçando logout...");
        localStorage.removeItem("authToken"); // Remove o token quebrado
        delete axios.defaults.headers.common['Authorization']; // Limpa o "crachá"
        
        // Redireciona para o login
        window.location.href = "/";
      }
    }
    // Repassa o erro para o componente local poder tratar
    return Promise.reject(error);
  }
);

// --- DEFINIÇÃO DAS ROTAS (PÁGINAS) ---
const router = createBrowserRouter([
  {
    path: "/", // A página inicial (raiz) - Login
    element: <LoginPage />, 
  },
  {
    path: "/registrar", // Página de criar conta
    element: <RegisterPage />,
  },
  {
    path: "/verificar-email", // Verificação de E-mail
    element: <VerificarEmailPage />,
  },
  {
    path: "/dashboard-cliente", // Área do Cliente
    element: <DashboardCliente />,
  },
  {
    path: "/dashboard-admin", // Área do Admin
    element: <DashboardAdmin />,
  },
  {
    path: "/dashboard-profissional", // Área do Profissional
    element: <DashboardProfissional />,
  }
]);

// "Renderize" (desenhe) o aplicativo na tela
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} /> 
  </React.StrictMode>,
)