import React, { useState, useEffect } from 'react';
import { toast } from './Sonner';
import { useModalStore } from '../stores/useModalStore';
import { scheduleAutoRevisoes } from '../hooks/useAutoRevisoes';
import { XIcon, PlusIcon, CheckIcon } from './icons';

const AgendarRevisoesModal: React.FC = () => {
    const { isAgendarRevisoesModalOpen, agendarRevisoesData, closeAgendarRevisoesModal } = useModalStore();
    const [intervalosRevisao, setIntervalosRevisao] = useState<number[]>([1, 7, 30, 60]);
    const [novoIntervalo, setNovoIntervalo] = useState<string>('');
    const [mostrarInputNovoIntervalo, setMostrarInputNovoIntervalo] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Resetar intervalos quando o modal abrir
    useEffect(() => {
        if (isAgendarRevisoesModalOpen) {
            setIntervalosRevisao([1, 7, 30, 60]);
            setNovoIntervalo('');
            setMostrarInputNovoIntervalo(false);
        }
    }, [isAgendarRevisoesModalOpen]);

    const handleConfirmar = async () => {
        if (!agendarRevisoesData) return;
        
        if (intervalosRevisao.length === 0) {
            toast.error('Adicione pelo menos um intervalo de revisão');
            return;
        }

        setIsLoading(true);
        try {
            await scheduleAutoRevisoes({
                disciplinaId: agendarRevisoesData.disciplinaId,
                disciplinaNome: agendarRevisoesData.disciplinaNome,
                topicoId: agendarRevisoesData.topicoId,
                topicoNome: agendarRevisoesData.topicoNome,
                intervals: intervalosRevisao,
            });
            toast.success(`Revisões agendadas para "${agendarRevisoesData.topicoNome}"!`);
            closeAgendarRevisoesModal();
        } catch (error) {
            console.error("Failed to schedule revisions:", error);
            toast.error("Falha ao agendar revisões.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isAgendarRevisoesModalOpen || !agendarRevisoesData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-white/10 rounded-xl shadow-xl w-full max-w-md mx-4">
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Deseja agendar revisões?</h2>
                        <p className="text-xs text-muted-foreground mt-1">Configure os intervalos para revisar este tópico</p>
                    </div>
                    <button
                        onClick={closeAgendarRevisoesModal}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </header>

                <div className="p-4 space-y-4 overflow-x-hidden">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Tópico:</p>
                        <p className="text-sm font-medium text-foreground">{agendarRevisoesData.topicoNome}</p>
                        <p className="text-xs text-muted-foreground mt-1">Disciplina: {agendarRevisoesData.disciplinaNome}</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground block">
                            Intervalos de revisão (em dias)
                        </label>
                        
                        <div className="flex flex-wrap items-center gap-2">
                            {intervalosRevisao.map((intervalo, index) => (
                                <div 
                                    key={index}
                                    className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                                >
                                    <span>{intervalo}d</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIntervalosRevisao(prev => prev.filter((_, i) => i !== index));
                                        }}
                                        className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                    >
                                        <XIcon className="w-3 h-3" />
                                    </button>
                                </div>
                            ))}
                            
                            {!mostrarInputNovoIntervalo ? (
                                <button
                                    type="button"
                                    onClick={() => setMostrarInputNovoIntervalo(true)}
                                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                                >
                                    <PlusIcon className="w-4 h-4" />
                                </button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={novoIntervalo}
                                        onChange={(e) => setNovoIntervalo(e.target.value)}
                                        placeholder="dias"
                                        className="w-20 bg-input border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-primary focus:border-primary"
                                        min="1"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const valor = parseInt(novoIntervalo);
                                                if (valor > 0 && !intervalosRevisao.includes(valor)) {
                                                    setIntervalosRevisao(prev => [...prev, valor].sort((a, b) => a - b));
                                                    setNovoIntervalo('');
                                                    setMostrarInputNovoIntervalo(false);
                                                }
                                            } else if (e.key === 'Escape') {
                                                setMostrarInputNovoIntervalo(false);
                                                setNovoIntervalo('');
                                            }
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const valor = parseInt(novoIntervalo);
                                            if (valor > 0 && !intervalosRevisao.includes(valor)) {
                                                setIntervalosRevisao(prev => [...prev, valor].sort((a, b) => a - b));
                                                setNovoIntervalo('');
                                                setMostrarInputNovoIntervalo(false);
                                            }
                                        }}
                                        className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 transition-colors"
                                    >
                                        Adicionar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setMostrarInputNovoIntervalo(false);
                                            setNovoIntervalo('');
                                        }}
                                        className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs hover:bg-muted/80 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {intervalosRevisao.length === 0 && (
                            <p className="text-xs text-red-500">Adicione pelo menos um intervalo de revisão</p>
                        )}
                        
                        <p className="text-xs text-muted-foreground">
                            As revisões serão agendadas automaticamente nos intervalos selecionados.
                        </p>
                    </div>
                </div>

                <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <button 
                        type="button" 
                        onClick={closeAgendarRevisoesModal} 
                        className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleConfirmar}
                        disabled={isLoading || intervalosRevisao.length === 0}
                        className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>Aguarde...</>
                        ) : (
                            <>
                                <CheckIcon className="w-4 h-4" /> Agendar revisões
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default AgendarRevisoesModal;

