import React, { useState, useMemo } from 'react';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { Disciplina, Topico } from '../types';
import {
    ChevronDownIcon,
    Trash2Icon,
    EditIcon,
    LandmarkIcon,
    CheckIcon,
    SaveIcon,
    UploadIcon,
    PlusCircleIcon,
} from './icons';
import { useModalStore } from '../stores/useModalStore';
import { toast } from './Sonner';
import { Progress } from '../lib/dashboardMocks';
import { sortTopicosPorNumero } from '../utils/sortTopicos';

const TopicoItem: React.FC<{
    topico: Topico;
    disciplinaId: string;
}> = ({ topico, disciplinaId }) => {
    const { updateTopico, removeTopico, disciplinas } = useDisciplinasStore();
    const openConfirmarAgendarRevisoesModal = useModalStore((state) => state.openConfirmarAgendarRevisoesModal);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(topico.titulo);

    const handleToggleStatus = async () => {
        if (isEditing) return;
        const novoStatusConcluido = !topico.concluido;
        await updateTopico(disciplinaId, topico.id, { concluido: novoStatusConcluido });
        if (novoStatusConcluido) {
            const disciplina = disciplinas.find(d => d.id === disciplinaId);
            if (!disciplina) return;
            // Abre modal de confirmação
            openConfirmarAgendarRevisoesModal({
                disciplinaId: disciplina.id,
                disciplinaNome: disciplina.nome,
                topicoId: topico.id,
                topicoNome: topico.titulo,
            });
        }
    };

    const handleSaveEdit = async () => {
        if (editValue.trim() && editValue.trim() !== topico.titulo) {
            await updateTopico(disciplinaId, topico.id, { titulo: editValue.trim() });
            toast.success("Tópico atualizado.");
        }
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Tem certeza que deseja remover o tópico "${topico.titulo}"?`)) {
            removeTopico(disciplinaId, topico.id)
                .catch(() => { }); // Error is already toasted in the store
        }
    };

    const statusIcon = topico.concluido ? (
        <div className="w-5 h-5 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center cursor-pointer" title="Marcar como pendente">
            <CheckIcon className="w-3.5 h-3.5 text-black" />
        </div>
    ) : (
        <div className="w-5 h-5 flex-shrink-0 rounded-full border-2 border-muted flex items-center justify-center cursor-pointer" title="Marcar como concluído">
            <div className="w-1.5 h-1.5 bg-muted rounded-full"></div>
        </div>
    );

    return (
        <div className="flex items-center gap-3 py-3 px-4 transition-colors hover:bg-muted/50 group">
            <div onClick={handleToggleStatus} className="cursor-pointer">
                {statusIcon}
            </div>
            <div className="flex-1" onClick={() => !isEditing && handleToggleStatus()}>
                {isEditing ? (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSaveEdit}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                        autoFocus
                        className="w-full bg-background border-b-2 border-primary text-sm font-medium text-foreground p-0 focus:outline-none"
                    />
                ) : (
                    <>
                        <p className={`text-sm font-medium ${topico.concluido ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {topico.titulo}
                        </p>
                        <p className={`text-xs ${topico.concluido ? 'text-secondary' : 'text-muted-foreground'}`}>
                            {topico.concluido ? 'Concluído' : 'Pendente'}
                        </p>
                    </>
                )}
            </div>
            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-md text-muted-foreground hover:text-primary" title="Editar Tópico"><EditIcon className="w-4 h-4" /></button>
                <button onClick={handleDelete} className="p-2 rounded-md text-muted-foreground hover:text-red-500" title="Excluir Tópico"><Trash2Icon className="w-4 h-4" /></button>
            </div>
        </div>
    );
};


const DisciplinaCard: React.FC<{
    disciplina: Disciplina;
    onEdit: () => void;
    onAddTopic: () => void;
    onAddTopicBatch: () => void;
    onDelete: () => void;
}> = ({ disciplina, onEdit, onAddTopic, onAddTopicBatch, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // Ordena os tópicos numericamente
    const topicosOrdenados = useMemo(() => {
        return sortTopicosPorNumero(disciplina.topicos);
    }, [disciplina.topicos]);

    return (
        <div className="bg-card rounded-xl border border-border">
            <header className={`p-4 transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center justify-between flex-1">
                        <h3
                            className="font-bold text-lg text-foreground cursor-pointer"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {disciplina.nome}
                        </h3>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="p-2 rounded-full hover:bg-muted text-muted-foreground sm:hidden"
                        >
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                    <div className="flex items-center flex-wrap justify-end gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddTopic(); }}
                            className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-primary transition-colors"
                            title="Adicionar Tópico"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onAddTopicBatch(); }}
                            className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-primary transition-colors"
                            title="Adicionar Tópicos em Lote"
                        >
                            <UploadIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(); }}
                            className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-primary transition-colors"
                            title="Editar Disciplina"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(); }}
                            className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-red-500 transition-colors"
                            title="Excluir Disciplina"
                        >
                            <Trash2Icon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                            className="hidden sm:flex p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
                        >
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            </header>
            <div className="px-4 pb-4">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <Progress value={disciplina.progresso} className="h-2 flex-1" />
                    <span className="text-sm font-semibold text-foreground w-12 text-right">{disciplina.progresso.toFixed(0)}%</span>
                </div>
            </div>
            {isExpanded && (
                <div className="border-t border-border">
                    <div className="divide-y divide-border">
                        {topicosOrdenados.length > 0 ? topicosOrdenados.map(topico => (
                            <TopicoItem key={topico.id} topico={topico} disciplinaId={disciplina.id} />
                        )) : (
                            <div className="text-center py-8">
                                <p className="text-sm text-muted-foreground">Nenhum tópico adicionado.</p>
                                <div className="mt-3 flex items-center justify-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onAddTopic(); }} className="text-sm font-semibold text-primary hover:underline">Adicionar tópico</button>
                                    <span className="text-muted-foreground">ou</span>
                                    <button onClick={(e) => { e.stopPropagation(); onAddTopicBatch(); }} className="text-sm font-semibold text-primary hover:underline">Adicionar em lote</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface EditalVerticalizadoProps {
    onEditDisciplina: (disciplina: Disciplina) => void;
    onAddTopic: (disciplinaId: string) => void;
    onAddTopicBatch: (disciplinaId: string) => void;
    onDeleteDisciplina: (id: string) => void;
}

const EditalVerticalizado: React.FC<EditalVerticalizadoProps> = ({ onEditDisciplina, onAddTopic, onAddTopicBatch, onDeleteDisciplina }) => {
    // Filtrar disciplinas que são apenas de decks
    const disciplinas = useDisciplinasStore((state) => state.disciplinas).filter(d => !d.is_deck_only);

    if (disciplinas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-96 text-center bg-card rounded-xl border border-border">
                <LandmarkIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg text-foreground">Nenhuma disciplina cadastrada</h3>
                <p className="max-w-xs mx-auto text-muted-foreground mt-1">Adicione sua primeira disciplina no painel de gerenciamento.</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {disciplinas.map(disciplina => (
                <DisciplinaCard
                    key={disciplina.id}
                    disciplina={disciplina}
                    onEdit={() => onEditDisciplina(disciplina)}
                    onAddTopic={() => onAddTopic(disciplina.id)}
                    onAddTopicBatch={() => onAddTopicBatch(disciplina.id)}
                    onDelete={() => onDeleteDisciplina(disciplina.id)}
                />
            ))}
        </div>
    );
};

export default EditalVerticalizado;