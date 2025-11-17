import '../App.css';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import AgendaCalendario from '../components/AgendaCalendario'; 
import axios from 'axios';
import AdminAgendaList from '../components/AdminAgendaList';

const IconeSeta = () => (
    <svg width="10" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

function DashboardProfissional() {
  const [nomeProfissional, setNomeProfissional] = useState("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 
  const [abaAtiva, setAbaAtiva] = useState('calendario');

  const navegar = useNavigate();

  function handleLogout() {
      localStorage.removeItem("authToken");
      delete axios.defaults.headers.common['Authorization'];
      navegar("/");
  }

  useEffect(() => {
     const token = localStorage.getItem("authToken");
     if (token) {
         const decoded = jwtDecode(token);
         setNomeProfissional(decoded.sub);
     }
  }, []);

  return (
    <div className="admin-container">
        <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            
            <button 
                className="sidebar-toggle" 
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            >
                <IconeSeta />
            </button>

            <div className="sidebar-logo">
                ✂️ <span className="sidebar-logo-text">Agenda.Fácil</span>
            </div>
            
            {/* 3. Menu principal */}
            <ul className="sidebar-menu">
                <li 
                    className={`sidebar-item ${abaAtiva === 'calendario' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('calendario')}
                >
                    📅 <span className="sidebar-item-text">Minha Agenda</span>
                </li>
                <li 
                    className={`sidebar-item ${abaAtiva === 'lista' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('lista')}
                >
                    📋 <span className="sidebar-item-text">Gerenciar</span>
                </li>
            </ul>

            <div className="sidebar-logout" onClick={handleLogout}>
              <span style={{ transform: 'rotate(180deg)' }}>➔</span>
              <span className="sidebar-item-text">Sair</span>
            </div>
        </aside>

        <main className="admin-content">
            <header className="admin-header">
                <h2>
                    {abaAtiva === 'calendario' ? 'Minha Agenda (Visão)' : 'Gerenciar Agendamentos'}
                </h2>
                <span style={{ color: '#aaa' }}>Logado como: {nomeProfissional}</span>
            </header>
            
            {/* 4. Renderiza o componente certo baseado na aba */}
            <div className="content-card">
                {abaAtiva === 'calendario' ? <AgendaCalendario /> : <AdminAgendaList />}
            </div>
        </main>
    </div>
  )
}

export default DashboardProfissional;