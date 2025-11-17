import '../App.css'; 
import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import FormNovoAgendamento from '../components/FormNovoAgendamento';
import AgendaCalendario from '../components/AgendaCalendario';
import axios from 'axios';

const IconeSeta = () => (
    <svg width="10" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

function DashboardCliente() {
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); 
  const [abaAtiva, setAbaAtiva] = useState('calendario');
  const [refreshKey, setRefreshKey] = useState(0); 
  const [dataClicada, setDataClicada] = useState(""); 
  
  const [meusAgendamentos, setMeusAgendamentos] = useState([]);
  const [carregandoLista, setCarregandoLista] = useState(true);

  const navegar = useNavigate();

  function handleLogout() {
      localStorage.removeItem("authToken");
      delete axios.defaults.headers.common['Authorization'];
      navegar("/");
  }

  async function buscarMeusAgendamentos() {
      setCarregandoLista(true);
      try {
          const resposta = await axios.get("http://localhost:8080/agendamentos"); 
          setMeusAgendamentos(resposta.data);
      } catch (error) {
          console.error("Erro ao buscar meus agendamentos:", error);
      } finally {
          setCarregandoLista(false);
      }
  }

  useEffect(() => {
      if (abaAtiva === 'gerenciar') {
          buscarMeusAgendamentos();
      }
  }, [abaAtiva, refreshKey]); 

  function handleSucessoAgendamento() {
      setAbaAtiva('calendario'); 
      setRefreshKey(prevKey => prevKey + 1); 
      setDataClicada(""); 
  }

  function handleDateClick(dataISO) {
      setDataClicada(dataISO); 
      setAbaAtiva('novo');      
  }
  
  async function handleCancelar(id) {
      if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
      
      try {
          await axios.patch(`http://localhost:8080/agendamentos/${id}/status`, {
              status: "Cancelado"
          });
          alert("Agendamento cancelado!");
          buscarMeusAgendamentos(); 
          setRefreshKey(prevKey => prevKey + 1); 
      } catch (error) {
          alert("Erro ao cancelar o agendamento.");
      }
  }
  
  function renderizarGerenciamento() {
      if (carregandoLista) return <p>Carregando...</p>;
      if (meusAgendamentos.length === 0) return <p>Nenhum agendamento encontrado.</p>;

      return (
          <ul className="lista-agendamentos">
              {meusAgendamentos.map(ag => (
                  <li key={ag.idAgendamento}>
                      <div className="linha-item">
                          <strong>{ag.servicos.join(', ')}</strong>
                          <span style={{
                              padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                              backgroundColor: ag.status === 'Concluído' ? '#2a4d2a' : ag.status === 'Cancelado' ? '#4d2626' : '#444',
                              color: ag.status === 'Concluído' ? '#9aff9a' : ag.status === 'Cancelado' ? '#ff8a80' : '#ccc'
                          }}>
                              {ag.status}
                          </span>
                      </div>
                      <p>Com: {ag.nomeProfissional}</p>
                      <p>Em: {new Date(ag.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                      
                      {ag.status === 'Pendente' && (
                          <div style={{ marginTop: '15px' }}>
                              <button onClick={() => handleCancelar(ag.idAgendamento)}
                                      style={{ width: '100%', padding: '8px', backgroundColor: '#e76f51', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                  ❌ Cancelar Agendamento
                              </button>
                          </div>
                      )}
                  </li>
              ))}
          </ul>
      );
  }

  // Decide o que mostrar na área principal
  function renderizarConteudoPrincipal() {
      
      if (abaAtiva === 'novo') {
          return (
              <div className="content-card"> 
                  <FormNovoAgendamento 
                      onAgendamentoSucesso={handleSucessoAgendamento} 
                      dataInicial={dataClicada}
                  />
              </div>
          );
      }
      
      if (abaAtiva === 'calendario') {
          return (
              <div className="content-card">
                  <p style={{textAlign: 'center', color: '#aaa', marginTop: '-15px', marginBottom: '20px'}}>
                      Clique em um horário vago no calendário para agendar.
                  </p>
                  <AgendaCalendario 
                      key={refreshKey} 
                      onDateClick={handleDateClick}
                  />
              </div>
          );
      }
      
      if (abaAtiva === 'gerenciar') {
          return (
              <div className="content-card">
                  <h2 className="titulo-login" style={{ marginTop: 0 }}>Gerenciar meus Agendamentos</h2>
                  {renderizarGerenciamento()}
              </div>
          );
      }
  }

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
            <ul className="sidebar-menu">
                <li className={`sidebar-item ${abaAtiva === 'calendario' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('calendario')}>
                    📅 <span className="sidebar-item-text">Meus Agendamentos</span>
                </li>
                <li className={`sidebar-item ${abaAtiva === 'novo' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('novo')}>
                    ➕ <span className="sidebar-item-text">Novo Agendamento</span>
                </li>
                <li className={`sidebar-item ${abaAtiva === 'gerenciar' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('gerenciar')}>
                    📋 <span className="sidebar-item-text">Gerenciar / Cancelar</span>
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
                    {abaAtiva === 'novo' ? 'Fazer Agendamento' : 
                     abaAtiva === 'calendario' ? 'Meus Agendamentos' : 
                     'Gerenciar Agendamentos'}
                </h2>
                <span style={{ color: '#aaa' }}>Olá, Cliente!</span>
            </header>
            
            {renderizarConteudoPrincipal()}
        </main>
    </div>
  )
}

export default DashboardCliente