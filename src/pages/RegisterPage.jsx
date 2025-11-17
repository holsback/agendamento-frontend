import '../App.css'; // Importa o CSS global
import { Link, useNavigate } from 'react-router-dom'; // Importa ferramentas de navegação
import { useState } from 'react'; // Importa o "gancho" (Hook) de Estado do React
import axios from 'axios'; // Importa o Axios para fazer chamadas à API

/**
 * Esta é a página de Registro de Cliente (/registrar)
 */
function RegisterPage() {
  // --- Estados (Memória do Componente) ---
  // useState cria "caixinhas" de memória para guardar o que o usuário digita
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false); // Feedback visual (Spinner)
  const [erro, setErro] = useState(""); // Caixa de mensagem de erro
  const [sucesso, setSucesso] = useState(""); // Caixa de mensagem de sucesso
  
  // useNavigate é um "gancho" que nos dá uma função para forçar a mudança de página
  const navegar = useNavigate(); 

  /**
   * Função chamada quando o usuário clica no botão "Criar conta" (submit do formulário)
   */
  async function handleSubmit(evento) {
    evento.preventDefault(); // Impede o navegador de recarregar a página (comportamento padrão de formulários)
    setCarregando(true); // Ativa o spinner do botão
    setErro(""); // Limpa erros antigos
    setSucesso(""); // Limpa sucessos antigos

    // === NOSSA ALTERAÇÃO ESTÁ AQUI ===
    // Antes de enviar para a API, limpamos o campo telefone.
    // .replace(/\D/g, "") remove tudo que NÃO é dígito (espaços, hífens, parênteses)
    // Ex: "(11) 98765-4321" vira "11987654321"
    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      // Faz a chamada (POST) para a API, agora enviando o telefone JÁ LIMPO
      const resposta = await axios.post("http://localhost:8080/auth/registrar", {
        nome: nome,
        email: email,
        telefone: telefoneLimpo, // <-- MUDANÇA
        senha: senha
      });
      
      // Se deu certo (try...):
      // Mostra a mensagem de sucesso que veio da API (ex: "Usuário cliente registrado...")
      setSucesso(resposta.data + " Você será redirecionado para o Login em 3 segundos...");
      // Espera 3 segundos e joga o usuário para a tela de Login ("/")
      setTimeout(() => { navegar("/"); }, 3000);

    } catch (erroApi) {
      // Se deu errado (catch...):
      console.error("Erro no registro:", erroApi);
      
      // Verifica se a API mandou uma mensagem de erro específica
      if (erroApi.response && erroApi.response.data) {
        if (erroApi.response.data.messages) {
          // Se for um erro de validação (ex: "Email já cadastrado")
          setErro(erroApi.response.data.messages[0]);
        } else if (typeof erroApi.response.data === 'string') {
          // Se for um erro de texto simples (ex: "Email já cadastrado." do controller)
          setErro(erroApi.response.data);
        } else {
          // Outro tipo de erro
          setErro("Ocorreu um erro ao processar seu registro.");
        }
      } else {
        // Se a API estiver offline
        setErro("Não foi possível conectar ao servidor.");
      }
    } finally {
      // finally { ... } roda independente de ter dado certo (try) ou errado (catch)
      setCarregando(false); // Desativa o spinner do botão
    }
  }

  // --- Renderização (O que aparece na tela) ---
  return (
    <div className="container-login">
      <h1 className="titulo-login">Criar sua conta</h1>
      
      {/* Quando o formulário for enviado (submit), ele chama a função handleSubmit */}
      <form className="formulario-login" onSubmit={handleSubmit}>
        
        {/* Campo Nome */}
        <div className="input-grupo">
          <label htmlFor="nome">Nome</label>
          {/* O valor (value) do input é "amarrado" ao estado 'nome'. */}
          {/* onChange (ao digitar) ele chama 'setNome' para atualizar o estado. */}
          <input type="text" id="nome" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        
        {/* Campo Email */}
        <div className="input-grupo">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        
        {/* Campo Telefone */}
        <div className="input-grupo">
          <label htmlFor="telefone">Telefone</label>
          {/* (NOTA: No próximo passo, podemos instalar uma biblioteca de MÁSCARA aqui) */}
          <input type="tel" id="telefone" placeholder="(11) 98765-4321" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        
        {/* Campo Senha */}
        <div className="input-grupo">
          <label htmlFor="senha">Senha</label>
          <input type="password" id="senha" placeholder="Mínimo 8 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        
        {/* Mostra a mensagem de erro, SE ela existir */}
        {erro && <p className="mensagem-erro">{erro}</p>}
        {/* Mostra a mensagem de sucesso, SE ela existir */}
        {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
        
        {/* Botão de Submit (disabled={carregando} faz ele ser inclicável enquanto a API responde) */}
        <button type="submit" className="botao-login" disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      
      {/* Link para voltar ao Login */}
      <div className="link-registro">
        <p>Já tem uma conta?</p>
        <Link to="/">Entrar</Link>
      </div>
    </div>
  )
}

export default RegisterPage;