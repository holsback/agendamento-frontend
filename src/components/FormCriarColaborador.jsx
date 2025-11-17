import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { jwtDecode } from 'jwt-decode';

function FormCriarColaborador({ onColaboradorCriado, colaboradorParaEditar, onCancelarEdicao }) {

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilSelecionado, setPerfilSelecionado] = useState(null);

  const [opcoesPerfilPermitidas, setOpcoesPerfilPermitidas] = useState([]);
  const [meuPerfil, setMeuPerfil] = useState(null); // Para sabermos quem está logado

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

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

  // 1. Define o perfil do admin logado E quais perfis ele pode criar/editar
  useEffect(() => {
      const token = localStorage.getItem("authToken");
      if (token) {
          const decoded = jwtDecode(token);
          const perfilLogado = decoded.role;
          setMeuPerfil(perfilLogado); // Salva o perfil do admin logado

          const todasOpcoes = [
              { value: 'ROLE_DONO', label: 'Dono (Estabelecimento)' },
              { value: 'ROLE_GERENTE', label: 'Gerente' },
              { value: 'ROLE_PROFISSIONAL', label: 'Profissional' }
          ];

          if (perfilLogado === 'ROLE_MASTER') {
              setOpcoesPerfilPermitidas(todasOpcoes); // Master pode tudo
          } else if (perfilLogado === 'ROLE_DONO') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value !== 'ROLE_DONO')); // Dono pode Gerente e Pro
          } else if (perfilLogado === 'ROLE_GERENTE') {
              setOpcoesPerfilPermitidas(todasOpcoes.filter(op => op.value === 'ROLE_PROFISSIONAL')); // Gerente só pode Pro
          } else {
              setOpcoesPerfilPermitidas([]);
          }
      }
  }, []);

  // 2. Preenche o formulário quando clicamos em "Editar"
  useEffect(() => {
      if (colaboradorParaEditar) {
          // MODO EDIÇÃO
          setNome(colaboradorParaEditar.nome);
          setEmail(colaboradorParaEditar.email);
          setTelefone(colaboradorParaEditar.telefone);
          // Encontra o objeto {value, label} correspondente ao perfil
          const perfilOpcao = opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil) || 
                              { value: colaboradorParaEditar.perfil, label: colaboradorParaEditar.perfil }; // Fallback caso o perfil seja de nível superior
          
          setPerfilSelecionado(perfilOpcao);
          setSenha(""); // Senha fica em branco (opcional)
          setErro("");
          setSucesso("");
      } else {
          // MODO CRIAÇÃO
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          setPerfilSelecionado(null);
      }
  }, [colaboradorParaEditar, opcoesPerfilPermitidas]);

  // 3. Função de Salvar (POST ou PUT)
  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      if (colaboradorParaEditar) {
          // MODO EDIÇÃO (PUT)
          const dadosAtualizados = {
            nome: nome,
            telefone: telefone,
            perfil: perfilSelecionado ? perfilSelecionado.value : null,
            senha: senha || null // Envia null se a senha estiver em branco
          };

          await axios.put(`http://localhost:8080/admin/atualizar-colaborador/${colaboradorParaEditar.id}`, dadosAtualizados);
          setSucesso(`Colaborador ${nome} atualizado com sucesso!`);
      
      } else {
          // MODO CRIAÇÃO (POST)
          if (!senha) {
              setErro("A senha inicial é obrigatória.");
              setCarregando(false);
              return;
          }
          await axios.post("http://localhost:8080/admin/criar-colaborador", {
            nome: nome,
            email: email,
            telefone: telefone,
            senha: senha,
            perfil: perfilSelecionado.value
          });
          setSucesso(`Colaborador ${perfilSelecionado.label} criado com sucesso!`);
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

  // Verifica se o dropdown de perfil deve ser travado
  const isPerfilDisabled = 
      // Trava se for Gerente (só pode criar/editar Profissional)
      meuPerfil === 'ROLE_GERENTE' || 
      // Trava se estiver editando um perfil que você não pode criar (ex: Dono editando Gerente, não pode mudar perfil)
      (colaboradorParaEditar && !opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil));


  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login" style={{ marginTop: 0 }}>
          {colaboradorParaEditar ? 'Editando Colaborador' : 'Novo Colaborador'}
      </h2>

      <div className="input-grupo">
        <label>Nome</label>
        <input type="text" placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} required />
      </div>

      <div className="input-grupo">
        <label>Email</label>
        <input 
            type="email" 
            placeholder="Email de login" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            disabled={!!colaboradorParaEditar} // Trava o email no modo edição (email é username, não deve mudar)
            style={{ opacity: colaboradorParaEditar ? 0.5 : 1, cursor: colaboradorParaEditar ? 'not-allowed' : 'default' }}
        />
      </div>

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

      <div className="input-grupo">
        <label>Telefone</label>
        <input type="tel" placeholder="(11) 99999-8888" value={telefone} onChange={e => setTelefone(e.target.value)} required />
      </div>

      {/* Campo de Senha é opcional na edição */}
      <div className="input-grupo">
        <label>{colaboradorParaEditar ? 'Nova Senha (Opcional)' : 'Senha Inicial'}</label>
        <input 
            type="text" 
            placeholder={colaboradorParaEditar ? 'Deixe em branco para não alterar' : 'Mínimo 8 caracteres'}
            value={senha} 
            onChange={e => setSenha(e.target.value)} 
            required={!colaboradorParaEditar} // Obrigatório só ao criar
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