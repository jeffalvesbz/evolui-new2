import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ClockIcon, CheckCircle2Icon, AlertCircleIcon, CalendarDaysIcon, BookCopyIcon, LayersIcon, EditIcon, ZapIcon, Trash2Icon, RefreshCwIcon, ChevronDownIcon } from './icons';
import { Revisao } from '../types';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { formatDistanceToNow } from 'date-fns';
// FIX: Changed date-fns/locale import to a subpath import to resolve module export error.
import { ptBR } from 'date-fns/locale';

interface RevisaoCardProps {
    revisao: Revisao;
    // FIX: Widened the type of `resultado` to include 'adiou', matching the function signature from the `useRevisoes` hook and resolving the assignment error.
    onConcluir: (id: string, resultado: 'acertou' | 'errou' | 'adiou', novaDificuldade?: 'facil' | 'medio' | 'dificil') => void;
    onReagendar: (id: string, dias: number) => void;
    onRemover: (id: string) => void;
}

const getStatusInfo = (status: Revisao['status']) => {
    switch (status) {
        case 'pendente': return { Icon: ClockIcon, color: 'text-primary', label: 'Pendente' };
        case 'atrasada': return { Icon: AlertCircleIcon, color: 'text-red-500', label: 'Atrasada' };
        case 'concluida': return { Icon: CheckCircle2Icon, color: 'text-secondary', label: 'Concluída' };
        default: return { Icon: ClockIcon, color: 'text-muted-foreground', label: 'Status' };
    }
};

const getOrigemInfo = (origem: Revisao['origem']) => {
    switch (origem) {
        case 'flashcard': return { Icon: LayersIcon, label: 'Flashcard' };
        case 'erro': return { Icon: BookCopyIcon, label: 'Caderno de Erros' };
        case 'manual': return { Icon: EditIcon, label: 'Manual' };
        case 'teorica': return { Icon: BookCopyIcon, label: 'Teórica' };
        default: return { Icon: ZapIcon, label: 'Origem' };
    }
};

const getDificuldadeInfo = (dificuldade: Revisao['dificuldade']) => {
    switch (dificuldade) {
        case 'fácil': return { label: 'Fácil', color: 'bg-green-500/10 text-green-600 border-green-500/10' };
        case 'médio': return { label: 'Médio', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/10' };
        case 'difícil': return { label: 'Difícil', color: 'bg-red-500/10 text-red-600 border-red-500/10' };
        default: return { label: 'Médio', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/10' };
    }
};

// Helper function to extract topic code (e.g., "2.1" from "2.1 - Title")
const extractTopicCode = (titulo: string): string => {
    const match = titulo.match(/^(\d+\.?\d*)\s*[-–]\s*/);
    return match ? match[1] : '';
};

// Helper function to create short title (e.g., "2.1 – Funções da Administração")
const getShortTitle = (titulo: string): string => {
    // Extract code and main title, remove detailed description after colon
    const withoutDetails = titulo.replace(/:\s*.+$/, '');
    // Ensure proper formatting with en-dash
    return withoutDetails.replace(/^(\d+\.?\d*)\s*[-–]\s*/, '$1 – ').trim();
};

// Helper function to get topic summary (short description without code)
const getTopicSummary = (titulo: string): string => {
    // Remove code prefix
    const withoutCode = titulo.replace(/^(\d+\.?\d*)\s*[-–]\s*/, '');
    // Remove main title before colon, keep only description
    const description = withoutCode.includes(':')
        ? withoutCode.split(':')[1].trim()
        : withoutCode;
    // Limit to 8 words
    const words = description.split(/\s+/);
    return words.length > 8
        ? words.slice(0, 8).join(' ') + '...'
        : description;
};

const RevisaoCard: React.FC<RevisaoCardProps> = ({ revisao, onConcluir, onReagendar, onRemover }) => {
    const findTopicById = useDisciplinasStore(state => state.findTopicById);
    const [isReagendarMenuOpen, setIsReagendarMenuOpen] = useState(false);
    const [isConcluirMenuOpen, setIsConcluirMenuOpen] = useState(false);

    const { topico, disciplina } = useMemo(() => {
        const result = findTopicById(revisao.topico_id);
        return {
            topico: result?.topico,
            disciplina: result?.disciplina
        };
    }, [findTopicById, revisao.topico_id]);

    const { Icon: StatusIcon, color: statusColor, label: statusLabel } = getStatusInfo(revisao.status);
    const { Icon: OrigemIcon, label: origemLabel } = getOrigemInfo(revisao.origem);
    const { label: dificuldadeLabel, color: dificuldadeColor } = getDificuldadeInfo(revisao.dificuldade);

    const dataFormatada = useMemo(() => {
        // FIX: Changed locale import to a named import.
        return formatDistanceToNow(new Date(revisao.data_prevista), { addSuffix: true, locale: ptBR });
    }, [revisao.data_prevista]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
            className="bg-card rounded-xl border border-border shadow-md transition-all hover:border-primary/70"
        >
            <div className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-2">
                    {/* TÍTULO */}
                    <p className="text-lg font-bold text-foreground leading-snug">
                        {topico?.titulo ? getShortTitle(topico.titulo) : revisao.conteudo}
                    </p>
                    {/* SUBTÍTULO */}
                    <div className="flex items-center gap-2 flex-wrap text-sm">
                        <span className="font-medium text-primary">{disciplina?.nome || 'Disciplina'}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                            {topico?.titulo ? getTopicSummary(topico.titulo) : 'Tópico'}
                        </span>
                        <span className="text-muted-foreground">•</span>
                        <span className={`font-medium px-2 py-0.5 rounded border text-xs ${dificuldadeColor}`}>{dificuldadeLabel}</span>
                    </div>
                </div>

                {/* METADADOS */}
                <div className="flex flex-col sm:items-end gap-3 text-xs sm:min-w-[160px]">
                    <div className={`flex items-center gap-1.5 ${statusColor}`}>
                        <span>⏳</span>
                        <span className="font-semibold">{statusLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>📅</span>
                        <span>{dataFormatada}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span>📚</span>
                        <span>{origemLabel}</span>
                    </div>
                </div>
            </div>

            <div className="border-t border-border p-2.5 flex justify-end items-center gap-2">
                {revisao.status !== 'concluida' && (
                    <>
                        <div className="relative">
                            <button
                                onClick={() => setIsReagendarMenuOpen(!isReagendarMenuOpen)}
                                onBlur={() => setTimeout(() => setIsReagendarMenuOpen(false), 200)}
                                className="h-8 px-3 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1.5"
                            >
                                <RefreshCwIcon className="w-3.5 h-3.5" /> Reagendar
                            </button>
                            {isReagendarMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-background border border-border rounded-md shadow-lg z-10 p-1">
                                    {[1, 3, 7, 15].map(dias => (
                                        <button
                                            key={dias}
                                            onClick={() => { onReagendar(revisao.id, dias); setIsReagendarMenuOpen(false); }}
                                            className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted"
                                        >
                                            +{dias} dia(s)
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsConcluirMenuOpen(!isConcluirMenuOpen)}
                                onBlur={() => setTimeout(() => setIsConcluirMenuOpen(false), 200)}
                                className="h-8 px-4 text-xs font-bold rounded-md bg-secondary text-black hover:bg-secondary/90 flex items-center gap-1.5"
                            >
                                <CheckCircle2Icon className="w-3.5 h-3.5" /> Concluir <ChevronDownIcon className="w-3 h-3" />
                            </button>
                            {isConcluirMenuOpen && (
                                <div className="absolute bottom-full right-0 mb-2 w-40 bg-background border border-border rounded-md shadow-lg z-10 p-1">
                                    <button
                                        onClick={() => { onConcluir(revisao.id, 'acertou'); setIsConcluirMenuOpen(false); }}
                                        className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted text-green-600 font-medium"
                                    >
                                        ✓ Revisei
                                    </button>
                                    <button
                                        onClick={() => { onConcluir(revisao.id, 'errou'); setIsConcluirMenuOpen(false); }}
                                        className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted text-red-400 font-medium"
                                    >
                                        ✗ Preciso revisar mais
                                    </button>
                                    <div className="border-t border-border my-1"></div>
                                    <button
                                        onClick={() => { onConcluir(revisao.id, 'adiou'); setIsConcluirMenuOpen(false); }}
                                        className="w-full text-left text-sm px-3 py-1.5 rounded hover:bg-muted text-muted-foreground"
                                    >
                                        ⏸ Adiar
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
                <button
                    onClick={async () => {
                        console.log('[RevisaoCard] Clicou em excluir, revisao.id:', revisao.id);
                        const confirmar = window.confirm(
                            revisao.status === 'concluida'
                                ? 'Tem certeza que deseja excluir esta revisão concluída?'
                                : 'Tem certeza que deseja excluir esta revisão?'
                        );
                        console.log('[RevisaoCard] Resultado do confirm:', confirmar);
                        if (confirmar) {
                            try {
                                console.log('[RevisaoCard] Chamando onRemover com id:', revisao.id);
                                await onRemover(revisao.id);
                                console.log('[RevisaoCard] Revisão excluída com sucesso');
                            } catch (error) {
                                console.error('[RevisaoCard] Erro ao excluir revisão:', error);
                            }
                        }
                    }}
                    className="h-8 w-8 text-xs font-medium rounded-md bg-muted text-muted-foreground hover:bg-muted/80 hover:text-red-500 flex items-center justify-center"
                    title="Excluir revisão"
                >
                    <Trash2Icon className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
};

export default RevisaoCard;