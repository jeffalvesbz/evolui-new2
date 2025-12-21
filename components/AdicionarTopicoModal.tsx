import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { toast } from './Sonner';
import { XIcon, CheckIcon, ZapIcon, UploadIcon } from './icons';
import { Disciplina, Topico } from '../types';
import { sortTopicosPorNumero } from '../utils/sortTopicos';
import { Modal } from './ui/BaseModal';

interface FormData {
    titulo: string;
}

const AdicionarTopicoModal: React.FC = () => {
    const { isAddTopicModalOpen, addTopicTargetDisciplinaId, shouldOpenInBatchMode, closeAddTopicModal } = useModalStore();
    const { disciplinas, addTopico } = useDisciplinasStore();

    const [isModoContinuo, setIsModoContinuo] = useState(true);
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [batchTopics, setBatchTopics] = useState("");
    const batchTextareaRef = useRef<HTMLTextAreaElement>(null);

    const { register, handleSubmit, reset, setFocus, getValues } = useForm<FormData>();

    const disciplina = disciplinas.find(d => d.id === addTopicTargetDisciplinaId);

    useEffect(() => {
        if (isAddTopicModalOpen) {
            reset({ titulo: '' });
            setIsBatchMode(shouldOpenInBatchMode);
            setBatchTopics("");
            if (!shouldOpenInBatchMode) {
                setTimeout(() => setFocus('titulo'), 100);
            } else {
                // Focus on batch textarea when opened in batch mode
                setTimeout(() => {
                    batchTextareaRef.current?.focus();
                }, 100);
            }
        }
    }, [isAddTopicModalOpen, shouldOpenInBatchMode, reset, setFocus]);

    const handleAddSingleTopic = useCallback(async (titulo: string) => {
        if (!disciplina || !titulo.trim()) return;

        const novoTopicoData: Omit<Topico, 'id'> = {
            titulo: titulo.trim(),
            concluido: false,
            nivelDificuldade: 'desconhecido',
            ultimaRevisao: null,
            proximaRevisao: null,
        };

        await addTopico(disciplina.id, novoTopicoData);

    }, [disciplina, addTopico]);

    const onSubmit: SubmitHandler<FormData> = async (data) => {
        await handleAddSingleTopic(data.titulo);
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
        if (titulos.length === 0) return;

        // Cria objetos temporários para ordenação
        const topicosTemp = titulos.map(titulo => ({
            titulo: titulo.trim(),
            concluido: false,
            nivelDificuldade: 'desconhecido' as const,
            ultimaRevisao: null,
            proximaRevisao: null,
        }));

        // Ordena os tópicos antes de adicionar
        const topicosOrdenados = sortTopicosPorNumero(topicosTemp);

        // Adiciona os tópicos na ordem correta
        for (const topicoData of topicosOrdenados) {
            await addTopico(disciplina.id, topicoData);
        }

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

    if (!disciplina) return null;

    return (
        <Modal
            isOpen={isAddTopicModalOpen}
            onClose={closeAddTopicModal}
            size="lg"
        >
            <Modal.Header onClose={closeAddTopicModal}>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Adicionar Tópicos</h2>
                    <p className="text-sm text-primary">{disciplina.nome}</p>
                </div>
            </Modal.Header>

            <Modal.Body className="space-y-4 overflow-x-hidden">
                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                        <input
                            type="checkbox"
                            checked={isModoContinuo}
                            onChange={(e) => setIsModoContinuo(e.target.checked)}
                            className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary"
                        />
                        <ZapIcon className="w-4 h-4 text-primary" /> Modo Contínuo
                    </label>
                    <button
                        onClick={() => setIsBatchMode(!isBatchMode)}
                        className="px-3 py-1.5 flex items-center gap-2 rounded-md bg-muted/50 text-muted-foreground text-sm font-medium hover:bg-muted"
                    >
                        <UploadIcon className="w-4 h-4" /> {isBatchMode ? 'Modo Individual' : 'Inserir em Lote'}
                    </button>
                </div>

                {isBatchMode ? (
                    <div className="space-y-3">
                        <label className="block text-sm font-medium text-muted-foreground">Cole os tópicos abaixo (um por linha):</label>
                        <textarea
                            ref={batchTextareaRef}
                            value={batchTopics}
                            onChange={(e) => setBatchTopics(e.target.value)}
                            rows={8}
                            placeholder="Tópico 1&#10;Tópico 2&#10;Tópico 3"
                            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary resize-y"
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
                            className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary resize-y"
                            rows={2}
                        />
                        <ul className="text-xs text-muted-foreground space-y-1 pl-1">
                            <li>• <span className="font-semibold">Enter</span>: Adicionar e continuar</li>
                            <li>• <span className="font-semibold">Shift + Enter</span>: Quebra de linha</li>
                            <li>• <span className="font-semibold">Esc</span>: Fechar modal</li>
                        </ul>
                    </div>
                )}
            </Modal.Body>

            <Modal.Footer>
                <button
                    type="button"
                    onClick={closeAddTopicModal}
                    className="h-10 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted flex items-center gap-1.5"
                >
                    <XIcon className="w-4 h-4" /> Cancelar
                </button>
                <button
                    type="button"
                    onClick={isBatchMode ? handleBatchSubmit : handleSubmit(onSubmit)}
                    className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-1.5"
                >
                    <CheckIcon className="w-4 h-4" /> Adicionar
                </button>
            </Modal.Footer>
        </Modal>
    );
};

export default AdicionarTopicoModal;