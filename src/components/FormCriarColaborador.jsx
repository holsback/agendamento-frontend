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
    singleValue: (styles) => ({ ...styles, color: '#f0f0f0' }),
    placeholder: (styles) => ({ ...styles, color: '#aaa' }),
    input: (styles) => ({ ...styles, color: '#f0f0f0' })
  };

  /**
   * Efeito 1: Define as permissões do admin logado
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
  }, []); 

  /**
   * Efeito 2: Preenche o formulário para "Edição" ou "limpa" para "Criação".
   * (Corrigido no Passo 2.1)
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
          setSenha(""); 
          setErro("");
          setSucesso("");
      } else {
          // MODO CRIAÇÃO
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          
          if (meuPerfil === 'ROLE_GERENTE' && opcoesPerfilPermitidas.length === 1) {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              setPerfilSelecionado(null);
          }
      }
  }, [colaboradorParaEditar, opcoesPerfilPermitidas, meuPerfil]); 

  /**
   * Função chamada quando o usuário clica no botão "Salvar" (submit)
   */
  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setCarregando(true);
    setErro("");
    setSucesso("");

    // Limpa o telefone (Correção do Problema 1)
    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      if (colaboradorParaEditar) {
          // --- MODO EDIÇÃO (PUT) ---
          const dadosAtualizados = {
            nome: nome,
            telefone: telefoneLimpo, 
            perfil: perfilSelecionado ? perfilSelecionado.value : null,
            senha: senha || null 
          };
          await axios.put(`http://localhost:8080/admin/atualizar-colaborador/${colaboradorParaEditar.id}`, dadosAtualizados);
          setSucesso(`Colaborador ${nome} atualizado com sucesso!`);
          
          // === NOSSA ALTERAÇÃO DESTE PASSO ESTÁ AQUI ===
          // Apenas chamamos a função, sem enviar 'false'.
          // O "Pai" (DashboardAdmin) vai receber isso e voltar para a lista.
          if (onColaboradorCriado) onColaboradorCriado();

      } else {
          // --- MODO CRIAÇÃO (POST) ---
          if (!senha) {
              setErro("A senha inicial é obrigatória.");
              setCarregando(false);
              return;
          }
          
          await axios.post("http://localhost:8080/admin/criar-colaborador", {
            nome: nome,
            email: email,
            telefone: telefoneLimpo,
            senha: senha,
            perfil: perfilSelecionado.value 
          });
          setSucesso(`Colaborador ${perfilSelecionado.label} criado com sucesso!`);

          // Limpa o formulário (Correção do Passo 4.1 anterior)
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          if (meuPerfil === 'ROLE_GERENTE') {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              setPerfilSelecionado(null);
          }

          // === NOSSA ALTERAÇÃO DESTE PASSO ESTÁ AQUI ===
          // Apenas chamamos a função, sem enviar 'true'.
          // O "Pai" (DashboardAdmin) vai receber isso e voltar para a lista.
          if (onColaboradorCriado) onColaboradorCriado();
      }
      
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
      // NOTA: O 'setCarregando(false)' foi movido para cá no passo anterior
      setCarregando(false); 
    }
  }

  // --- Lógica de Renderização ---
  const isPerfilDisabled = 
      meuPerfil === 'ROLE_GERENTE' || 
      (colaboradorParaEditar && !opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil));

  // --- Renderização (HTML) da página ---
  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login" style={{ marginTop: 0 }}>
          {/* O título agora mostra "Editando: Nome" ou "Novo Colaborador" */}
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
            onChange={setPerfilSelecionado} 
            placeholder={meuPerfil === 'ROLE_GERENTE' ? 'Profissional' : 'Selecione o cargo...'}
            styles={darkSelectStyles} 
            required={!colaboradorParaEditar}
            isDisabled={isPerfilDisabled} 
         />
      </div>

      {/* Campo Telefone */}
      <div className="input-grupo">
        <label>Telefone</label>
        <input type="tel" placeholder="(11) 99999-8888" value={telefone} onChange={e => setTelefone(e.target.value)} required />
      </div>

      {/* Campo de Senha (é opcional na edição) */}
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

      {/* Mensagens de Feedback */}
      {erro && <p className="mensagem-erro">{erro}</p>}
      {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

      {/* Botões de Ação */}
      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          {/* Botão de Salvar/Criar */}
          <button 
              type="submit" 
              className="botao-login" 
              disabled={carregando || (!colaboradorParaEditar && !perfilSelecionado)} 
              style={{ flex: 2, marginTop: 0 }}
          >
              {carregando ? 'Salvando...' : (colaboradorParaEditar ? 'Salvar Alterações' : 'Criar Colaborador')}
          </button>
          
          {/* Botão Cancelar (agora chama a função do "Pai") */}
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