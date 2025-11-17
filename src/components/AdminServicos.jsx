import '../App.css';
import { useState, useEffect } from 'react';
import axios from 'axios';

function AdminServicos() {
    const [servicos, setServicos] = useState([]);
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [duracao, setDuracao] = useState("");
    const [carregando, setCarregando] = useState(false);
    const [editandoId, setEditandoId] = useState(null);

    async function buscarServicos() {
        try {
            // Traz apenas os serviços ATIVOS para a lista principal
            const resposta = await axios.get("http://localhost:8080/servicos");
            setServicos(resposta.data);
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
        }
    }

    useEffect(() => {
        buscarServicos();
    }, []);

    function handleEditarClick(servico) {
        setEditandoId(servico.id);
        setNome(servico.nome);
        setDescricao(servico.descricao);
        setPreco(servico.preco);
        setDuracao(servico.duracaoMinutos);
    }

    function handleCancelarEdicao() {
        setEditandoId(null);
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setCarregando(true);
        
        const dadosServico = {
            nome,
            descricao,
            preco: parseFloat(preco),
            duracaoMinutos: parseInt(duracao),
            ativo: true 
        };

        try {
            if (editandoId) {
                await axios.put(`http://localhost:8080/servicos/${editandoId}`, dadosServico);
                alert("Serviço atualizado com sucesso!");
            } else {
                await axios.post("http://localhost:8080/servicos", dadosServico);
                alert("Serviço criado com sucesso!");
            }
            
            handleCancelarEdicao(); 
            buscarServicos();       

        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            alert("Erro ao salvar (verifique se o nome já não existe).");
        } finally {
            setCarregando(false);
        }
    }

    async function handleDeletar(id, nomeServico) {
        if (!confirm(`Tem certeza que deseja excluir o serviço "${nomeServico}"?\nIsso vai marcá-lo como 'Inativo' e sumir das novas agendas.`)) return;
        try {
            await axios.delete(`http://localhost:8080/servicos/${id}`);
            alert("Serviço marcado como inativo!");
            buscarServicos();
        } catch (error) {
             if (error.response && error.response.status === 409) {
                alert("Não é possível excluir este serviço pois ele já foi usado em agendamentos.\n\nSugestão: Edite o nome dele para 'INATIVO - " + nomeServico + "' se não quiser mais usá-lo.");
            } else {
                alert("Não foi possível excluir o serviço.");
            }
        }
    }

    return (
        <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap' }}>
            {/* --- FORMULÁRIO --- */}
            <div style={{ flex: 1, minWidth: '300px' }}>
                <div className="content-card">
                    <h2 className="titulo-login" style={{ marginTop: 0 }}>
                        {editandoId ? 'Editando Serviço' : 'Novo Serviço'}
                    </h2>
                    
                    <form onSubmit={handleSubmit} className="formulario-login">
                        <div className="input-grupo">
                            <label>Nome do Serviço</label>
                            <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Corte Degrade" required />
                        </div>
                        <div className="input-grupo">
                            <label>Descrição Rápida</label>
                            <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Ex: Máquina nas laterais, tesoura em cima" required />
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="input-grupo" style={{ flex: 1 }}>
                                <label>Preço (R$)</label>
                                <input type="number" value={preco} onChange={e => setPreco(e.target.value)} placeholder="50.00" step="0.01" min="0" required />
                            </div>
                            <div className="input-grupo" style={{ flex: 1 }}>
                                <label>Duração (min)</label>
                                <input type="number" value={duracao} onChange={e => setDuracao(e.target.value)} placeholder="30" step="5" min="5" required />
                            </div>
                        </div>

                        {/* --- BOTÕES COM CLASSES PADRONIZADAS --- */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                            <button 
                                type="submit" 
                                className="botao-login" /* <--- CLASSE PRIMÁRIA */
                                disabled={carregando} 
                                style={{ flex: 2, marginTop: 0 }} /* Resetamos o margin-top */
                            >
                                {carregando ? 'Salvando...' : (editandoId ? 'Salvar Alterações' : 'Adicionar Serviço')}
                            </button>
                            
                            {editandoId && (
                                <button 
                                    type="button" 
                                    onClick={handleCancelarEdicao} 
                                    className="botao-secundario" /* <--- CLASSE SECUNDÁRIA */
                                    style={{ flex: 1 }}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>

            {/* --- LISTA DE SERVIÇOS (Com botão de editar) --- */}
            <div style={{ flex: 1.5, minWidth: '300px' }}>
                <div className="content-card">
                    <h2 className="titulo-login" style={{ marginTop: 0 }}>Catálogo de Serviços</h2>
                    <ul className="lista-agendamentos">
                        {/* Filtramos para mostrar apenas serviços ATIVOS na lista de edição */}
                        {servicos.filter(s => s.ativo).map(servico => (
                            <li key={servico.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <strong style={{ fontSize: '16px', marginBottom: '4px', color: '#0069ff' }}>
                                        {servico.nome}
                                    </strong>
                                    <p style={{ fontSize: '14px', color: '#ccc', margin: '4px 0' }}>
                                        {servico.descricao}
                                    </p>
                                    <div style={{ display: 'flex', gap: '15px', fontSize: '13px', fontWeight: 'bold' }}>
                                        <span style={{ color: '#9aff9a' }}>R$ {servico.preco.toFixed(2)}</span>
                                        <span style={{ color: '#aaa' }}>🕒 {servico.duracaoMinutos} min</span>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button onClick={() => handleEditarClick(servico)}
                                            style={{ backgroundColor: '#0069ff33', color: '#0069ff', border: '1px solid #0069ff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                        Editar
                                    </button>
                                    <button onClick={() => handleDeletar(servico.id, servico.nome)}
                                            style={{ backgroundColor: '#4d2626', color: '#ff8a80', border: '1px solid #ff8a80', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                        Excluir
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminServicos;