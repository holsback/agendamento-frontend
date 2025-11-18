import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function FormMeusDados() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    
    // Campos para troca de senha
    const [novaSenha, setNovaSenha] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");

    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");

    // 1. Busca os dados atuais assim que o componente aparece na tela
    useEffect(() => {
        async function carregarDados() {
            try {
                const resposta = await axios.get("/usuarios/meus-dados");
                setNome(resposta.data.nome);
                setEmail(resposta.data.email);
                setTelefone(resposta.data.telefone);
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                setErro("Não foi possível carregar seus dados.");
            }
        }
        carregarDados();
    }, []);

    // 2. Envia as atualizações para a API
    async function handleSubmit(e) {
        e.preventDefault();
        setCarregando(true);
        setErro("");
        setSucesso("");

        // Limpa o telefone (remove parênteses, traços, etc.)
        const telefoneLimpo = telefone.replace(/\D/g, "");

        // Validação extra no frontend: Se digitou nova senha, PRECISA da atual
        if (novaSenha && !senhaAtual) {
            setErro("Para alterar a senha, você precisa informar sua Senha Atual.");
            setCarregando(false);
            return;
        }

        const dadosParaEnviar = {
            nome,
            email,
            telefone: telefoneLimpo,
            // Só enviamos a nova senha se o usuário tiver digitado algo
            senha: novaSenha || null,
            senhaAtual: senhaAtual || null
        };

        try {
            await axios.put("/usuarios/meus-dados", dadosParaEnviar);
            setSucesso("Dados atualizados com sucesso!");
            
            // Limpa os campos de senha por segurança
            setNovaSenha("");
            setSenhaAtual("");

        } catch (erroApi) {
            console.error("Erro ao atualizar:", erroApi);
            if (erroApi.response && erroApi.response.data) {
                 if (erroApi.response.data.messages) {
                     setErro(erroApi.response.data.messages[0]);
                 } else if (typeof erroApi.response.data === 'string') {
                     setErro(erroApi.response.data);
                 } else {
                     setErro("Erro ao atualizar dados.");
                 }
            } else {
                setErro("Erro ao conectar com o servidor.");
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="titulo-login" style={{ marginTop: 0 }}>Configurações</h2>
            
            <form onSubmit={handleSubmit} className="formulario-login">
                
                {/* --- Dados Pessoais --- */}
                <div className="input-grupo">
                    <label>Nome</label>
                    <input type="text" value={nome} onChange={e => setNome(e.target.value)} required />
                </div>
                <div className="input-grupo">
                    <label>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="input-grupo">
                    <label>Telefone</label>
                    <input type="tel" value={telefone} onChange={e => setTelefone(e.target.value)} required />
                </div>

                <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                
                {/* --- Área de Segurança --- */}
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '10px' }}>
                    Alterar Senha (Opcional)
                </p>

                <div className="input-grupo">
                    <label>Nova Senha</label>
                    <input 
                        type="password" 
                        placeholder="Deixe em branco para manter a atual" 
                        value={novaSenha} 
                        onChange={e => setNovaSenha(e.target.value)} 
                        minLength={8}
                    />
                </div>

                <div className="input-grupo">
                    <label>Senha Atual (Para confirmar alteração de senha)</label>
                    <input 
                        type="password" 
                        placeholder="Digite sua senha atual" 
                        value={senhaAtual} 
                        onChange={e => setSenhaAtual(e.target.value)} 
                        // O campo vira obrigatório (required) SE a novaSenha estiver preenchida
                        required={!!novaSenha} 
                    />
                </div>

                {/* --- Feedback e Botão --- */}
                {erro && <p className="mensagem-erro">{erro}</p>}
                {sucesso && <p className="mensagem-sucesso">{sucesso}</p>}

                <button 
                    type="submit" 
                    className="botao-login" 
                    disabled={carregando} 
                    style={{ marginTop: '20px' }}
                >
                    {carregando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    );
}

export default FormMeusDados;