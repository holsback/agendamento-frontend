import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { toast } from 'sonner';
import Spinner from './Spinner';

/**
 * (FORMULÁRIO INTELIGENTE)
 * Agora com Feedback visual moderno (Toasts e Spinner).
 */
function FormNovoAgendamento({ onAgendamentoSucesso }) {

  // --- Estados dos Dropdowns ---
  const [listaProfissionais, setListaProfissionais] = useState([]); 
  const [profissionaisDados, setProfissionaisDados] = useState([]); 
  const [todasOpcoesServicos, setTodasOpcoesServicos] = useState([]); 
  const [listaServicos, setListaServicos] = useState([]); 
  
  const [profissionalSelecionado, setProfissionalSelecionado] = useState(null); 
  const [servicosSelecionados, setServicosSelecionados] = useState([]); 

  // --- Estados do Fluxo de Horário ---
  const [diaSelecionado, setDiaSelecionado] = useState(""); 
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]); 
  const [horarioSelecionado, setHorarioSelecionado] = useState(""); 
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [minDate, setMinDate] = useState(""); 

  // --- Estados de Feedback ---
  const [carregandoComponente, setCarregandoComponente] = useState(true); 
  const [carregandoSubmit, setCarregandoSubmit] = useState(false);

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

  // Efeito que carrega os Profissionais e Serviços
  useEffect(() => {
    async function carregarDados() {
        try {
            const [resProfissionais, resServicos] = await Promise.all([
                axios.get("/usuarios/profissionais"),
                axios.get("/servicos")
            ]);
            setProfissionaisDados(resProfissionais.data);
            setListaProfissionais(resProfissionais.data.map(p => ({ value: p.id, label: p.nome })));
            
            const catalogoCompleto = resServicos.data.map(s => ({ 
                value: s.id, 
                label: `${s.nome} - R$ ${s.preco} (${s.duracaoMinutos} min)` 
            }));
            setTodasOpcoesServicos(catalogoCompleto);
            setListaServicos([]);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            toast.error("Erro ao carregar opções de agendamento.");
        } finally {
            setCarregandoComponente(false);
        }
    }
    carregarDados();

    const hoje = new Date();
    const offset = hoje.getTimezoneOffset();
    const hojeLocal = new Date(hoje.getTime() - (offset * 60000));
    setMinDate(hojeLocal.toISOString().split('T')[0]);

  }, []);

  // Filtra Serviços quando o Profissional muda
  useEffect(() => {
      setServicosSelecionados([]);
      if (profissionalSelecionado) {
          const dadosPro = profissionaisDados.find(p => p.id === profissionalSelecionado.value);
          if (dadosPro && dadosPro.servicosIds && dadosPro.servicosIds.length > 0) {
              const servicosDoProfissional = todasOpcoesServicos.filter(servico => 
                  dadosPro.servicosIds.includes(servico.value)
              );
              setListaServicos(servicosDoProfissional);
          } else {
              setListaServicos([]);
          }
      } else {
          setListaServicos([]);
      }
  }, [profissionalSelecionado, profissionaisDados, todasOpcoesServicos]);

  // Efeito que BUSCA HORÁRIOS
  useEffect(() => {
    setHorariosDisponiveis([]);
    setHorarioSelecionado("");

    if (profissionalSelecionado && servicosSelecionados.length > 0 && diaSelecionado) {
        
        const duracaoTotal = servicosSelecionados.reduce((total, servico) => {
            const match = servico.label.match(/(\d+)\s*min/);
            if (match) return total + parseInt(match[1]);
            return total;
        }, 0);

        if (duracaoTotal === 0) return; 

        async function buscarDisponibilidade() {
            setCarregandoHorarios(true);
            try {
                const resposta = await axios.get(`/usuarios/${profissionalSelecionado.value}/disponibilidade`, {
                    params: {
                        data: diaSelecionado, 
                        duracao: duracaoTotal 
                    }
                });
                setHorariosDisponiveis(resposta.data);
            } catch (err) {
                console.error("Erro ao buscar horários:", err);
                toast.error("Não foi possível buscar os horários.");
            } finally {
                setCarregandoHorarios(false);
            }
        }
        buscarDisponibilidade();
    }
  }, [profissionalSelecionado, servicosSelecionados, diaSelecionado]); 

  // Função final de AGENDAR
  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregandoSubmit(true);

    try {
      const dataHoraFormatada = `${diaSelecionado}T${horarioSelecionado}`; 
      
      const listaIds = servicosSelecionados.map(opcao => opcao.value);
      const novoAgendamentoDTO = {
        profissionalId: profissionalSelecionado.value,
        servicosIds: listaIds,
        dataHora: dataHoraFormatada 
      };
      await axios.post("/agendamentos", novoAgendamentoDTO);

      toast.success("Agendamento criado com sucesso!");
      
      setProfissionalSelecionado(null);
      setServicosSelecionados([]);
      setDiaSelecionado("");
      setHorarioSelecionado("");
      setHorariosDisponiveis([]);

      if (onAgendamentoSucesso) {
          onAgendamentoSucesso();
      }
    } catch (erroApi) {
      console.error("Erro ao criar:", erroApi);
      if (erroApi.response && erroApi.response.data.message) {
          toast.error(erroApi.response.data.message);
      } else {
        toast.error("Erro ao criar agendamento.");
      }
    } finally {
      setCarregandoSubmit(false);
    }
  }
  
  function renderizarSlotsDeHorario() {
    if (carregandoHorarios) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '10px' }}><Spinner /></div>;
    }
    if (horariosDisponiveis.length === 0 && diaSelecionado && profissionalSelecionado && servicosSelecionados.length > 0) {
        return <p style={{ color: '#aaa', textAlign: 'center' }}>Nenhum horário livre.</p>;
    }
    
    if (horariosDisponiveis.length === 0) {
        return null; 
    }

    return (
        <div className="horarios-container">
            {horariosDisponiveis.map(horario => (
                <button
                    type="button" 
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

  if (carregandoComponente) return <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><Spinner /></div>;

  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login">Novo agendamento</h2>
      
      {/* Profissional */}
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
      
      {/* Serviços */}
      <div className="input-grupo">
        <label>Serviços</label>
        <Select
          isMulti
          options={listaServicos}
          value={servicosSelecionados}
          onChange={setServicosSelecionados}
          placeholder={
              !profissionalSelecionado 
              ? "Selecione um profissional..." 
              : listaServicos.length === 0 
                  ? "Este profissional não possui serviços." 
                  : "Selecione os serviços..."
          }
          styles={darkSelectStyles}
          isDisabled={!profissionalSelecionado || listaServicos.length === 0}
          noOptionsMessage={() => "Nenhum serviço disponível"}
        />
      </div>

      {/* Dia */}
      {(profissionalSelecionado && servicosSelecionados.length > 0) && (
        <div className="input-grupo">
          <label htmlFor="data">Dia</label>
          <input
            type="date"
            id="data"
            value={diaSelecionado}
            onChange={e => setDiaSelecionado(e.target.value)}
            min={minDate} 
            required
          />
        </div>
      )}

      {/* Etapa 4: Horário */}
      <div className="input-grupo">
            <label>{horariosDisponiveis.length > 0 ? 'Horários Disponíveis' : ''}</label>
            {renderizarSlotsDeHorario()}
      </div>

      {/* Botão com Spinner */}
      <button
        type="submit"
        className="botao-login"
        disabled={carregandoSubmit || !profissionalSelecionado || servicosSelecionados.length === 0 || !horarioSelecionado}
        style={{ marginTop: '20px' }} 
      >
        {carregandoSubmit ? <Spinner /> : 'Confirmar Agendamento'}
      </button>
    </form>
  )
}

export default FormNovoAgendamento;