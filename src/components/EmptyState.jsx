import '../App.css';

/**
 * Componente para mostrar quando uma lista está vazia.
 * @param {string} titulo - Ex: "Nenhum agendamento"
 * @param {string} descricao - Ex: "Que tal marcar um corte agora?"
 * @param {ReactNode} children - (Opcional) Botão ou link para ação
 */
function EmptyState({ titulo, descricao, children }) {
    return (
        <div className="empty-state">
            <h3>{titulo}</h3>
            <p>{descricao}</p>
            
            {/* Só mostra a div de ação se tiver algum botão dentro */}
            {children && <div className="empty-action">{children}</div>}
        </div>
    );
}

export default EmptyState;