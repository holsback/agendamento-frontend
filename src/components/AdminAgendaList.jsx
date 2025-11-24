import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import ConfirmationModal from './ConfirmationModal';

/**
 * Lista de Gerenciamento (Admin).
 */
function AdminAgendaList() {

  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  
  // === ESTADOS DO MODAL ===
  const [modalAberto, setModalAberto] = useState(false);
  const [idSelecionado, setIdSelecionado] = useState(null);
  const [statusSelecionado, setStatusSelecionado] = useState(""); // "Concluído" ou "Cancelado"

  // Busca todos os agendamentos
  async function buscarAgendaGeral() {
    setCarregando(true);
    try {
      const resposta = await axios.get("/agendamentos");
      setAgendamentos(resposta.data);
    } catch (erroApi) {
      console.error("Erro ao buscar agenda geral:", erroApi);
      toast.error("Não foi possível carregar a agenda geral.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    buscarAgendaGeral();
  }, []);

  // === FUNÇÃO 1: PREPARAR AÇÃO (Abre o Modal) ===
  function solicitarAtualizacao(idAgendamento, novoStatus) {
      setIdSelecionado(idAgendamento);
      setStatusSelecionado(novoStatus);
      setModalAberto(true); // Abre a janela
  }

  // === FUNÇÃO 2: EXECUTAR AÇÃO (Chama a API) ===
  async function confirmarAtualizacao() {
      setModalAberto(false); // Fecha a janela
      
      try {
          await axios.patch(`/agendamentos/${idSelecionado}/status`, {
              status: statusSelecionado
          });
          
          // Feedback visual diferente dependendo da ação
          if (statusSelecionado === 'Concluído') {
              toast.success("Agendamento concluído com sucesso!");
          } else {
              toast.success("Agendamento cancelado.");
          }
          
          buscarAgendaGeral(); // Recarrega a lista
      } catch (erroApi) {
          toast.error("Erro ao atualizar o status do agendamento.");
      }
  }

  // === AUXILIAR: Textos Dinâmicos do Modal ===
  const getTituloModal = () => {
      return statusSelecionado === 'Concluído' ? 'Concluir Atendimento?' : 'Cancelar Agendamento?';
  };

  const getMensagemModal = () => {
      return statusSelecionado === 'Concluído' 
          ? 'Deseja marcar este serviço como realizado?' 
          : 'Tem certeza que deseja cancelar? O horário ficará livre novamente.';
  };

  if (carregando) return <p>Carregando agenda geral...</p>;
  if (agendamentos.length === 0) return <p>Nenhum agendamento no sistema.</p>;

  return (
    <div className="lista-agendamentos"> 
        {agendamentos.map(ag => (
        <li key={ag.idAgendamento} style={{ borderLeft: '4px solid #0069ff' }}>
            
            <div className="linha-item">
                <strong>
                {new Date(ag.dataHora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </strong>
                {/* Status Badge */}
                <span style={{
                    padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginLeft: '10px',
                    backgroundColor: ag.status === 'Concluído' ? '#2a4d2a' : ag.status === 'Cancelado' ? '#4d2626' : '#444',
                    color: ag.status === 'Concluído' ? '#9aff9a' : ag.status === 'Cancelado' ? '#ff8a80' : '#ccc'
                }}>
                    {ag.status}
                </span>
            </div>

            <div style={{ marginTop: '10px' }}>
                <p style={{ color: '#0069ff', fontWeight: 'bold', marginBottom: '5px' }}>
                     Profissional: {ag.nomeProfissional}
                </p>
                <strong>{ag.servicos.join(', ')}</strong>
                <p>Cliente: {ag.nomeCliente}</p>
            </div>

            {/* Botões de Ação */}
            {ag.status === 'Pendente' && (
                <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                    {/* Botão Concluir -> Chama solicitarAtualizacao com 'Concluído' */}
                    <button onClick={() => solicitarAtualizacao(ag.idAgendamento, 'Concluído')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ✅ Concluir
                    </button>
                    
                    {/* Botão Cancelar -> Chama solicitarAtualizacao com 'Cancelado' */}
                    <button onClick={() => solicitarAtualizacao(ag.idAgendamento, 'Cancelado')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#e76f51', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ❌ Cancelar
                    </button>
                </div>
            )}
        </li>
        ))}

        {/* === MODAL DE CONFIRMAÇÃO === */}
        <ConfirmationModal 
            isOpen={modalAberto}
            titulo={getTituloModal()}
            mensagem={getMensagemModal()}
            onClose={() => setModalAberto(false)}
            onConfirm={confirmarAtualizacao}
        />
    </div>
  );
}

export default AdminAgendaList;