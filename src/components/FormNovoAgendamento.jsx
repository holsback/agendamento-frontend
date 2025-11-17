import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

/**
 * (FORMULÁRIO INTELIGENTE)
 * Este formulário agora busca horários disponíveis no Backend.
 * Ele não usa mais a 'dataInicial' do clique no calendário.
 */
function FormNovoAgendamento({ onAgendamentoSucesso }) {

  // --- Estados dos Dropdowns ---
  const [listaProfissionais, setListaProfissionais] = useState([]);
  const [listaServicos, setListaServicos] = useState([]);
  
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null); // Guarda o { value, label } do profissional
  const [servicosSelecionados, setServicosSelecionados] = useState([]); // Guarda a lista de { value, label } dos serviços

  // --- Estados do Fluxo de Horário ---
  const [diaSelecionado, setDiaSelecionado] = useState(""); // Guarda o 'YYYY-MM-DD'
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]); // Guarda a lista de horários (ex: ["09:00", "10:30"])
  const [horarioSelecionado, setHorarioSelecionado] = useState(""); // Guarda o horário que o usuário clicou (ex: "10:30")
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [minDate, setMinDate] = useState(""); // Para travar datas passadas no calendário

  // --- Estados de Feedback ---
  const [carregandoComponente, setCarregandoComponente] = useState(true); // Para os selects iniciais
  const [carregandoSubmit, setCarregandoSubmit] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Estilos do Select (Tema Escuro)
  const darkSelectStyles = {
      control: (styles) => ({ ...styles, backgroundColor: '#2a2a2a', borderColor: '#555' }),
      menu: (styles) => ({ ...styles, backgroundColor: '#333' }),
      option: (styles, { isFocused, isSelected }) => ({
          ...styles,
          backgroundColor: isSelected ? '#0069ff' : isFocused ? '#444' : '#333',
          color: '#f0f0f0',
          ':active': { ...styles[':active'], backgroundColor: '#0069ff' },
      }),
      multiValue: (styles) => ({ ...styles, backgroundColor: '#444' }), 
      multiValueLabel: (styles) => ({ ...styles, color: '#f0f0f0' }),
      singleValue: (styles) => ({ ...styles, color: '#f0f0f0' }),
      placeholder: (styles) => ({ ...styles, color: '#aaa' }),
      input: (styles) => ({ ...styles, color: '#f0f0f0' })
  };

  // 1. Efeito que carrega os Profissionais e Serviços (só roda uma vez)
  useEffect(() => {
    async function carregarDados() {
        try {
            const [resProfissionais, resServicos] = await Promise.all([
                axios.get("http://localhost:8080/usuarios/profissionais"),
                axios.get("http://localhost:8080/servicos")
            ]);
            setListaProfissionais(resProfissionais.data.map(p => ({ value: p.id, label: p.nome })));
            setListaServicos(resServicos.data.map(s => ({ 
                value: s.id, 
                label: `${s.nome} - R$ ${s.preco} (${s.duracaoMinutos} min)` 
            })));
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setErro("Erro ao carregar opções de agendamento.");
        } finally {
            setCarregandoComponente(false);
        }
    }
    carregarDados();

    // Define a data mínima para o input 'date' (não permite agendar para o passado)
    const hoje = new Date();
    const offset = hoje.getTimezoneOffset();
    const hojeLocal = new Date(hoje.getTime() - (offset * 60000));
    setMinDate(hojeLocal.toISOString().split('T')[0]);

  }, []); // Array de dependências vazio = roda 1 vez

  // 2. Efeito que BUSCA HORÁRIOS (roda sempre que os 3 pilares mudam)
  useEffect(() => {
    // Limpa os horários antigos sempre que um dos 3 pilares mudar
    setHorariosDisponiveis([]);
    setHorarioSelecionado("");
    setErro(""); // Limpa erros antigos

    // Só busca na API se os 3 campos estiverem preenchidos
    if (profissionalSelecionado && servicosSelecionados.length > 0 && diaSelecionado) {
        
        // 2a. Calcula a duração total dos serviços selecionados
        const duracaoTotal = servicosSelecionados.reduce((total, servico) => {
            const match = servico.label.match(/(\d+)\s*min/);
            if (match) return total + parseInt(match[1]);
            return total;
        }, 0);

        if (duracaoTotal === 0) return; // Segurança

        // 2b. Busca na API
        async function buscarDisponibilidade() {
            setCarregandoHorarios(true);
            try {
                const resposta = await axios.get(`http://localhost:8080/usuarios/${profissionalSelecionado.value}/disponibilidade`, {
                    params: {
                        data: diaSelecionado, // ex: "2025-11-12"
                        duracao: duracaoTotal // ex: 90
                    }
                });
                setHorariosDisponiveis(resposta.data);
            } catch (err) {
                console.error("Erro ao buscar horários:", err);
                setErro("Não foi possível buscar os horários para esta data.");
            } finally {
                setCarregandoHorarios(false);
            }
        }
        buscarDisponibilidade();
    }
  }, [profissionalSelecionado, servicosSelecionados, diaSelecionado]); // Os 3 "gatilhos"

  // 3. Função final de AGENDAR (combina dia + hora)
  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregandoSubmit(true);
    setErro("");
    setSucesso("");

    try {
      // Combina o dia (YYYY-MM-DD) e a hora (HH:MM)
      const dataHoraFormatada = `${diaSelecionado}T${horarioSelecionado}`; 
      
      const listaIds = servicosSelecionados.map(opcao => opcao.value);
      const novoAgendamentoDTO = {
        profissionalId: profissionalSelecionado.value,
        servicosIds: listaIds,
        dataHora: dataHoraFormatada // Envia a data/hora combinada
      };
      await axios.post("http://localhost:8080/agendamentos", novoAgendamentoDTO);

      setSucesso("Agendamento criado com sucesso!");
      
      // Limpa tudo para o próximo agendamento
      setProfissionalSelecionado(null);
      setServicosSelecionados([]);
      setDiaSelecionado("");
      setHorarioSelecionado("");
      setHorariosDisponiveis([]);

      // Avisa o "Pai" (DashboardCliente) que terminamos
      if (onAgendamentoSucesso) {
          onAgendamentoSucesso();
      }
    } catch (erroApi) {
      console.error("Erro ao criar:", erroApi);
      if (erroApi.response && erroApi.response.data.message) {
          setErro(erroApi.response.data.message);
      } else {
        setErro("Erro ao criar agendamento.");
      }
    } finally {
      setCarregandoSubmit(false);
    }
  }
  
  // Função auxiliar para renderizar os botões de horário
  function renderizarSlotsDeHorario() {
    if (carregandoHorarios) {
        return <p style={{ color: '#aaa', textAlign: 'center' }}>Buscando horários...</p>;
    }
    // Se não está carregando, mas tem uma data E não achou horários
    if (horariosDisponiveis.length === 0 && diaSelecionado && profissionalSelecionado && servicosSelecionados.length > 0) {
        return <p style={{ color: '#aaa', textAlign: 'center' }}>Nenhum horário livre encontrado para esta data/duração.</p>;
    }
    
    // Se não tiver data/pro/serviço, não mostra nada
    if (horariosDisponiveis.length === 0) {
        return null; 
    }

    return (
        <div className="horarios-container">
            {horariosDisponiveis.map(horario => (
                <button
                    type="button" // Impede o botão de submeter o formulário
                    key={horario}
                    className={`horario-slot ${horario === horarioSelecionado ? 'selecionado' : ''}`}
                    onClick={() => setHorarioSelecionado(horario)}
                >
                    {horario}
                </button>
            ))}
        </div>
    );
  }

  // Se os selects ainda não carregaram, mostra mensagem
  if (carregandoComponente) return <p>Carregando opções...</p>;

  // Renderização principal do formulário
  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login">Fazer novo agendamento</h2>
      
      {/* Etapa 1: Profissional */}
      <div className="input-grupo">
        <label>Profissional</label>
        <Select
          options={listaProfissionais}
          value={profissionalSelecionado}
          onChange={setProfissionalSelecionado}
          placeholder="Selecione..."
          styles={darkSelectStyles}
        />
      </div>
      
      {/* Etapa 2: Serviços */}
      <div className="input-grupo">
        <label>Serviços (Combo)</label>
        <Select
          isMulti
          options={listaServicos}
          value={servicosSelecionados}
          onChange={setServicosSelecionados}
          placeholder="Selecione os serviços..."
          styles={darkSelectStyles}
          noOptionsMessage={() => "Nenhum serviço encontrado"}
        />
      </div>

      {/* Etapa 3: Dia (só aparece se os 2 acima estiverem OK) */}
      {(profissionalSelecionado && servicosSelecionados.length > 0) && (
        <div className="input-grupo">
          <label htmlFor="data">Dia</label>
          <input
            type="date"
            id="data"
            value={diaSelecionado}
            onChange={e => setDiaSelecionado(e.target.value)}
            min={minDate} // Impede selecionar datas passadas
            required
          />
        </div>
      )}

      {/* Etapa 4: Horário (Aparece dinamicamente) */}
      <div className="input-grupo">
            <label>{horariosDisponiveis.length > 0 ? 'Horários Disponíveis' : ''}</label>
            {renderizarSlotsDeHorario()}
      </div>

      {erro && <p className="mensagem-erro" style={{ marginTop: '10px' }}>{erro}</p>}
      {sucesso && <p className="mensagem-sucesso" style={{ marginTop: '10px' }}>{sucesso}</p>}
      
      {/* Botão de Agendar (só habilita se tudo estiver preenchido) */}
      <button
        type="submit"
        className="botao-login"
        disabled={carregandoSubmit || !profissionalSelecionado || servicosSelecionados.length === 0 || !horarioSelecionado}
        style={{ marginTop: '20px' }} // Garante a margem correta
      >
        {carregandoSubmit ? 'Agendando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  )
}

export default FormNovoAgendamento;