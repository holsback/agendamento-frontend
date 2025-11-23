import '../App.css';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

function VerificarEmailPage() {
    const [searchParams] = useSearchParams();
    const navegar = useNavigate();
    
    const [status, setStatus] = useState('verificando'); // 'verificando', 'sucesso', 'erro'
    const [mensagem, setMensagem] = useState('Validando seu token...');

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            setStatus('erro');
            setMensagem("Link inválido. Nenhum token encontrado.");
            return;
        }

        // Função para chamar a API
        async function validarToken() {
            try {
                // Chama a rota que criamos no AutenticacaoController
                // POST /auth/verificar-email?token=...
                const resposta = await axios.post(`/auth/verificar-email?token=${token}`);
                
                setStatus('sucesso');
                setMensagem(resposta.data); // "E-mail verificado com sucesso..."

                // Redireciona para o login após 3 segundos
                setTimeout(() => {
                    navegar("/");
                }, 3000);

            } catch (error) {
                console.error("Erro na verificação:", error);
                setStatus('erro');
                if (error.response && error.response.data) {
                    setMensagem(error.response.data);
                } else {
                    setMensagem("Não foi possível verificar o e-mail. O link pode ter expirado.");
                }
            }
        }

        validarToken();
    }, [searchParams, navegar]);

    return (
        <div className="container-login" style={{ textAlign: 'center' }}>
            <h2 className="titulo-login">Verificação de Conta</h2>
            
            <div className="content-card" style={{ padding: '30px' }}>
                {/* ÍCONES DINÂMICOS */}
                <div style={{ fontSize: '40px', marginBottom: '20px' }}>
                    {status === 'verificando' && '⏳'}
                    {status === 'sucesso' && '✅'}
                    {status === 'erro' && '❌'}
                </div>

                <p style={{ 
                    fontSize: '18px', 
                    color: status === 'erro' ? '#ff8a80' : status === 'sucesso' ? '#9aff9a' : '#ccc' 
                }}>
                    {mensagem}
                </p>

                {status === 'sucesso' && (
                    <p style={{ fontSize: '14px', color: '#aaa', marginTop: '15px' }}>
                        Redirecionando para o login...
                    </p>
                )}

                {status === 'erro' && (
                    <button 
                        className="botao-secundario" 
                        onClick={() => navegar("/")}
                        style={{ marginTop: '20px', width: '100%' }}
                    >
                        Voltar para o Login
                    </button>
                )}
            </div>
        </div>
    );
}

export default VerificarEmailPage;