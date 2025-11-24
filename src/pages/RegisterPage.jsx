import '../App.css'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { useState } from 'react'; 
import axios from 'axios'; 
import { toast } from 'sonner';

/**
 * Esta é a página de Registro de Cliente (/registrar).
 * Agora atualizada com notificações modernas (Toasts).
 */
function RegisterPage() {
  // --- Estados (Memória do Componente) ---
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  
  const [carregando, setCarregando] = useState(false); 
  // Removem os estados de 'erro' e 'sucesso' visuais, pois o Toast cuidará disso.
  
  const navegar = useNavigate(); 


   // Função chamada quando o usuário clica no botão "Criar conta".

  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setCarregando(true); 

    // Limpeza do telefone (Remove tudo que não é número)
    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      // Faz a chamada para a API
      const resposta = await axios.post("/auth/registrar", {
        nome: nome,
        email: email,
        telefone: telefoneLimpo,
        senha: senha
      });
      
      // === MUDANÇA UX: Feedback com Toast ===
      // Mostra uma notificação verde no topo da tela
      toast.success("Conta criada! Verifique seu e-mail para ativar.");
      
      // Aguarda 3 segundos para o usuário ler e redireciona para o Login
      setTimeout(() => { navegar("/"); }, 3000);

    } catch (erroApi) {
      console.error("Erro no registro:", erroApi);
      
      // Tratamento de erros com Toast Vermelho
      if (erroApi.response && erroApi.response.data) {
        if (erroApi.response.data.messages) {
          // Erro de validação (ex: senha curta)
          toast.error(erroApi.response.data.messages[0]);
        } else if (typeof erroApi.response.data === 'string') {
          // Erro simples (ex: email duplicado)
          toast.error(erroApi.response.data);
        } else {
          toast.error("Ocorreu um erro ao processar seu registro.");
        }
      } else {
        toast.error("Não foi possível conectar ao servidor.");
      }
    } finally {
      setCarregando(false); 
    }
  }

  // --- Renderização ---
  return (
    <div className="container-login">
      <h1 className="titulo-login">Criar sua conta</h1>
      
      <form className="formulario-login" onSubmit={handleSubmit}>
        
        <div className="input-grupo">
          <label htmlFor="nome">Nome</label>
          <input type="text" id="nome" placeholder="Seu nome completo" value={nome} onChange={(e) => setNome(e.target.value)} required />
        </div>
        
        <div className="input-grupo">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="exemplo@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        
        <div className="input-grupo">
          <label htmlFor="telefone">Telefone</label>
          <input type="tel" id="telefone" placeholder="(11) 98765-4321" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
        </div>
        
        <div className="input-grupo">
          <label htmlFor="senha">Senha</label>
          <input type="password" id="senha" placeholder="Mínimo 8 caracteres" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        
        {/* Remove os parágrafos <p> de erro/sucesso aqui, o Toast flutuante substitui eles */}
        
        <button type="submit" className="botao-login" disabled={carregando}>
          {carregando ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
      
      <div className="link-registro">
        <p>Já tem uma conta?</p>
        <Link to="/">Entrar</Link>
      </div>
    </div>
  )
}

export default RegisterPage;