import '../App.css'; 
import { Link, useNavigate } from 'react-router-dom'; 
import { useState } from 'react'; 
import axios from 'axios'; 
import { toast } from 'sonner'; 
import Spinner from '../components/Spinner'; //

/**
 * Esta é a página de Registro de Cliente (/registrar).
 * Agora com Spinner no botão de ação.
 */
function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  
  const [carregando, setCarregando] = useState(false); 
  
  const navegar = useNavigate(); 

  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setCarregando(true); 

    const telefoneLimpo = telefone.replace(/\D/g, "");

    try {
      const resposta = await axios.post("/auth/registrar", {
        nome: nome,
        email: email,
        telefone: telefoneLimpo,
        senha: senha
      });
      
      toast.success("Conta criada! Verifique seu e-mail para ativar.");
      
      setTimeout(() => { navegar("/"); }, 3000);

    } catch (erroApi) {
      console.error("Erro no registro:", erroApi);
      
      if (erroApi.response && erroApi.response.data) {
        if (erroApi.response.data.messages) {
          toast.error(erroApi.response.data.messages[0]);
        } else if (typeof erroApi.response.data === 'string') {
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
        
        {/*
            Spinner centralizado no lugar do texto 'Criando conta...'
        */}
        <button type="submit" className="botao-login" disabled={carregando}>
          {carregando ? <Spinner /> : 'Criar conta'}
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