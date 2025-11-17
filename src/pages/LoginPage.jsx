import '../App.css'; 
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function LoginPage() {

  const [email, setEmail] = useState(""); 
  const [senha, setSenha] = useState(""); 
  const [erro, setErro] = useState(""); 

  const [carregando, setCarregando] = useState(false);

  const navegar = useNavigate();

  async function handleSubmit(evento) {
    evento.preventDefault(); 
    setErro(""); 
    setCarregando(true);

    // --- Delay de 1 segundo (1000ms) ---
    await sleep(1000); 

    try {
      const resposta = await axios.post(
        "http://localhost:8080/auth/login", 
        {
          email: email, 
          senha: senha 
        }
      );

      const token = resposta.data.token; 
      localStorage.setItem("authToken", token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decodificado = jwtDecode(token);
      const perfil = decodificado.role; 

      if (perfil === 'ROLE_CLIENTE') {
        navegar("/dashboard-cliente");
      } else if (perfil === 'ROLE_PROFISSIONAL') {
        navegar("/dashboard-profissional");
      } else {
        navegar("/dashboard-admin");
      }

    } catch (erroApi) {
      console.error("Erro no login:", erroApi); 

      // Mostrar a mensagem EXATA que o servidor enviou.
      if (erroApi.response && erroApi.response.data) {
          // Ex: "Email ou senha inválidos." OU "Conta bloqueada..."
          setErro(erroApi.response.data);
      } else {
          // Erro genérico se o servidor estiver desligado
          setErro("Não foi possível conectar ao servidor.");
      }

    } finally {
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

        {erro && <p className="mensagem-erro">{erro}</p>}

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