import React from 'react';
import { useModalStore } from '../stores/useModalStore';
import { Modal } from './ui/BaseModal';
import { CheckIcon } from './icons';

const ConfirmarAgendarRevisoesModal: React.FC = () => {
    const {
        isConfirmarAgendarRevisoesModalOpen,
        confirmarAgendarRevisoesData,
        closeConfirmarAgendarRevisoesModal,
        openAgendarRevisoesModal
    } = useModalStore();

    if (!confirmarAgendarRevisoesData) return null;

    const handleSim = () => {
        closeConfirmarAgendarRevisoesModal();
        openAgendarRevisoesModal(confirmarAgendarRevisoesData);
    };

    const handleNao = () => {
        closeConfirmarAgendarRevisoesModal();
    };

    return (
        <Modal
            isOpen={isConfirmarAgendarRevisoesModalOpen}
            onClose={handleNao}
            size="sm"
        >
            <Modal.Header onClose={handleNao}>
                <h2 className="text-lg font-bold text-foreground">Deseja agendar revisões?</h2>
            </Modal.Header>

            <Modal.Body className="space-y-4">
                <div>
                    <p className="text-sm text-muted-foreground mb-1">Tópico:</p>
                    <p className="text-sm font-medium text-foreground">{confirmarAgendarRevisoesData.topicoNome}</p>
                    <p className="text-xs text-muted-foreground mt-1">Disciplina: {confirmarAgendarRevisoesData.disciplinaNome}</p>
                </div>
                <p className="text-sm text-foreground">
                    Você concluiu este tópico. Deseja agendar revisões para reforçar o aprendizado?
                </p>
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    onClick={handleNao}
                    className="h-10 px-6 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                >
                    Não
                </button>
                <button
                    type="button"
                    onClick={handleSim}
                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors"
                >
                    <CheckIcon className="w-4 h-4" />
                    Sim
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default ConfirmarAgendarRevisoesModal;
