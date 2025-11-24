import '../App.css';

/**
 * Modal genérico de confirmação.
 * Substitui o window.confirm() nativo.
 * @param {boolean} isOpen - Se true, o modal aparece.
 * @param {function} onClose - Função chamada ao cancelar (fecha o modal).
 * @param {function} onConfirm - Função chamada ao confirmar (executa a ação).
 * @param {string} titulo - Título da janela (ex: "Tem certeza?").
 * @param {string} mensagem - Texto explicativo.
 */
function ConfirmationModal({ isOpen, onClose, onConfirm, titulo, mensagem }) {
    // Se não estiver aberto, retorna null (não renderiza nada no HTML)
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>{titulo}</h3>
                <p>{mensagem}</p>
                
                <div className="modal-actions">
                    <button className="botao-cancelar" onClick={onClose}>
                        Cancelar
                    </button>
                    <button className="botao-perigo" onClick={onConfirm}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmationModal;