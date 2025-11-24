import '../App.css'; 
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from 'sonner';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function LoginPage() {

  // Estados para armazenar o que o usuário digita
  const [email, setEmail] = useState(""); 
  const [senha, setSenha] = useState(""); 
  
  // Controla o estado visual do botão (carregando ou não)
  const [carregando, setCarregando] = useState(false);

  const navegar = useNavigate();

  /**
   * Função responsável por processar o envio do formulário de login.
   * Realiza a validação, chamada à API e redirecionamento.
   */
  async function handleSubmit(evento) {
    // Evita o recarregamento padrão da página
    evento.preventDefault(); 
    
    // Inicia o feedback visual de carregamento
    setCarregando(true);

    // Simula um pequeno atraso para que o usuário perceba o processo de carregamento
    await sleep(1000); 

    try {
      // Envia as credenciais para o backend
      const resposta = await axios.post(
        "/auth/login", 
        {
          email: email, 
          senha: senha 
        }
      );

      // Armazena o token recebido para autenticar futuras requisições
      const token = resposta.data.token; 
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Decodifica o token para identificar o perfil do usuário
      const decodificado = jwtDecode(token);
      const perfil = decodificado.role; 
      const nome = decodificado.nome || "Usuário";

      // Exibe notificação de sucesso
      toast.success(`Bem-vindo de volta, ${nome}!`);

      // Redireciona o usuário para o dashboard apropriado baseado no perfil
      if (perfil === 'ROLE_CLIENTE') {
        navegar("/dashboard-cliente");
      } else if (perfil === 'ROLE_PROFISSIONAL') {
        navegar("/dashboard-profissional");
      } else {
        navegar("/dashboard-admin");
      }

    } catch (erroApi) {
      console.error("Erro no login:", erroApi); 

      // Identifica a mensagem de erro correta para exibir ao usuário
      if (erroApi.response && erroApi.response.data) {
          // Exibe o erro específico retornado pela API (ex: "Senha incorreta", "Conta não verificada")
          toast.error(erroApi.response.data);
      } else {
          // Exibe erro genérico de conexão
          toast.error("Não foi possível conectar ao servidor.");
      }

    } finally {
      // Finaliza o estado de carregamento, liberando o botão novamente
      setCarregando(false);
    }
  }
  
  return (
    <div className="container-login">
      <h1 className="titulo-login">Entrar na sua conta</h1>
      
      <form className="formulario-login" onSubmit={handleSubmit}>
        
        <div className="input-grupo">
          <label htmlFor="email">Email</label>
          <input 
            type="email" 
            id="email"
            placeholder="exemplo@email.com"
            value={email} 
            onChange={ (e) => setEmail(e.target.value) } 
            required 
          />
        </div>

        <div className="input-grupo">
          <label htmlFor="senha">Senha</label>
          <input 
            type="password" 
            id="senha"
            placeholder="Sua senha"
            value={senha} 
            onChange={ (e) => setSenha(e.target.value) } 
            required 
          />
        </div>

        {/* O botão fica desabilitado durante o carregamento para evitar múltiplos cliques */}
        <button 
          type="submit" 
          className="botao-login" 
          disabled={carregando}
        >
          {carregando ? 'Carregando...' : 'Entrar'}
        </button>
      </form>

      <div className="link-registro">
        <p>Não tem uma conta?</p>
        <Link to="/registrar">Crie uma conta</Link>
      </div>
    </div>
  )
}

export default LoginPage