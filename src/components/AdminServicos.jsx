import '../App.css'; 
import { useState, useEffect } from 'react'; 
import axios from 'axios'; 
import { toast } from 'sonner';
import Spinner from './Spinner';

/**
 * Catálogo de Serviços.
 * Agora com Toasts e Spinners.
 */
function AdminServicos() {
    
    const [servicos, setServicos] = useState([]); 
    
    // Estados do Formulário
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [duracao, setDuracao] = useState("");
    
    const [carregando, setCarregando] = useState(false);
    const [editandoId, setEditandoId] = useState(null); 
    const [modo, setModo] = useState('lista'); 

    useEffect(() => {
        buscarServicos();
    }, []); 

    async function buscarServicos() {
        try {
            const resposta = await axios.get("/servicos"); 
            setServicos(resposta.data);
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
            toast.error("Não foi possível carregar os serviços.");
        }
    }

    // --- Funções de Controle ---

    function handleEditarClick(servico) {
        setEditandoId(servico.id); 
        setNome(servico.nome);
        setDescricao(servico.descricao);
        setPreco(servico.preco);
        setDuracao(servico.duracaoMinutos);
        setModo('formulario'); 
    }

    function handleCancelarEdicao() {
        setEditandoId(null); 
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setModo('lista'); 
    }

    function handleNovoClick() {
        setEditandoId(null);
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setModo('formulario'); 
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
                // MODO EDIÇÃO
                await axios.put(`/servicos/${editandoId}`, dadosServico); 
                toast.success("Serviço atualizado com sucesso!");
            } else {
                // MODO CRIAÇÃO
                await axios.post("/servicos", dadosServico); 
                toast.success("Serviço criado com sucesso!");
            }
            
            buscarServicos(); 
            handleCancelarEdicao(); 

        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            // Tenta pegar mensagem específica do backend
            if (error.response && error.response.data && typeof error.response.data === 'string') {
                toast.error(error.response.data);
            } else {
                toast.error("Erro ao salvar serviço. Verifique os dados.");
            }
        } finally {
            setCarregando(false);
        }
    }

    async function handleDeletar(id, nomeServico) {
        // Mantem o confirm nativo por enquanto (será substituído por Modal depois)
        if (!confirm(`Tem certeza que deseja desativar o serviço "${nomeServico}"?\nIsso o tornará indisponível para novos agendamentos.`)) return;
        
        try {
            await axios.delete(`/servicos/${id}`); 
            toast.success("Serviço desativado com sucesso!");
            buscarServicos(); 
            
        } catch (error) {
            console.error("Erro ao desativar serviço:", error);
            toast.error("Não foi possível desativar o serviço.");
        }
    }

    // --- Renderização ---

    if (modo === 'lista') {
        return (
            <div className="content-card">
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '20px' 
                }}>
                    <h2 className="titulo-login" style={{ marginTop: 0, marginBottom: 0 }}>Catálogo de Serviços</h2>
                    
                    <button 
                        className="botao-login" 
                        style={{ marginTop: 0, padding: '10px 15px', fontSize: '15px' }} 
                        onClick={handleNovoClick} 
                    >
                        + Novo Serviço
                    </button>
                </div>

                <ul className="lista-agendamentos">
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
                                    Desativar
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    if (modo === 'formulario') {
        return (
            <div className="content-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
                <h2 className="titulo-login" style={{ marginTop: 0 }}>
                    {editandoId ? `Editando: ${nome}` : 'Novo Serviço'}
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

                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button 
                            type="submit" 
                            className="botao-login"
                            disabled={carregando} 
                            style={{ flex: 2, marginTop: 0 }}
                        >
                            {carregando ? <Spinner /> : (editandoId ? 'Salvar Alterações' : 'Adicionar Serviço')}
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={handleCancelarEdicao} 
                            className="botao-secundario"
                            style={{ flex: 1 }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return null;
}

export default AdminServicos;