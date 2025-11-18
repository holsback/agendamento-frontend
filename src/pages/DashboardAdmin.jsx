import '../App.css'; // Importa o CSS
import { useState, useEffect } from 'react'; // Importa "ganchos" do React
import axios from 'axios'; // Importa Axios para API
import { useNavigate } from 'react-router-dom'; // Importa hook de navegação
// Importa os Componentes "filhos" que este Dashboard usa
import FormCriarColaborador from '../components/FormCriarColaborador';
import AdminAgendaList from '../components/AdminAgendaList';
import FormConfiguracao from '../components/FormConfiguracao';
import AdminServicos from '../components/AdminServicos';
import AgendaCalendario from '../components/AgendaCalendario';

// Componente (React) para o ícone de seta (usado no botão de recolher)
const IconeSeta = () => (
    <svg width="10" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
        <path d="M5 1L1 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

/**
 * Esta é a Página Principal (Componente "Pai") do Dashboard do Admin
 */
function DashboardAdmin() {
  
  // --- Estados (Memória) do Componente ---
  const [colaboradores, setColaboradores] = useState([]); 
  const [carregando, setCarregando] = useState(true); 
  const [erro, setErro] = useState(""); 
  const [abaAtiva, setAbaAtiva] = useState('agenda'); 

  // Estado da sub-aba (Alteração do Passo 2.1: 'lista' é o padrão)
  const [subAbaAgenda, setSubAbaAgenda] = useState('lista'); 
  
  const [colaboradorEmEdicao, setColaboradorEmEdicao] = useState(null); 

  // Estado da sidebar (Alteração do Passo 1: 'false' é o padrão)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const navegar = useNavigate(); // Função para forçar a mudança de página

  /**
   * Função para deslogar o usuário.
   */
  function handleLogout() {
      localStorage.removeItem("authToken");
      delete axios.defaults.headers.common['Authorization'];
      navegar("/");
  }

    // Objeto para "traduzir" os nomes das ROLES
    const nomesPerfis = {
      "ROLE_MASTER": "Master", "ROLE_DONO": "Dono", "ROLE_GERENTE": "Gerente",
      "ROLE_PROFISSIONAL": "Profissional", "ROLE_CLIENTE": "Cliente"
    };

    /**
     * Função que busca na API a lista de colaboradores (membros da equipe).
     */
    async function buscarColaboradores() {
      setCarregando(true);
      try {
        const resposta = await axios.get("http://localhost:8080/admin/listar-colaboradores");
        setColaboradores(resposta.data); setErro("");
      } catch (erroApi) {
        console.error("Erro ao listar:", erroApi); setErro("Não foi possível carregar a equipe.");
      } finally {
        setCarregando(false);
      }
    }

    /**
     * Função para deletar um colaborador pelo ID.
     */
    async function deletarColaborador(id, nome) {
      if (!confirm(`Tem certeza que deseja deletar ${nome}?`)) return;
      try {
          await axios.delete(`http://localhost:8080/admin/deletar-colaborador/${id}`);
          alert("Colaborador deletado!"); 
          buscarColaboradores(); // Recarrega a lista
      } catch (erroApi) {
          alert("Erro ao deletar (verifique se ele não tem agendamentos vinculados).");
      }
    }

    /**
     * Efeito (useEffect) que roda UMA VEZ quando a página carrega.
     */
    useEffect(() => { 
        buscarColaboradores(); 
    }, []); // Array vazio [] = roda só uma vez

    /**
     * Função "Callback" que é passada para o FormCriarColaborador.
     */
    function handleSucessoEquipe() {
        buscarColaboradores(); // Recarrega a lista
        setColaboradorEmEdicao(null); // Limpa o modo de edição
    }

    /**
     * Função que renderiza (desenha) a lista de membros na aba "Equipe".
     */
    function renderizarListaMembros() {
        if (carregando) return <p>Carregando equipe...</p>;
        if (erro) return <p className="mensagem-erro">{erro}</p>;
        if (colaboradores.length === 0) return <p>Nenhum membro encontrado.</p>;
        
        return (
            <ul className="lista-agendamentos">
                {colaboradores.map(colab => (
                    <li key={colab.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <strong style={{ fontSize: '16px', marginBottom: '4px' }}>{colab.nome}</strong>
                            <span style={{ color: '#0069ff', fontSize: '13px', fontWeight: 'bold' }}>
                                {nomesPerfis[colab.perfil] || colab.perfil}
                            </span>
                            <p style={{ fontSize: '13px', color: '#aaa', margin: '4px 0 0 0' }}>{colab.email}</p>
                            <p style={{ fontSize: '13px', color: '#aaa', margin: '0' }}>{colab.telefone}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button onClick={() => setColaboradorEmEdicao(colab)}
                                    style={{ backgroundColor: '#0069ff33', color: '#0069ff', border: '1px solid #0069ff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                Editar
                            </button>
                            <button onClick={() => deletarColaborador(colab.id, colab.nome)}
                                    style={{ backgroundColor: '#4d2626', color: '#ff8a80', border: '1px solid #ff8a80', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                Excluir
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        );
    }

  /**
   * Função principal que decide qual CONTEÚDO mostrar na área da direita.
   */
  function renderizarConteudoPrincipal() {
      
      // 1. ABA AGENDA GERAL
      if (abaAtiva === 'agenda') {
          return (
              <div className="content-card">
                  
                  {/* === NOSSA ALTERAÇÃO DESTE PASSO ESTÁ AQUI === */}
                  {/* Invertemos a ordem dos dois blocos <div> abaixo */}
                  <div className="sub-abas-container">
                      {/* O Gerenciar (Lista) agora vem primeiro no código HTML */}
                      <div 
                          className={`sub-aba ${subAbaAgenda === 'lista' ? 'active' : ''}`}
                          onClick={() => setSubAbaAgenda('lista')}
                      >
                          Gerenciar (Lista)
                      </div>
                      {/* O Visão (Calendário) agora vem depois */}
                      <div 
                          className={`sub-aba ${subAbaAgenda === 'calendario' ? 'active' : ''}`}
                          onClick={() => setSubAbaAgenda('calendario')}
                      >
                          Visão (Calendário)
                      </div>
                  </div>
                  {/* --- FIM DA ALTERAÇÃO --- */}

                  
                  {/* A lógica de qual componente mostrar continua a mesma */}
                  {/* Como 'subAbaAgenda' começa como 'lista', <AdminAgendaList /> será mostrado */}
                  {subAbaAgenda === 'calendario' ? <AgendaCalendario /> : <AdminAgendaList />}
              </div>
          );
      
      // 2. ABA GESTÃO DE EQUIPE (Layout de 2 colunas)
      } else if (abaAtiva === 'equipe') {
          return (
              <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
                  {/* Coluna da Esquerda: Formulário */}
                  <div style={{ flex: 1, minWidth: '300px' }}>
                      <div className="content-card">
                          <FormCriarColaborador 
                              onColaboradorCriado={handleSucessoEquipe} 
                              colaboradorParaEditar={colaboradorEmEdicao} 
                              onCancelarEdicao={() => setColaboradorEmEdicao(null)} 
                          />
                      </div>
                  </div>
                  {/* Coluna da Direita: Lista */}
                  <div style={{ flex: 1.5, minWidth: '300px' }}>
                      <div className="content-card">
                          <h2 className="titulo-login" style={{ marginTop: 0 }}>Lista de Membros</h2>
                          {renderizarListaMembros()}
                      </div>
                  </div>
              </div>
          );
      
      // 3. ABA SERVIÇOS
      } else if (abaAtiva === 'servicos') {
           return <AdminServicos />;
      
      // 4. ABA CONFIGURAÇÕES
      } else if (abaAtiva === 'config') {
          return ( <div className="content-card"><FormConfiguracao /></div> );
      }
  }

  // --- Renderização (HTML) da página ---
  return (
    <div className="admin-container">
      {/* SIDEBAR (Barra Lateral Esquerda) */}
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

          {/* Menu de Navegação Principal */}
          <ul className="sidebar-menu">
              <li className={`sidebar-item ${abaAtiva === 'agenda' ? 'active' : ''}`}
                  onClick={() => setAbaAtiva('agenda')}>
                  📅 <span className="sidebar-item-text">Agenda Geral</span>
              </li>
              <li className={`sidebar-item ${abaAtiva === 'equipe' ? 'active' : ''}`}
                  onClick={() => setAbaAtiva('equipe')}>
                  👥 <span className="sidebar-item-text">Gestão de Equipe</span>
              </li>
              <li className={`sidebar-item ${abaAtiva === 'servicos' ? 'active' : ''}`}
                  onClick={() => setAbaAtiva('servicos')}>
                  ✂️ <span className="sidebar-item-text">Serviços</span>
              </li>
              <li className={`sidebar-item ${abaAtiva === 'config' ? 'active' : ''}`}
                  onClick={() => setAbaAtiva('config')}>
                  ⚙️ <span className="sidebar-item-text">Configurações</span>
              </li>
          </ul>

          {/* Botão de Sair */}
          <div className="sidebar-logout" onClick={handleLogout}>
            <span style={{ transform: 'rotate(180deg)' }}>➔</span>
            <span className="sidebar-item-text">Sair</span>
          </div>

      </aside>

      {/* CONTEÚDO PRINCIPAL (Área da Direita) */}
      <main className="admin-content">
          {/* Cabeçalho */}
          <header className="admin-header">
              <h2>
                  {abaAtiva === 'agenda' ? 'Agenda Geral' : 
                   abaAtiva === 'equipe' ? 'Gestão de Equipe' : 
                   abaAtiva === 'servicos' ? 'Catálogo de Serviços' : 
                   'Configurações'}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#aaa' }}>Olá, Admin</span>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#333', border: '2px solid #0069ff' }}></div>
              </div>
          </header>

          {/* Renderiza o conteúdo da aba selecionada */}
          {renderizarConteudoPrincipal()}
      </main>
    </div>
  )
}

export default DashboardAdmin;