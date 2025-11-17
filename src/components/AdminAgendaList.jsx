import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Este componente é a "Lista de Gerenciamento" para o Admin.
 * Ele busca todos os agendamentos e permite atualizar o status.
 */
function AdminAgendaList() {

  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  // Busca todos os agendamentos (já vem ordenado do backend)
  async function buscarAgendaGeral() {
    setCarregando(true);
    try {
      const resposta = await axios.get("http://localhost:8080/agendamentos");
      setAgendamentos(resposta.data);
      setErro("");
    } catch (erroApi) {
      console.error("Erro ao buscar agenda geral:", erroApi);
      setErro("Não foi possível carregar a agenda geral.");
    } finally {
      setCarregando(false);
    }
  }

  // Roda uma vez quando o componente carrega
  useEffect(() => {
    buscarAgendaGeral();
  }, []);

  // Função para mudar o status (Concluir/Cancelar)
  async function atualizarStatus(idAgendamento, novoStatus) {
      if (!confirm(`ADMIN: Tem certeza que deseja marcar este agendamento como ${novoStatus}?`)) return;
      try {
          await axios.patch(`http://localhost:8080/agendamentos/${idAgendamento}/status`, {
              status: novoStatus
          });
          buscarAgendaGeral(); // Recarrega a lista
      } catch (erroApi) {
          alert("Erro ao atualizar status.");
      }
  }

  if (carregando) return <p>Carregando agenda geral...</p>;
  if (erro) return <p className="mensagem-erro">{erro}</p>;
  if (agendamentos.length === 0) return <p>Nenhum agendamento no sistema.</p>;

  // Usa a lista padrão
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
                    <button onClick={() => atualizarStatus(ag.idAgendamento, 'Concluído')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#2a9d8f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ✅ Concluir
                    </button>
                    <button onClick={() => atualizarStatus(ag.idAgendamento, 'Cancelado')}
                        style={{ flex: 1, padding: '8px', backgroundColor: '#e76f51', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        ❌ Cancelar
                    </button>
                </div>
            )}
        </li>
        ))}
    </div>
  );
}

export default AdminAgendaList;