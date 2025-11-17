import '../App.css'; // Importa CSS
import { useState, useEffect } from 'react'; // Importa "ganchos" do React
import axios from 'axios'; // Importa Axios para API
import Select from 'react-select'; // Importa o componente de <Select> (dropdown)
import { jwtDecode } from 'jwt-decode'; // Importa o decodificador de Token JWT

/**
 * Este componente é o formulário usado pelo Admin para CRIAR ou EDITAR Colaboradores.
 * @param {object} props
 * @param {function} props.onColaboradorCriado - Função para recarregar a lista (no "pai")
 * @param {object} props.colaboradorParaEditar - Se este objeto existir, o form entra em modo "Edição"
 * @param {function} props.onCancelarEdicao - Função para limpar o formulário e voltar ao modo "Criação"
 */
function FormCriarColaborador({ onColaboradorCriado, colaboradorParaEditar, onCancelarEdicao }) {

  // --- Estados (Memória do Formulário) ---
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilSelecionado, setPerfilSelecionado] = useState(null); // Guarda o objeto { value, label }

  // --- Estados de Lógica e Permissão ---
  const [opcoesPerfilPermitidas, setOpcoesPerfilPermitidas] = useState([]); // Quais perfis o admin logado pode criar
  const [meuPerfil, setMeuPerfil] = useState(null); // Guarda o perfil do admin logado (ex: ROLE_DONO)

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
   * Efeito 1: Roda UMA VEZ quando o componente carrega.
   * Objetivo: Descobrir quem está logado (Master, Dono, Gerente?) e
   * definir quais perfis ele tem permissão para criar/editar.
   */
  useEffect(() => {
      const token = localStorage.getItem("authToken");
      if (token) {
          const decoded = jwtDecode(token); // Decodifica o token
          const perfilLogado = decoded.role; // Pega o (ex: "ROLE_DONO")
          setMeuPerfil(perfilLogado); // Salva o perfil do admin logado

          // Lista de todos os perfis que podem ser criados
          const todasOpcoes = [
              { value: 'ROLE_DONO', label: 'Dono (Estabelecimento)' },
              { value: 'ROLE_GERENTE', label: 'Gerente' },
              { value: 'ROLE_PROFISSIONAL', label: 'Profissional' }
          ];

          // Filtra a lista baseado na permissão (hierarquia)
          if (perfilLogado === 'ROLE_MASTER') {
              setOpcoesPerfilPermitidas(todasOpcoes); // Master pode tudo
          } else if (perfilLogado === 'ROLE_DONO') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value !== 'ROLE_DONO')); // Dono pode Gerente e Pro
          } else if (perfilLogado === 'ROLE_GERENTE') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value === 'ROLE_PROFISSIONAL')); // Gerente só pode Pro
          } else {
              setOpcoesPerfilPermitidas([]); // Nenhuma permissão
          }
      }
  }, []); // Array vazio [] = roda só uma vez

  /**
   * Efeito 2: Roda sempre que 'colaboradorParaEditar' OU 'opcoesPerfilPermitidas' OU 'meuPerfil' mudar.
   * Objetivo: Preencher o formulário para "Edição" ou "limpar" para "Criação".
   * (Este é o efeito que corrigimos no Passo 2.1)
   */
  useEffect(() => {
      if (colaboradorParaEditar) {
          // MODO EDIÇÃO: Preenche os campos com os dados do colaborador
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
          // MODO CRIAÇÃO: Limpa os campos
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          
          // Se for Gerente, pré-seleciona "Profissional"
          if (meuPerfil === 'ROLE_GERENTE' && opcoesPerfilPermitidas.length === 1) {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              // Se for Master/Dono, força ele a escolher
              setPerfilSelecionado(null);
          }
      }
  }, [colaboradorParaEditar, opcoesPerfilPermitidas, meuPerfil]); 

  /**
   * Função chamada quando o usuário clica no botão "Salvar" (submit)
   */
  async function handleSubmit(evento) {
    evento.preventDefault(); // Impede o recarregamento da página
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
          // (No modo Edição, não limpamos o form,
          // pois o admin pode querer cancelar a edição ou editar de novo)
      
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

          // === NOSSA ALTERAÇÃO ESTÁ AQUI ===
          // Após o sucesso da CRIAÇÃO, limpamos os campos do formulário
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          // Resetamos o dropdown (respeitando a regra do Gerente)
          if (meuPerfil === 'ROLE_GERENTE') {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              setPerfilSelecionado(null);
          }
          // --- FIM DA ALTERAÇÃO ---
      }
      
      // Avisa o "Pai" (DashboardAdmin) para recarregar a lista
      if (onColaboradorCriado) onColaboradorCriado(); 

    } catch (erroApi) {
      // Se deu errado (catch)
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
      setCarregando(false); // Desliga o spinner
    }
  }

  // --- Lógica de Renderização ---
  const isPerfilDisabled = 
      meuPerfil === 'ROLE_GERENTE' || 
      (colaboradorParaEditar && !opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil));

  // --- Renderização (O que aparece na tela) ---
  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login" style={{ marginTop: 0 }}>
          {colaboradorParaEditar ? 'Editando Colaborador' : 'Novo Colaborador'}
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
          
          {/* Botão de Cancelar (só aparece no modo Edição) */}
          {colaboradorParaEditar && (
              <button 
                  type="button" 
                  onClick={onCancelarEdicao} 
                  className="botao-secundario" 
                  style={{ flex: 1 }}
              >
                  Cancelar
              </button>
          )}
      </div>
    </form>
  )
}

export default FormCriarColaborador;