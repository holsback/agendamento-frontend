import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

/**
 * (FORMULÁRIO INTELIGENTE)
 * Este formulário busca horários disponíveis no Backend.
 * TAMBÉM: Filtra os serviços baseados no profissional selecionado.
 */
function FormNovoAgendamento({ onAgendamentoSucesso }) {

  // --- Estados dos Dropdowns ---
  const [listaProfissionais, setListaProfissionais] = useState([]); // Opções {value, label} para o Select
  
  // ESTADOS PARA O FILTRO
  const [profissionaisDados, setProfissionaisDados] = useState([]); // Dados COMPLETOS dos profissionais (incluindo lista de serviços)
  const [todasOpcoesServicos, setTodasOpcoesServicos] = useState([]); // Catálogo COMPLETO de serviços {value, label}
  
  const [listaServicos, setListaServicos] = useState([]); // Lista FILTRADA que aparece no Select
  
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

  // 1. Efeito que carrega os Profissionais e o Catálogo de Serviços (só roda uma vez)
  useEffect(() => {
    async function carregarDados() {
        try {
            const [resProfissionais, resServicos] = await Promise.all([
                axios.get("/usuarios/profissionais"),
                axios.get("/servicos")
            ]);
            
            // Guarda os dados BRUTOS (onde temos a lista de IDs de serviços de cada um)
            setProfissionaisDados(resProfissionais.data);

            // Prepara as opções visuais para o Select de Profissionais
            setListaProfissionais(resProfissionais.data.map(p => ({ value: p.id, label: p.nome })));
            
            // Prepara o catálogo COMPLETO de serviços
            const catalogoCompleto = resServicos.data.map(s => ({ 
                value: s.id, 
                label: `${s.nome} - R$ ${s.preco} (${s.duracaoMinutos} min)` 
            }));
            setTodasOpcoesServicos(catalogoCompleto);
            
            // Inicialmente, a lista filtrada fica vazia (até selecionar alguém)
            setListaServicos([]);

        } catch (err) {
            console.error("Erro ao carregar dados:", err);
            setErro("Erro ao carregar opções de agendamento.");
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

  // EFEITO: Filtra Serviços quando o Profissional muda
  useEffect(() => {
      // Sempre que trocar de profissional, limpamos os serviços selecionados anteriormente
      setServicosSelecionados([]);
      
      if (profissionalSelecionado) {
          // 1. Acha os dados completos desse profissional na nossa memória
          const dadosPro = profissionaisDados.find(p => p.id === profissionalSelecionado.value);
          
          if (dadosPro && dadosPro.servicosIds && dadosPro.servicosIds.length > 0) {
              // 2. Filtra o catálogo: Só deixa passar os serviços que o profissional tem na lista dele
              const servicosDoProfissional = todasOpcoesServicos.filter(servico => 
                  dadosPro.servicosIds.includes(servico.value)
              );
              setListaServicos(servicosDoProfissional);
          } else {
              // Se ele não tiver nenhum serviço vinculado, a lista fica vazia
              setListaServicos([]);
          }
      } else {
          // Se nenhum profissional estiver selecionado, lista vazia
          setListaServicos([]);
      }
  }, [profissionalSelecionado, profissionaisDados, todasOpcoesServicos]);


  // 2. Efeito que BUSCA HORÁRIOS (roda sempre que os 3 pilares mudam)
  useEffect(() => {
    setHorariosDisponiveis([]);
    setHorarioSelecionado("");
    setErro(""); 

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
                setErro("Não foi possível buscar os horários para esta data.");
            } finally {
                setCarregandoHorarios(false);
            }
        }
        buscarDisponibilidade();
    }
  }, [profissionalSelecionado, servicosSelecionados, diaSelecionado]); 

  // 3. Função final de AGENDAR
  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregandoSubmit(true);
    setErro("");
    setSucesso("");

    try {
      const dataHoraFormatada = `${diaSelecionado}T${horarioSelecionado}`; 
      
      const listaIds = servicosSelecionados.map(opcao => opcao.value);
      const novoAgendamentoDTO = {
        profissionalId: profissionalSelecionado.value,
        servicosIds: listaIds,
        dataHora: dataHoraFormatada 
      };
      await axios.post("/agendamentos", novoAgendamentoDTO);

      setSucesso("Agendamento criado com sucesso!");
      
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
          setErro(erroApi.response.data.message);
      } else {
        setErro("Erro ao criar agendamento.");
      }
    } finally {
      setCarregandoSubmit(false);
    }
  }
  
  function renderizarSlotsDeHorario() {
    if (carregandoHorarios) {
        return <p style={{ color: '#aaa', textAlign: 'center' }}>Buscando horários...</p>;
    }
    if (horariosDisponiveis.length === 0 && diaSelecionado && profissionalSelecionado && servicosSelecionados.length > 0) {
        return <p style={{ color: '#aaa', textAlign: 'center' }}>Nenhum horário livre encontrado para esta data/duração.</p>;
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

  if (carregandoComponente) return <p>Carregando opções...</p>;

  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login">Novo agendamento</h2>
      
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
      
      {/* Etapa 2: Serviços (Agora filtrados!) */}
      <div className="input-grupo">
        <label>Serviços</label>
        <Select
          isMulti
          options={listaServicos} // Usa a lista filtrada
          value={servicosSelecionados}
          onChange={setServicosSelecionados}
          placeholder={
              !profissionalSelecionado 
              ? "Selecione um profissional primeiro..." 
              : listaServicos.length === 0 
                  ? "Este profissional não possui serviços vinculados." 
                  : "Selecione os serviços..."
          }
          styles={darkSelectStyles}
          isDisabled={!profissionalSelecionado || listaServicos.length === 0} // Desabilita se não tiver profissional ou serviços
          noOptionsMessage={() => "Nenhum serviço disponível"}
        />
      </div>

      {/* Etapa 3: Dia */}
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

      {erro && <p className="mensagem-erro" style={{ marginTop: '10px' }}>{erro}</p>}
      {sucesso && <p className="mensagem-sucesso" style={{ marginTop: '10px' }}>{sucesso}</p>}
      
      <button
        type="submit"
        className="botao-login"
        disabled={carregandoSubmit || !profissionalSelecionado || servicosSelecionados.length === 0 || !horarioSelecionado}
        style={{ marginTop: '20px' }} 
      >
        {carregandoSubmit ? 'Agendando...' : 'Confirmar Agendamento'}
      </button>
    </form>
  )
}

export default FormNovoAgendamento;