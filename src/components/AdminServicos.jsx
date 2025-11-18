import '../App.css'; // Importa o CSS
import { useState, useEffect } from 'react'; // Importa "ganchos" do React
import axios from 'axios'; // Importa o Axios para API

/**
 * Este componente agora controla a tela INTEIRA de Serviços.
 * Ele alterna entre o modo "Lista" e o modo "Formulário".
 * (Refatorado no Passo 4.1)
 */
function AdminServicos() {
    
    // --- Estados (Memória) do Componente ---
    const [servicos, setServicos] = useState([]); // Guarda a lista de serviços
    
    // Estados do Formulário
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [preco, setPreco] = useState("");
    const [duracao, setDuracao] = useState("");
    
    // Estados de Feedback e Controle
    const [carregando, setCarregando] = useState(false);
    const [editandoId, setEditandoId] = useState(null); // Guarda o ID do serviço em edição
    const [modo, setModo] = useState('lista'); // 'lista' ou 'formulario'

    /**
     * Efeito (useEffect) que roda UMA VEZ quando o componente carrega.
     */
    useEffect(() => {
        buscarServicos();
    }, []); // Array vazio [] = roda só uma vez

    /**
     * Função que busca os serviços ATIVOS na API.
     * (Otimizamos removendo a URL hardcoded no Passo 6.x)
     */
    async function buscarServicos() {
        try {
            const resposta = await axios.get("/servicos"); // URL relativa
            setServicos(resposta.data);
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
        }
    }

    // --- Funções de Controle de Modo (do Passo 4.1) ---

    /**
     * Função chamada ao clicar em "Editar" em um item da lista.
     */
    function handleEditarClick(servico) {
        setEditandoId(servico.id); 
        setNome(servico.nome);
        setDescricao(servico.descricao);
        setPreco(servico.preco);
        setDuracao(servico.duracaoMinutos);
        setModo('formulario'); // Muda a tela
    }

    /**
     * Função chamada ao clicar em "Cancelar" no formulário.
     */
    function handleCancelarEdicao() {
        setEditandoId(null); 
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setModo('lista'); // Volta para a lista
    }

    /**
     * Função chamada ao clicar em "+ Novo Serviço".
     */
    function handleNovoClick() {
        setEditandoId(null);
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setModo('formulario'); // Muda a tela
    }

    /**
     * Função chamada ao salvar (Criar ou Editar) no formulário.
     */
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
                // MODO EDIÇÃO (PUT)
                await axios.put(`/servicos/${editandoId}`, dadosServico); // URL relativa
                alert("Serviço atualizado com sucesso!");
            } else {
                // MODO CRIAÇÃO (POST)
                await axios.post("/servicos", dadosServico); // URL relativa
                alert("Serviço criado com sucesso!");
            }
            
            buscarServicos(); // Recarrega a lista
            handleCancelarEdicao(); // Limpa o form e VOLTA PARA A LISTA

        } catch (error) {
            console.error("Erro ao salvar serviço:", error);
            alert("Erro ao salvar (verifique se o nome já não existe).");
        } finally {
            setCarregando(false);
        }
    }

    /**
     * Função chamada ao clicar em "Excluir" (Desativar) em um item da lista.
     */
    async function handleDeletar(id, nomeServico) {
        if (!confirm(`Tem certeza que deseja desativar o serviço "${nomeServico}"?\nIsso o tornará indisponível para novos agendamentos.`)) return;
        
        try {
            // Chama o DELETE (que no backend faz um "soft delete" - seta ativo=false)
            await axios.delete(`/servicos/${id}`); // URL relativa
            alert("Serviço desativado com sucesso!");
            buscarServicos(); // Recarrega a lista (o item sumirá)
            
        // === NOSSA ALTERAÇÃO DESTE PASSO ESTÁ AQUI ===
        } catch (error) {
            // O 'soft delete' (setar ativo=false) NUNCA vai dar erro 409 (Conflito).
            // O único erro provável aqui é um 403 (Token venceu) ou 500 (API caiu).
            // Removemos o 'if (error.response.status === 409)'
            // porque ele estava baseado numa premissa errada.
            console.error("Erro ao desativar serviço:", error);
            alert("Não foi possível desativar o serviço. Tente novamente.");
        }
    }

    // --- Renderização Condicional (do Passo 4.1) ---

    /**
     * SE o modo for 'lista', renderiza o Catálogo (Lista)
     */
    if (modo === 'lista') {
        return (
            <div className="content-card">
                {/* Cabeçalho da Lista: Título + Novo Botão */}
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

                {/* A Lista de Serviços */}
                <ul className="lista-agendamentos">
                    {/* Filtramos para mostrar apenas serviços ATIVOS */}
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
                                {/* Botão Excluir/Desativar */}
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

    /**
     * SE o modo for 'formulario', renderiza o Formulário (centralizado)
     */
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
                            {carregando ? 'Salvando...' : (editandoId ? 'Salvar Alterações' : 'Adicionar Serviço')}
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