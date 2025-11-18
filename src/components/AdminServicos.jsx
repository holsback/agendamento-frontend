import '../App.css'; // Importa o CSS
import { useState, useEffect } from 'react'; // Importa "ganchos" do React
import axios from 'axios'; // Importa o Axios para API

/**
 * Este componente agora controla a tela INTEIRA de Serviços.
 * Ele alterna entre o modo "Lista" e o modo "Formulário".
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

    // === MUDANÇA 1 (NOVO ESTADO) ===
    // Novo estado para controlar a visualização
    // 'lista' = mostra o catálogo
    // 'formulario' = mostra o formulário de criar/editar
    const [modo, setModo] = useState('lista');

    /**
     * Efeito (useEffect) que roda UMA VEZ quando o componente carrega.
     * Objetivo: Buscar a lista de serviços na API.
     */
    useEffect(() => {
        buscarServicos();
    }, []); // Array vazio [] = roda só uma vez

    /**
     * Função que busca os serviços ATIVOS na API.
     */
    async function buscarServicos() {
        try {
            const resposta = await axios.get("http://localhost:8080/servicos");
            setServicos(resposta.data);
        } catch (error) {
            console.error("Erro ao buscar serviços:", error);
        }
    }

    // --- MUDANÇA 2 (FUNÇÕES DE CONTROLE DE MODO) ---

    /**
     * Função chamada ao clicar em "Editar" em um item da lista.
     * Preenche o formulário e muda para o modo 'formulario'.
     */
    function handleEditarClick(servico) {
        setEditandoId(servico.id); // Marca qual serviço estamos editando
        // Preenche os estados do formulário com os dados do serviço clicado
        setNome(servico.nome);
        setDescricao(servico.descricao);
        setPreco(servico.preco);
        setDuracao(servico.duracaoMinutos);
        // Muda a tela para o modo formulário
        setModo('formulario');
    }

    /**
     * Função chamada ao clicar em "Cancelar" no formulário.
     * Limpa os campos e volta para o modo 'lista'.
     */
    function handleCancelarEdicao() {
        setEditandoId(null); // Limpa o ID em edição
        // Limpa os campos do formulário
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        // Volta para a tela da lista
        setModo('lista');
    }

    /**
     * Função chamada ao clicar em "+ Novo Serviço".
     * Limpa os campos (garante que não é edição) e muda para o modo 'formulario'.
     */
    function handleNovoClick() {
        setEditandoId(null);
        setNome("");
        setDescricao("");
        setPreco("");
        setDuracao("");
        setModo('formulario');
    }

    /**
     * Função chamada ao salvar (Criar ou Editar) no formulário.
     */
    async function handleSubmit(e) {
        e.preventDefault(); // Impede o recarregamento da página
        setCarregando(true);
        
        const dadosServico = {
            nome,
            descricao,
            preco: parseFloat(preco),
            duracaoMinutos: parseInt(duracao),
            ativo: true // Sempre salva como ativo
        };

        try {
            if (editandoId) {
                // MODO EDIÇÃO (PUT)
                await axios.put(`http://localhost:8080/servicos/${editandoId}`, dadosServico);
                alert("Serviço atualizado com sucesso!");
            } else {
                // MODO CRIAÇÃO (POST)
                await axios.post("http://localhost:8080/servicos", dadosServico);
                alert("Serviço criado com sucesso!");
            }
            
            buscarServicos(); // Recarrega a lista de serviços
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
        if (!confirm(`Tem certeza que deseja excluir o serviço "${nomeServico}"?\nIsso vai marcá-lo como 'Inativo' e sumir das novas agendas.`)) return;
        try {
            // Chama o DELETE (que no backend faz um "soft delete" - seta ativo=false)
            await axios.delete(`http://localhost:8080/servicos/${id}`);
            alert("Serviço marcado como inativo!");
            buscarServicos(); // Recarrega a lista (o item sumirá)
        } catch (error) {
             if (error.response && error.response.status === 409) {
                alert("Não é possível excluir este serviço pois ele já foi usado em agendamentos.\n\nSugestão: Edite o nome dele para 'INATIVO - " + nomeServico + "' se não quiser mais usá-lo.");
            } else {
                alert("Não foi possível excluir o serviço.");
            }
        }
    }

    // --- MUDANÇA 3 (RENDERIZAÇÃO CONDICIONAL) ---
    // Agora o 'return' decide qual "tela" (modo) mostrar.

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
                    
                    {/* O novo botão "+ Novo Serviço" */}
                    <button 
                        className="botao-login" 
                        style={{ marginTop: 0, padding: '10px 15px', fontSize: '15px' }} 
                        onClick={handleNovoClick} // Chama a função que limpa e muda para o modo formulário
                    >
                        + Novo Serviço
                    </button>
                </div>

                {/* A Lista de Serviços (que antes ficava na coluna da direita) */}
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
                                {/* Botão Editar agora chama a função 'handleEditarClick' */}
                                <button onClick={() => handleEditarClick(servico)}
                                        style={{ backgroundColor: '#0069ff33', color: '#0069ff', border: '1px solid #0069ff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                    Editar
                                </button>
                                {/* Botão Excluir */}
                                <button onClick={() => handleDeletar(servico.id, servico.nome)}
                                        style={{ backgroundColor: '#4d2626', color: '#ff8a80', border: '1px solid #ff8a80', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>
                                    Excluir
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
                {/* Título do Formulário (muda se for edição ou criação) */}
                <h2 className="titulo-login" style={{ marginTop: 0 }}>
                    {editandoId ? `Editando: ${nome}` : 'Novo Serviço'}
                </h2>
                
                {/* O Formulário (que antes ficava na coluna da esquerda) */}
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

                    {/* Botões de Ação do Formulário */}
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button 
                            type="submit" 
                            className="botao-login"
                            disabled={carregando} 
                            style={{ flex: 2, marginTop: 0 }}
                        >
                            {carregando ? 'Salvando...' : (editandoId ? 'Salvar Alterações' : 'Adicionar Serviço')}
                        </button>
                        
                        {/* Botão Cancelar (agora chama a função que volta pra lista) */}
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

    // (Se nenhum modo for encontrado, não retorna nada)
    return null;
}

export default AdminServicos;