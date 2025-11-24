import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import Spinner from './Spinner';

function FormMeusDados() {
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    
    // Campos para troca de senha
    const [novaSenha, setNovaSenha] = useState("");
    const [senhaAtual, setSenhaAtual] = useState("");

    const [carregando, setCarregando] = useState(false);

    // 1. Busca os dados atuais
    useEffect(() => {
        async function carregarDados() {
            try {
                const resposta = await axios.get("/usuarios/meus-dados");
                setNome(resposta.data.nome);
                setEmail(resposta.data.email);
                setTelefone(resposta.data.telefone);
            } catch (error) {
                console.error("Erro ao carregar perfil:", error);
                toast.error("Não foi possível carregar seus dados.");
            }
        }
        carregarDados();
    }, []);

    // 2. Envia as atualizações
    async function handleSubmit(e) {
        e.preventDefault();
        setCarregando(true);

        // Limpa o telefone
        const telefoneLimpo = telefone.replace(/\D/g, "");

        // Validação de senha no frontend
        if (novaSenha && !senhaAtual) {
            toast.error("Para alterar a senha, você precisa informar sua Senha Atual.");
            setCarregando(false);
            return;
        }

        const dadosParaEnviar = {
            nome,
            email,
            telefone: telefoneLimpo,
            senha: novaSenha || null,
            senhaAtual: senhaAtual || null
        };

        try {
            await axios.put("/usuarios/meus-dados", dadosParaEnviar);
            toast.success("Dados atualizados com sucesso!");
            
            // Limpa os campos de senha
            setNovaSenha("");
            setSenhaAtual("");

        } catch (erroApi) {
            console.error("Erro ao atualizar:", erroApi);
            if (erroApi.response && erroApi.response.data) {
                 if (erroApi.response.data.messages) {
                     toast.error(erroApi.response.data.messages[0]);
                 } else if (typeof erroApi.response.data === 'string') {
                     toast.error(erroApi.response.data);
                 } else {
                     toast.error("Erro ao atualizar dados.");
                 }
            } else {
                toast.error("Erro ao conectar com o servidor.");
            }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div className="content-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="titulo-login" style={{ marginTop: 0 }}>Meus Dados</h2>
            
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
                    <label>Senha Atual</label>
                    <input 
                        type="password" 
                        placeholder="Digite sua senha atual" 
                        value={senhaAtual} 
                        onChange={e => setSenhaAtual(e.target.value)} 
                        required={!!novaSenha} 
                    />
                </div>

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

                <button 
                    type="submit" 
                    className="botao-login" 
                    disabled={carregando} 
                    style={{ marginTop: '20px' }}
                >
                    {carregando ? <Spinner /> : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    );
}

export default FormMeusDados;