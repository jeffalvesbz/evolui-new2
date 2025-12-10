import React from 'react';
import { useModalStore } from '../stores/useModalStore';
import { XIcon, CheckIcon } from './icons';

const ConfirmarAgendarRevisoesModal: React.FC = () => {
    const { 
        isConfirmarAgendarRevisoesModalOpen, 
        confirmarAgendarRevisoesData, 
        closeConfirmarAgendarRevisoesModal,
        openAgendarRevisoesModal
    } = useModalStore();

    if (!isConfirmarAgendarRevisoesModalOpen || !confirmarAgendarRevisoesData) return null;

    const handleSim = () => {
        closeConfirmarAgendarRevisoesModal();
        openAgendarRevisoesModal(confirmarAgendarRevisoesData);
    };

    const handleNao = () => {
        closeConfirmarAgendarRevisoesModal();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md mx-4">
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">Deseja agendar revisões?</h2>
                    <button
                        onClick={handleNao}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-6 space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Tópico:</p>
                        <p className="text-sm font-medium text-foreground">{confirmarAgendarRevisoesData.topicoNome}</p>
                        <p className="text-xs text-muted-foreground mt-1">Disciplina: {confirmarAgendarRevisoesData.disciplinaNome}</p>
                    </div>
                    <p className="text-sm text-foreground">
                        Você concluiu este tópico. Deseja agendar revisões para reforçar o aprendizado?
                    </p>
                </div>

                <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
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
                </footer>
            </div>
        </div>
    );
};

export default ConfirmarAgendarRevisoesModal;

