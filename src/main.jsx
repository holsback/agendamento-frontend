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

// --- CONFIGURAÇÃO GLOBAL DO AXIOS ---

// Pega o token do (localStorage) se ele existir
const token = localStorage.getItem("authToken");
if (token) {
  // Coloca o (token) em todas as requisições futuras
  // Isso é o que mantém o usuário logado
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// === NOSSA ALTERAÇÃO DESTE PASSO ESTÁ AQUI ===
// Definimos a "URL Base" da nossa API.
// Agora, o Axios sabe que TODA requisição deve ir para este endereço.
// Quando chamarmos axios.post('/auth/login'), ele automaticamente
// vai chamar "http://localhost:8080/auth/login".
axios.defaults.baseURL = 'http://localhost:8080';
// --- FIM DA ALTERAÇÃO ---


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

      // Verifica se o erro NÃO aconteceu nas telas de login ou registro.
      // (Se o erro foi no login, não queremos deslogar o usuário, só mostrar "senha errada")
      const url = error.config.url;
      
      // === ATUALIZAÇÃO IMPORTANTE NA LÓGICA ===
      // Como agora usamos baseURL, o error.config.url será relativo (ex: '/auth/login')
      // Então, verificamos se a URL *termina* com /login ou /registrar
      if (!url.endsWith('/auth/login') && !url.endsWith('/auth/registrar')) {
        
        console.warn("Token vencido ou inválido! Forçando logout...");
        localStorage.removeItem("authToken"); // Remove o token quebrado
        delete axios.defaults.headers.common['Authorization']; // Limpa o "crachá"
        
        // Redireciona para o login
        window.location.href = "/";
      }
    }
    // Repassa o erro para o componente local (ex: LoginPage) poder tratar
    return Promise.reject(error);
  }
);

// --- DEFINIÇÃO DAS ROTAS (PÁGINAS) ---
const router = createBrowserRouter([
  {
    path: "/", // A página inicial (raiz)
    element: <LoginPage />, // Mostra o componente LoginPage
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

// "Renderize" (desenhe) o aplicativo na tela
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* O RouterProvider é o que "lê" a URL e mostra a página correta */}
    <RouterProvider router={router} /> 
  </React.StrictMode>,
)