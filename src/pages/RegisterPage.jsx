import '../App.css';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import axios from 'axios';

function RegisterPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const navegar = useNavigate();

  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregando(true);
    setErro("");
    setSucesso("");

    try {
      const resposta = await axios.post("http://localhost:8080/auth/registrar", {
        nome: nome,
        email: email,
        telefone: telefone,
        senha: senha
      });
      setSucesso(resposta.data + " Você será redirecionado para o Login em 3 segundos...");
      setTimeout(() => { navegar("/"); }, 3000);
    } catch (erroApi) {
      console.error("Erro no registro:", erroApi);
      if (erroApi.response && erroApi.response.data) {
        if (erroApi.response.data.messages) {
          setErro(erroApi.response.data.messages[0]);
        } else if (typeof erroApi.response.data === 'string') {
          setErro(erroApi.response.data);
        } else {
          setErro("Ocorreu um erro ao processar seu registro.");
        }
      } else {
        setErro("Não foi possível conectar ao servidor.");
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
        {erro && <p className="mensagem-erro">{erro}</p>}
        {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}
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