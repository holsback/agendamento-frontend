import '../App.css'; 
import { useState, useEffect } from 'react'; 
import { useNavigate } from 'react-router-dom';
import FormNovoAgendamento from '../components/FormNovoAgendamento';
import axios from 'axios';

const IconeSeta = () => (
    <svg width="10" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

function DashboardCliente() {
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
  const [abaAtiva, setAbaAtiva] = useState('meus_agendamentos');
  const [refreshKey, setRefreshKey] = useState(0); 
  
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
          const resposta = await axios.get("/agendamentos"); 
          setMeusAgendamentos(resposta.data);
      } catch (error) {
          console.error("Erro ao buscar meus agendamentos:", error);
      } finally {
          setCarregandoLista(false);
      }
  }

  useEffect(() => {
      if (abaAtiva === 'meus_agendamentos') {
          buscarMeusAgendamentos();
      }
  }, [abaAtiva, refreshKey]); 

  function handleSucessoAgendamento() {
      setAbaAtiva('meus_agendamentos'); 
      setRefreshKey(prevKey => prevKey + 1); 
  }
  
  async function handleCancelar(id) {
      if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;
      
      try {
          await axios.patch(`/agendamentos/${id}/status`, {
              status: "Cancelado"
          });
          alert("Agendamento cancelado!");
          buscarMeusAgendamentos(); 
      } catch (error) {
          alert("Erro ao cancelar o agendamento.");
      }
  }

  function handleVincularGoogle(agendamento) {
      alert("Funcionalidade futura: Vincular agendamento " + agendamento.idAgendamento + " ao Google Calendar.");
  }
  
  function renderizarListaMeusAgendamentos() {
      if (carregandoLista) return <p>Carregando seus agendamentos...</p>;
      if (meusAgendamentos.length === 0) return <p>Você ainda não tem agendamentos.</p>;

      return (
          <ul className="lista-agendamentos">
              {meusAgendamentos.map(ag => {
                  // Define se existem botões para serem mostrados
                  const temBotoes = ag.status === 'Pendente';

                  return (
                    <li key={ag.idAgendamento} style={{ 
                        borderLeft: `4px solid ${ag.status === 'Concluído' ? '#2a9d8f' : '#0069ff'}`,
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start', 
                        gap: '20px'
                    }}>
                        
                        {/* === COLUNA DA ESQUERDA === */}
                        <div style={{ flex: 1 }}>
                            <strong style={{ fontSize: '1.3em', display: 'block', marginBottom: '10px' }}>
                                {ag.servicos.join(', ')}
                            </strong>

                            <div style={{ color: '#ccc', fontSize: '14px', marginBottom: '15px' }}>
                                <p style={{ marginBottom: '5px' }}>
                                    📅 {new Date(ag.dataHora).toLocaleDateString('pt-BR')} às {new Date(ag.dataHora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
                                </p>
                                <p style={{ margin: 0 }}>
                                    ✂️ Profissional: <span style={{ color: '#fff' }}>{ag.nomeProfissional}</span>
                                </p>
                            </div>
                        </div>

                        {/* === COLUNA DA DIREITA === */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-end', 
                            gap: '10px',
                            minWidth: '160px',
                            
                            // Se NÃO tem botões (Concluído/Cancelado), centraliza o Status verticalmente
                            alignSelf: temBotoes ? 'auto' : 'stretch', 
                            justifyContent: temBotoes ? 'flex-start' : 'center'
                        }}>
                            {/* STATUS */}
                            <span style={{
                                padding: '10px 16px', 
                                borderRadius: '8px', 
                                fontSize: '14px',    
                                fontWeight: 'bold',
                                textAlign: 'center',
                                width: '100%',   
                                boxSizing: 'border-box',
                                backgroundColor: ag.status === 'Concluído' ? '#2a4d2a' : ag.status === 'Cancelado' ? '#4d2626' : '#444',
                                color: ag.status === 'Concluído' ? '#9aff9a' : ag.status === 'Cancelado' ? '#ff8a80' : '#fff', 
                                border: ag.status === 'Pendente' ? '1px solid #666' : 'none'
                            }}>
                                {ag.status}
                            </span>

                            {/* BOTÃO VINCULAR (Agora só aparece se for Pendente) */}
                            {ag.status === 'Pendente' && (
                                <button 
                                    onClick={() => handleVincularGoogle(ag)}
                                    style={{ 
                                        padding: '10px 16px', 
                                        width: '100%', 
                                        boxSizing: 'border-box',
                                        backgroundColor: '#0069ff', 
                                        color: '#fff', 
                                        border: 'none', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer', 
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        transition: 'filter 0.2s'
                                    }}
                                    onMouseOver={(e) => { e.target.style.filter = 'brightness(1.1)'; }}
                                    onMouseOut={(e) => { e.target.style.filter = 'brightness(1.0)'; }}
                                >
                                    📅 Vincular
                                </button>
                            )}

                            {/* BOTÃO CANCELAR (Só se for Pendente) */}
                            {ag.status === 'Pendente' && (
                                <button onClick={() => handleCancelar(ag.idAgendamento)}
                                        style={{ 
                                            padding: '10px 16px', 
                                            width: '100%',        
                                            boxSizing: 'border-box',
                                            backgroundColor: '#e76f51', 
                                            color: 'white', 
                                            border: 'none', 
                                            borderRadius: '8px', 
                                            cursor: 'pointer', 
                                            fontWeight: 'bold',
                                            fontSize: '13px',
                                            transition: 'filter 0.2s'
                                        }}
                                        onMouseOver={(e) => { e.target.style.filter = 'brightness(1.1)'; }}
                                        onMouseOut={(e) => { e.target.style.filter = 'brightness(1.0)'; }}
                                >
                                    ❌ Cancelar
                                </button>
                            )}
                        </div>
                    </li>
                  );
              })}
          </ul>
      );
  }

  function renderizarConteudoPrincipal() {
      
      if (abaAtiva === 'meus_agendamentos') {
          return (
              <div className="content-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h2 className="titulo-login" style={{ margin: 0 }}>Meus Agendamentos</h2>
                      <button 
                          className="botao-login" 
                          style={{ marginTop: 0, padding: '8px 16px', fontSize: '14px' }}
                          onClick={() => setAbaAtiva('novo')}
                      >
                          + Novo
                      </button>
                  </div>
                  {renderizarListaMeusAgendamentos()}
              </div>
          );
      }
      
      if (abaAtiva === 'novo') {
          return (
              <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto' }}> 
                  <FormNovoAgendamento 
                      onAgendamentoSucesso={handleSucessoAgendamento} 
                  />
                  <button 
                      className="botao-secundario" 
                      style={{ width: '100%', marginTop: '10px' }}
                      onClick={() => setAbaAtiva('meus_agendamentos')}
                  >
                      Cancelar
                  </button>
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
                <li className={`sidebar-item ${abaAtiva === 'meus_agendamentos' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('meus_agendamentos')}>
                    📅 <span className="sidebar-item-text">Meus Agendamentos</span>
                </li>
                <li className={`sidebar-item ${abaAtiva === 'novo' ? 'active' : ''}`}
                    onClick={() => setAbaAtiva('novo')}>
                    ➕ <span className="sidebar-item-text">Novo Agendamento</span>
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
                    {abaAtiva === 'novo' ? 'Fazer Agendamento' : 'Painel do Cliente'}
                </h2>
                <span style={{ color: '#aaa' }}>Olá, Cliente!</span>
            </header>
            
            {renderizarConteudoPrincipal()}
        </main>
    </div>
  )
}

export default DashboardCliente