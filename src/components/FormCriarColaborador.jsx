import '../App.css'; 
import { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import Select from 'react-select'; 
import { jwtDecode } from 'jwt-decode'; 

/**
 * @param {function} props.onColaboradorCriado - Função que AVISA o "Pai" que terminamos.
 * @param {object} props.colaboradorParaEditar 
 * @param {function} props.onCancelarEdicao - Função para voltar para a lista
 */
function FormCriarColaborador({ onColaboradorCriado, colaboradorParaEditar, onCancelarEdicao }) {

  // --- Estados (Memória do Formulário) ---
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilSelecionado, setPerfilSelecionado] = useState(null); 
  
  // === ESTADOS PARA SERVIÇOS ===
  const [listaServicos, setListaServicos] = useState([]); // Todas as opções disponíveis (Corte, Barba...)
  const [servicosSelecionados, setServicosSelecionados] = useState([]); // As opções que o admin marcou

  // --- Estados de Lógica e Permissão ---
  const [opcoesPerfilPermitidas, setOpcoesPerfilPermitidas] = useState([]); 
  const [meuPerfil, setMeuPerfil] = useState(null); 

  // --- Estados de Feedback ---
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Estilos customizados para o Select (tema escuro)
  const darkSelectStyles = {
    control: (styles, { isDisabled }) => ({ 
        ...styles, 
        backgroundColor: isDisabled ? '#222' : '#2a2a2a', 
        borderColor: '#555',
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'default'
    }),
    menu: (styles) => ({ ...styles, backgroundColor: '#333' }),
    option: (styles, { isFocused, isSelected }) => ({
      ...styles,
      backgroundColor: isSelected ? '#0069ff' : isFocused ? '#444' : '#333',
      color: '#f0f0f0',
      ':active': { ...styles[':active'], backgroundColor: '#0069ff' },
    }),
    multiValue: (styles) => ({ ...styles, backgroundColor: '#444' }), // Estilo para as "etiquetas" selecionadas
    multiValueLabel: (styles) => ({ ...styles, color: '#f0f0f0' }),
    singleValue: (styles) => ({ ...styles, color: '#f0f0f0' }),
    placeholder: (styles) => ({ ...styles, color: '#aaa' }),
    input: (styles) => ({ ...styles, color: '#f0f0f0' })
  };

  /**
   * Efeito 1: Carrega permissões E a lista de serviços disponíveis
   */
  useEffect(() => {
      const token = localStorage.getItem("authToken");
      if (token) {
          const decoded = jwtDecode(token); 
          const perfilLogado = decoded.role; 
          setMeuPerfil(perfilLogado); 

          const todasOpcoes = [
              { value: 'ROLE_DONO', label: 'Dono (Estabelecimento)' },
              { value: 'ROLE_GERENTE', label: 'Gerente' },
              { value: 'ROLE_PROFISSIONAL', label: 'Profissional' }
          ];

          if (perfilLogado === 'ROLE_MASTER') {
              setOpcoesPerfilPermitidas(todasOpcoes);
          } else if (perfilLogado === 'ROLE_DONO') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value !== 'ROLE_DONO'));
          } else if (perfilLogado === 'ROLE_GERENTE') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value === 'ROLE_PROFISSIONAL'));
          } else {
              setOpcoesPerfilPermitidas([]); 
          }
      }

      // === BUSCA SERVIÇOS NA API ===
      async function carregarServicos() {
          try {
              const res = await axios.get("/servicos");
              // Transforma o formato da API no formato que o Select entende: { value: id, label: nome }
              const opcoesFormatadas = res.data.map(s => ({
                  value: s.id,
                  label: s.nome
              }));
              setListaServicos(opcoesFormatadas);
          } catch (err) {
              console.error("Erro ao carregar serviços:", err);
          }
      }
      carregarServicos();

  }, []); 

  /**
   * Efeito 2: Preenche o formulário para "Edição" ou "limpa" para "Criação".
   */
  useEffect(() => {
      if (colaboradorParaEditar) {
          // MODO EDIÇÃO
          setNome(colaboradorParaEditar.nome);
          setEmail(colaboradorParaEditar.email);
          setTelefone(colaboradorParaEditar.telefone);
          
          const perfilOpcao = opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil) || 
                              { value: colaboradorParaEditar.perfil, label: colaboradorParaEditar.perfil };
          
          setPerfilSelecionado(perfilOpcao);

          // === PREENCHE OS SERVIÇOS SELECIONADOS ===
          // Se o DTO trouxer a lista de IDs (que criamos no Passo 3), nós usamos para pré-selecionar
          if (colaboradorParaEditar.servicosIds && listaServicos.length > 0) {
              const servicosDoUser = listaServicos.filter(opcao => 
                  colaboradorParaEditar.servicosIds.includes(opcao.value)
              );
              setServicosSelecionados(servicosDoUser);
          } else {
              setServicosSelecionados([]);
          }

          setSenha(""); 
          setErro("");
          setSucesso("");
      } else {
          // MODO CRIAÇÃO
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          setServicosSelecionados([]); // Limpa serviços
          
          if (meuPerfil === 'ROLE_GERENTE' && opcoesPerfilPermitidas.length === 1) {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              setPerfilSelecionado(null);
          }
      }
  }, [colaboradorParaEditar, opcoesPerfilPermitidas, meuPerfil, listaServicos]); 

  /**
   * Função chamada quando o usuário clica no botão "Salvar" (submit)
   */
  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setCarregando(true);
    setErro("");
    setSucesso("");

    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      let idColaborador = null; // Vamos guardar o ID aqui (seja criado ou editado)

      if (colaboradorParaEditar) {
          // --- MODO EDIÇÃO (PUT) ---
          idColaborador = colaboradorParaEditar.id;

          const dadosAtualizados = {
            nome: nome,
            telefone: telefoneLimpo, 
            perfil: perfilSelecionado ? perfilSelecionado.value : null,
            senha: senha || null 
          };
          await axios.put(`/admin/atualizar-colaborador/${idColaborador}`, dadosAtualizados);
          setSucesso(`Colaborador ${nome} atualizado com sucesso!`);

      } else {
          // --- MODO CRIAÇÃO (POST) ---
          if (!senha) {
              setErro("A senha inicial é obrigatória.");
              setCarregando(false);
              return;
          }
          
          const respostaCriacao = await axios.post("/admin/criar-colaborador", {
            nome: nome,
            email: email,
            telefone: telefoneLimpo,
            senha: senha,
            perfil: perfilSelecionado.value 
          });
          
          // O backend agora retorna o objeto completo (Passo 4), então pegamos o ID dele
          idColaborador = respostaCriacao.data.id;
          
          setSucesso(`Colaborador ${perfilSelecionado.label} criado com sucesso!`);
      }

      // === PASSO FINAL: VINCULAR SERVIÇOS ===
      // Se o perfil for PROFISSIONAL, nós chamamos a rota de vínculo
      if (perfilSelecionado && perfilSelecionado.value === 'ROLE_PROFISSIONAL') {
          
          // Extrai apenas os IDs (ex: ["uuid1", "uuid2"])
          const idsParaVincular = servicosSelecionados.map(s => s.value);
          
          // Chama a rota que criamos no Passo 2
          await axios.put(`/admin/profissionais/${idColaborador}/servicos`, idsParaVincular);
      }

      // Limpa tudo e avisa o pai
      if (!colaboradorParaEditar) {
          setNome(""); setEmail(""); setTelefone(""); setSenha(""); setServicosSelecionados([]);
      }
      
      if (onColaboradorCriado) onColaboradorCriado();
      
    } catch (erroApi) {
       console.error("Erro ao salvar colaborador:", erroApi);
       if (erroApi.response && erroApi.response.data) {
         if (erroApi.response.data.messages) {
             setErro(erroApi.response.data.messages[0]);
         } else if (typeof erroApi.response.data === 'string') {
             setErro(erroApi.response.data);
         } else if (erroApi.response.status === 403) {
             setErro("Ação não permitida. Verifique sua hierarquia.");
         } else {
             setErro("Erro ao salvar colaborador.");
         }
       } else {
         setErro("Erro ao conectar com o servidor.");
       }
    } finally {
      setCarregando(false); 
    }
  }

  const isPerfilDisabled = 
      meuPerfil === 'ROLE_GERENTE' || 
      (colaboradorParaEditar && !opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil));

  // Verifica se devemos mostrar o campo de serviços (apenas para Profissionais)
  const mostrarCampoServicos = perfilSelecionado && perfilSelecionado.value === 'ROLE_PROFISSIONAL';

  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login" style={{ marginTop: 0 }}>
          {colaboradorParaEditar ? `Editando: ${colaboradorParaEditar.nome}` : 'Novo Colaborador'}
      </h2>

      {/* Campo Nome */}
      <div className="input-grupo">
        <label>Nome</label>
        <input type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>

      {/* Campo Email */}
      <div className="input-grupo">
        <label>Email</label>
        <input 
            type="email" 
            placeholder="Email de login" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={!!colaboradorParaEditar} 
            style={{ opacity: colaboradorParaEditar ? 0.5 : 1, cursor: colaboradorParaEditar ? 'not-allowed' : 'default' }}
        />
      </div>

      {/* Campo Perfil (Dropdown) */}
      <div className="input-grupo">
         <label>Perfil (Role)</label>
         <Select
            options={opcoesPerfilPermitidas} 
            value={perfilSelecionado} 
            onChange={(opcao) => {
                setPerfilSelecionado(opcao);
                // Se mudar para algo que não é profissional, limpa os serviços selecionados
                if (opcao && opcao.value !== 'ROLE_PROFISSIONAL') {
                    setServicosSelecionados([]);
                }
            }} 
            placeholder={meuPerfil === 'ROLE_GERENTE' ? 'Profissional' : 'Selecione o cargo...'}
            styles={darkSelectStyles} 
            required={!colaboradorParaEditar}
            isDisabled={isPerfilDisabled} 
         />
      </div>

      {/* === CAMPO: SERVIÇOS (Só aparece para Profissional) === */}
      {mostrarCampoServicos && (
          <div className="input-grupo">
              <label>Serviços Realizados</label>
              <Select
                  isMulti // Permite selecionar vários
                  options={listaServicos}
                  value={servicosSelecionados}
                  onChange={setServicosSelecionados}
                  placeholder="Selecione os serviços..."
                  styles={darkSelectStyles}
                  noOptionsMessage={() => "Nenhum serviço cadastrado"}
              />
              <small style={{color: '#aaa', fontSize: '12px'}}>
                  * Selecione quais serviços este profissional sabe fazer.
              </small>
          </div>
      )}

      {/* Campo Telefone */}
      <div className="input-grupo">
        <label>Telefone</label>
        <input type="tel" placeholder="(11) 99999-8888" value={telefone} onChange={e => setTelefone(e.target.value)} required />
      </div>

      {/* Campo de Senha */}
      <div className="input-grupo">
        <label>{colaboradorParaEditar ? 'Nova Senha (Opcional)' : 'Senha Inicial'}</label>
        <input 
            type="text" 
            placeholder={colaboradorParaEditar ? 'Deixe em branco para não alterar' : 'Mínimo 8 caracteres'}
            value={senha} 
            onChange={e => setSenha(e.target.value)} 
            required={!colaboradorParaEditar} 
        />
      </div>

      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
              type="submit" 
              className="botao-login" 
              disabled={carregando || (!colaboradorParaEditar && !perfilSelecionado)} 
              style={{ flex: 2, marginTop: 0 }}
          >
              {carregando ? 'Salvando...' : (colaboradorParaEditar ? 'Salvar Alterações' : 'Criar Colaborador')}
          </button>
          
          <button 
              type="button" 
              onClick={onCancelarEdicao} 
              className="botao-secundario" 
              style={{ flex: 1 }}
          >
              Cancelar
          </button>
      </div>
    </form>
  )
}

export default FormCriarColaborador;