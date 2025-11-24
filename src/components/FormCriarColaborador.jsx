import '../App.css'; 
import { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import Select from 'react-select'; 
import { jwtDecode } from 'jwt-decode'; 
import { toast } from 'sonner';
import Spinner from './Spinner';

function FormCriarColaborador({ onColaboradorCriado, colaboradorParaEditar, onCancelarEdicao }) {

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [perfilSelecionado, setPerfilSelecionado] = useState(null); 
  
  const [listaServicos, setListaServicos] = useState([]); 
  const [servicosSelecionados, setServicosSelecionados] = useState([]); 

  const [opcoesPerfilPermitidas, setOpcoesPerfilPermitidas] = useState([]); 
  const [meuPerfil, setMeuPerfil] = useState(null); 

  const [carregando, setCarregando] = useState(false);

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
    multiValue: (styles) => ({ ...styles, backgroundColor: '#444' }), 
    multiValueLabel: (styles) => ({ ...styles, color: '#f0f0f0' }),
    singleValue: (styles) => ({ ...styles, color: '#f0f0f0' }),
    placeholder: (styles) => ({ ...styles, color: '#aaa' }),
    input: (styles) => ({ ...styles, color: '#f0f0f0' })
  };

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

      async function carregarServicos() {
          try {
              const res = await axios.get("/servicos");
              const opcoesFormatadas = res.data.map(s => ({
                  value: s.id,
                  label: s.nome
              }));
              setListaServicos(opcoesFormatadas);
          } catch (err) {
              console.error("Erro ao carregar serviços:", err);
              toast.error("Erro ao carregar lista de serviços.");
          }
      }
      carregarServicos();

  }, []); 

  useEffect(() => {
      if (colaboradorParaEditar) {
          // MODO EDIÇÃO
          setNome(colaboradorParaEditar.nome);
          setEmail(colaboradorParaEditar.email);
          setTelefone(colaboradorParaEditar.telefone);
          
          const perfilOpcao = opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil) || 
                              { value: colaboradorParaEditar.perfil, label: colaboradorParaEditar.perfil };
          
          setPerfilSelecionado(perfilOpcao);

          if (colaboradorParaEditar.servicosIds && listaServicos.length > 0) {
              const servicosDoUser = listaServicos.filter(opcao => 
                  colaboradorParaEditar.servicosIds.includes(opcao.value)
              );
              setServicosSelecionados(servicosDoUser);
          } else {
              setServicosSelecionados([]);
          }

          setSenha(""); 
      } else {
          // MODO CRIAÇÃO
          setNome("");
          setEmail("");
          setTelefone("");
          setSenha("");
          setServicosSelecionados([]); 
          
          if (meuPerfil === 'ROLE_GERENTE' && opcoesPerfilPermitidas.length === 1) {
              setPerfilSelecionado(opcoesPerfilPermitidas[0]);
          } else {
              setPerfilSelecionado(null);
          }
      }
  }, [colaboradorParaEditar, opcoesPerfilPermitidas, meuPerfil, listaServicos]); 

  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setCarregando(true);

    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      let idColaborador = null; 

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
          toast.success(`Colaborador ${nome} atualizado com sucesso!`);

      } else {
          // --- MODO CRIAÇÃO (POST) ---
          if (!senha) {
              toast.error("A senha inicial é obrigatória.");
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
          
          idColaborador = respostaCriacao.data.id;
          
          toast.success(`Colaborador ${perfilSelecionado.label} criado com sucesso!`);
      }

      // === VINCULAR SERVIÇOS ===
      if (perfilSelecionado && perfilSelecionado.value === 'ROLE_PROFISSIONAL') {
          const idsParaVincular = servicosSelecionados.map(s => s.value);
          await axios.put(`/admin/profissionais/${idColaborador}/servicos`, idsParaVincular);
      }

      if (!colaboradorParaEditar) {
          setNome(""); setEmail(""); setTelefone(""); setSenha(""); setServicosSelecionados([]);
      }
      
      if (onColaboradorCriado) onColaboradorCriado();
      
    } catch (erroApi) {
       console.error("Erro ao salvar colaborador:", erroApi);
       if (erroApi.response && erroApi.response.data) {
         if (erroApi.response.data.messages) {
             toast.error(erroApi.response.data.messages[0]);
         } else if (typeof erroApi.response.data === 'string') {
             toast.error(erroApi.response.data);
         } else if (erroApi.response.status === 403) {
             toast.error("Ação não permitida. Verifique sua hierarquia.");
         } else {
             toast.error("Erro ao salvar colaborador.");
         }
       } else {
         toast.error("Erro ao conectar com o servidor.");
       }
    } finally {
      setCarregando(false); 
    }
  }

  const isPerfilDisabled = 
      meuPerfil === 'ROLE_GERENTE' || 
      (colaboradorParaEditar && !opcoesPerfilPermitidas.find(op => op.value === colaboradorParaEditar.perfil));

  const mostrarCampoServicos = perfilSelecionado && perfilSelecionado.value === 'ROLE_PROFISSIONAL';

  return (
    <form className="formulario-login" onSubmit={handleSubmit}>
      <h2 className="titulo-login" style={{ marginTop: 0 }}>
          {colaboradorParaEditar ? `Editando: ${colaboradorParaEditar.nome}` : 'Novo Colaborador'}
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
            disabled={!!colaboradorParaEditar} 
            style={{ opacity: colaboradorParaEditar ? 0.5 : 1, cursor: colaboradorParaEditar ? 'not-allowed' : 'default' }}
        />
      </div>

      <div className="input-grupo">
         <label>Perfil (Role)</label>
         <Select
            options={opcoesPerfilPermitidas} 
            value={perfilSelecionado} 
            onChange={(opcao) => {
                setPerfilSelecionado(opcao);
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

      {mostrarCampoServicos && (
          <div className="input-grupo">
              <label>Serviços Realizados</label>
              <Select
                  isMulti 
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

      <div className="input-grupo">
        <label>Telefone</label>
        <input type="tel" placeholder="(11) 99999-8888" value={telefone} onChange={e => setTelefone(e.target.value)} required />
      </div>

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

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
              type="submit" 
              className="botao-login" 
              disabled={carregando || (!colaboradorParaEditar && !perfilSelecionado)} 
              style={{ flex: 2, marginTop: 0 }}
          >
              {carregando ? <Spinner /> : (colaboradorParaEditar ? 'Salvar Alterações' : 'Criar Colaborador')}
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