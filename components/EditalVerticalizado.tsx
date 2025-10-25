import React, { useState } from 'react';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { Disciplina, Topico } from '../types';
import { 
    ChevronDownIcon, 
    CheckCircle2Icon, 
    FilePlus2Icon, 
    Trash2Icon, 
    EditIcon, 
    LandmarkIcon, 
    ClockIcon, 
    RefreshCwIcon, 
    CheckIcon,
    SaveIcon,
} from './icons';
import { scheduleAutoRevisoes } from '../hooks/useAutoRevisoes';
import { toast } from './Sonner';

const TopicoItem: React.FC<{
    topico: Topico;
    disciplinaId: string;
}> = ({ topico, disciplinaId }) => {
    const { updateTopico, updateDisciplina, disciplinas } = useDisciplinasStore();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(topico.titulo);

    const handleToggleStatus = async () => {
        if (isEditing) return;
        const novoStatusConcluido = !topico.concluido;
        await updateTopico(disciplinaId, topico.id, { concluido: novoStatusConcluido });
        if (novoStatusConcluido) {
            try {
                const disciplina = disciplinas.find(d => d.id === disciplinaId);
                if (!disciplina) return;
                await scheduleAutoRevisoes({
                    disciplinaId: disciplina.id,
                    disciplinaNome: disciplina.nome,
                    topicoId: topico.id,
                    topicoNome: topico.titulo,
                });
                toast.success(`Revisões automáticas agendadas para "${topico.titulo}"!`);
            } catch (error) {
                console.error("Failed to schedule revisions:", error);
                toast.error("Falha ao agendar revisões automáticas.");
            }
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
        const disciplina = disciplinas.find(d => d.id === disciplinaId);
        if(!disciplina) return;
        if(window.confirm(`Tem certeza que deseja remover o tópico "${topico.titulo}"?`)){
            const topicosAtualizados = disciplina.topicos.filter(t => t.id !== topico.id);
            updateDisciplina(disciplinaId, { topicos: topicosAtualizados });
            toast.success("Tópico removido.");
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
    onDelete: () => void;
}> = ({ disciplina, onEdit, onAddTopic, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    
    return (
        <div className="bg-card rounded-xl border border-border">
            <header className="flex items-center p-4">
                <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-lg text-foreground">{disciplina.nome}</h3>
                    <p className="text-xs text-muted-foreground">Atualizado em 18/10</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-secondary font-bold">
                        <CheckCircle2Icon className="w-5 h-5" />
                        <span>{disciplina.progresso.toFixed(0)}%</span>
                    </div>
                    <button className="p-2 rounded-full hover:bg-muted text-muted-foreground"><RefreshCwIcon className="w-4 h-4"/></button>
                    <button className="p-2 rounded-full hover:bg-muted text-muted-foreground"><ClockIcon className="w-4 h-4"/></button>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-full hover:bg-muted text-muted-foreground">
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </header>
            {isExpanded && (
                <div className="border-t border-border">
                    <div className="divide-y divide-border">
                        {disciplina.topicos.length > 0 ? disciplina.topicos.map(topico => (
                            <TopicoItem key={topico.id} topico={topico} disciplinaId={disciplina.id} />
                        )) : (
                            <div className="text-center py-8">
                               <p className="text-sm text-muted-foreground">Nenhum tópico adicionado.</p>
                               <button onClick={onAddTopic} className="mt-2 text-sm font-semibold text-primary hover:underline">Adicionar primeiro tópico</button>
                            </div>
                        )}
                    </div>
                    <div className="p-2 flex items-center justify-end gap-1 border-t border-border bg-muted/30">
                        <button onClick={onAddTopic} className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-primary" title="Adicionar Tópico"><FilePlus2Icon className="w-4 h-4" /></button>
                        <button onClick={onEdit} className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-primary" title="Editar Disciplina"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={onDelete} className="p-2 rounded-md hover:bg-background text-muted-foreground hover:text-red-500" title="Excluir Disciplina"><Trash2Icon className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
        </div>
    );
};

interface EditalVerticalizadoProps {
    onEditDisciplina: (disciplina: Disciplina) => void;
    onAddTopic: (disciplinaId: string) => void;
    onDeleteDisciplina: (id: string) => void;
}

const EditalVerticalizado: React.FC<EditalVerticalizadoProps> = ({ onEditDisciplina, onAddTopic, onDeleteDisciplina }) => {
    const disciplinas = useDisciplinasStore((state) => state.disciplinas);

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
                    onDelete={() => onDeleteDisciplina(disciplina.id)}
                />
            ))}
        </div>
    );
};

export default EditalVerticalizado;