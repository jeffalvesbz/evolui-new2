import React, { useState, useEffect, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { toast } from './Sonner';
import { XIcon, CheckIcon, ZapIcon, UploadIcon } from './icons';
import { Disciplina, Topico } from '../types';

interface FormData {
  titulo: string;
}

const generateTopicId = () => `topico-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const AdicionarTopicoModal: React.FC = () => {
    const { isAddTopicModalOpen, addTopicTargetDisciplinaId, closeAddTopicModal } = useModalStore();
    const { disciplinas, updateDisciplina } = useDisciplinasStore();
    
    const [isModoContinuo, setIsModoContinuo] = useState(true);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchTopics, setBatchTopics] = useState("");

    const { register, handleSubmit, reset, setFocus, getValues } = useForm<FormData>();
    
    const disciplina = disciplinas.find(d => d.id === addTopicTargetDisciplinaId);

    useEffect(() => {
        if (isAddTopicModalOpen) {
            reset({ titulo: '' });
            setIsBatchMode(false);
            setBatchTopics("");
            setTimeout(() => setFocus('titulo'), 100);
        }
    }, [isAddTopicModalOpen, reset, setFocus]);

    const handleAddTopic = useCallback(async (titulo: string) => {
        if (!disciplina || !titulo.trim()) return;

        const novoTopico: Topico = {
            id: generateTopicId(),
            titulo: titulo.trim(),
            concluido: false,
            nivelDificuldade: 'desconhecido',
            ultimaRevisao: null,
            proximaRevisao: null,
        };

        const topicosAtualizados = [...disciplina.topicos, novoTopico];
        await updateDisciplina(disciplina.id, { topicos: topicosAtualizados });
        
    }, [disciplina, updateDisciplina]);
    
    const onSubmit: SubmitHandler<FormData> = async (data) => {
        await handleAddTopic(data.titulo);
        toast.success(`Tópico "${data.titulo}" adicionado!`);
        
        if (isModoContinuo) {
            reset({ titulo: '' });
        } else {
            closeAddTopicModal();
        }
    };
    
    const handleBatchSubmit = async () => {
        if (!disciplina || !batchTopics.trim()) return;

        const titulos = batchTopics.split('\n').map(t => t.trim()).filter(Boolean);
        if(titulos.length === 0) return;

        const novosTopicos: Topico[] = titulos.map(titulo => ({
            id: generateTopicId(),
            titulo,
            concluido: false,
            nivelDificuldade: 'desconhecido',
            ultimaRevisao: null,
            proximaRevisao: null,
        }));
        
        const topicosAtualizados = [...disciplina.topicos, ...novosTopicos];
        await updateDisciplina(disciplina.id, { topicos: topicosAtualizados });
        toast.success(`${titulos.length} tópicos adicionados em lote!`);
        closeAddTopicModal();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(onSubmit)();
        }
        if (e.key === 'Escape') {
            closeAddTopicModal();
        }
    };

    if (!isAddTopicModalOpen || !disciplina) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeAddTopicModal}>
            <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-border flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Adicionar Tópicos</h2>
                        <p className="text-sm text-primary">{disciplina.nome}</p>
                    </div>
                    <button onClick={closeAddTopicModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                </div>

                <div className="p-5">
                    <div className="flex justify-between items-center mb-4">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                            <input type="checkbox" checked={isModoContinuo} onChange={(e) => setIsModoContinuo(e.target.checked)} className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary"/>
                            <ZapIcon className="w-4 h-4 text-primary"/> Modo Contínuo
                        </label>
                        <button onClick={() => setIsBatchMode(!isBatchMode)} className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-muted/50 text-muted-foreground text-sm font-medium hover:bg-muted">
                            <UploadIcon className="w-4 h-4"/> {isBatchMode ? 'Modo Individual' : 'Inserir em Lote'}
                        </button>
                    </div>
                    
                    {isBatchMode ? (
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-muted-foreground">Cole os tópicos abaixo (um por linha):</label>
                             <textarea 
                                value={batchTopics}
                                onChange={(e) => setBatchTopics(e.target.value)}
                                rows={8}
                                placeholder="Tópico 1&#10;Tópico 2&#10;Tópico 3"
                                className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary resize-y"
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label htmlFor="topic-title" className="block text-sm font-medium text-muted-foreground">Novo Tópico</label>
                            <textarea 
                                id="topic-title"
                                {...register('titulo', { required: true })}
                                onKeyDown={handleKeyDown}
                                placeholder="Digite o título do tópico"
                                className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                                rows={2}
                            />
                             <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                                <li>• <span className="font-semibold">Enter</span>: Adicionar e continuar</li>
                                <li>• <span className="font-semibold">Shift + Enter</span>: Quebra de linha</li>
                                <li>• <span className="font-semibold">Esc</span>: Fechar modal</li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-3">
                    <button type="button" onClick={closeAddTopicModal} className="h-10 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
                        <XIcon className="w-4 h-4 inline-block mr-1.5" /> Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={isBatchMode ? handleBatchSubmit : handleSubmit(onSubmit)} 
                        className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
                    >
                        <CheckIcon className="w-4 h-4" /> Adicionar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdicionarTopicoModal;
