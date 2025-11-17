import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function FormConfiguracao() {
    const [inicio, setInicio] = useState("");
    const [fim, setFim] = useState("");
    const [diasSelecionados, setDiasSelecionados] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [mensagem, setMensagem] = useState({ texto: "", tipo: "" });
    const diasDaSemana = [
        { valor: 'MONDAY', rotulo: 'Segunda-feira' },
        { valor: 'TUESDAY', rotulo: 'Terça-feira' },
        { valor: 'WEDNESDAY', rotulo: 'Quarta-feira' },
        { valor: 'THURSDAY', rotulo: 'Quinta-feira' },
        { valor: 'FRIDAY', rotulo: 'Sexta-feira' },
        { valor: 'SATURDAY', rotulo: 'Sábado' },
        { valor: 'SUNDAY', rotulo: 'Domingo' }
    ];

    useEffect(() => {
        carregarConfiguracao();
    }, []);

    async function carregarConfiguracao() {
        try {
            const resposta = await axios.get("http://localhost:8080/configuracao");
            setInicio(resposta.data.inicioExpediente);
            setFim(resposta.data.fimExpediente);
            setDiasSelecionados(resposta.data.diasFuncionamento);
        } catch (error) {
            console.error("Erro ao carregar configurações:", error);
            setMensagem({ texto: "Não foi possível carregar as configurações atuais.", tipo: 'erro' });
        }
    }

    function toggleDia(diaValor) {
        if (diasSelecionados.includes(diaValor)) {
            setDiasSelecionados(diasSelecionados.filter(d => d !== diaValor));
        } else {
            setDiasSelecionados([...diasSelecionados, diaValor]);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setCarregando(true);
        setMensagem({ texto: "", tipo: "" });

        try {
            await axios.put("http://localhost:8080/configuracao", {
                inicioExpediente: inicio,
                fimExpediente: fim,
                diasFuncionamento: diasSelecionados
            });
            setMensagem({ texto: "Configurações atualizadas com sucesso!", tipo: 'sucesso' });
        } catch (error) {
            console.error("Erro ao salvar:", error);
             if (error.response && error.response.status === 403) {
                 setMensagem({ texto: "Você não tem permissão para alterar estas configurações.", tipo: 'erro' });
             } else {
                 setMensagem({ texto: "Erro ao salvar as configurações.", tipo: 'erro' });
             }
        } finally {
            setCarregando(false);
        }
    }

    return (
        <div style={{ maxWidth: '600px' }}>
            <h2 className="titulo-login" style={{ marginTop: 0 }}>Regras de Funcionamento</h2>
            <p style={{ color: '#aaa', marginBottom: '30px' }}>
                Defina os horários padrão e os dias em que o estabelecimento está aberto.
            </p>

            <form onSubmit={handleSubmit} className="formulario-login">
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div className="input-grupo" style={{ flex: 1 }}>
                        <label>Horário de Abertura</label>
                        <input type="time" value={inicio} onChange={e => setInicio(e.target.value)} required />
                    </div>
                    <div className="input-grupo" style={{ flex: 1 }}>
                        <label>Horário de Fechamento</label>
                        <input type="time" value={fim} onChange={e => setFim(e.target.value)} required />
                    </div>
                </div>

                <div className="input-grupo" style={{ marginTop: '20px' }}>
                    <label style={{ marginBottom: '10px', display: 'block' }}>Dias de Funcionamento</label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                        {diasDaSemana.map(dia => (
                            <label key={dia.valor}
                                   style={{
                                       display: 'flex',
                                       alignItems: 'center',
                                       gap: '8px',
                                       padding: '10px',
                                       backgroundColor: diasSelecionados.includes(dia.valor) ? '#0069ff33' : '#2a2a2a',
                                       border: diasSelecionados.includes(dia.valor) ? '1px solid #0069ff' : '1px solid #333',
                                       borderRadius: '6px',
                                       cursor: 'pointer',
                                       fontWeight: 'normal'
                                   }}>
                                <input
                                    type="checkbox"
                                    checked={diasSelecionados.includes(dia.valor)}
                                    onChange={() => toggleDia(dia.valor)}
                                    style={{ width: 'auto' }}
                                />
                                {dia.rotulo}
                            </label>
                        ))}
                    </div>
                </div>

                {mensagem.texto && (
                    <p className={mensagem.tipo === 'sucesso' ? 'mensagem-sucesso' : 'mensagem-erro'} style={{ marginTop: '20px' }}>
                        {mensagem.texto}
                    </p>
                )}

                <button type="submit" className="botao-login" disabled={carregando} style={{ marginTop: '30px' }}>
                    {carregando ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </form>
        </div>
    );
}

export default FormConfiguracao;