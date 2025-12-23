import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, TrophyIcon, LayersIcon, CheckIcon, BookOpenIcon, BrainIcon } from './icons';
import { Disciplina } from '../types';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import PlanBadge from './PlanBadge';

interface QuizConfigModalProps {
    onClose: () => void;
    onStart: (config: QuizConfig) => void;
    disciplinas: Disciplina[];
}

export interface QuizConfig {
    questionCount: number;
    disciplinaId: string | null; // null = todas as disciplinas
    topicos: Array<{ id: string; titulo: string }>; // Tópicos selecionados com títulos (vazio = todos os tópicos da disciplina)
    mode: 'standard' | 'true_false';
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
}

export const QuizConfigModal: React.FC<QuizConfigModalProps> = ({
    onClose,
    onStart,
    disciplinas
}) => {
    const [questionCount, setQuestionCount] = useState<number>(10);
    const [selectedDisciplina, setSelectedDisciplina] = useState<string | null>(null);
    const [selectedTopicos, setSelectedTopicos] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<'standard' | 'true_false'>('standard');
    const [difficulty, setDifficulty] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');

    // Dados de assinatura
    const {
        planType,
        quizQuestionsGeneratedToday,
        getMaxQuizQuestionsPerDay,
        canGenerateQuiz,
        hasActiveSubscription,
        isTrialActive
    } = useSubscriptionStore();

    const maxQuestionsPerDay = getMaxQuizQuestionsPerDay();
    const questionsRemaining = Math.max(0, maxQuestionsPerDay - quizQuestionsGeneratedToday);
    const canGenerate = canGenerateQuiz(questionCount);
    const isActive = hasActiveSubscription() || isTrialActive();

    const questionOptions = [5, 10, 15, 20];

    // Função para ordenar tópicos hierarquicamente (1, 1.1, 1.2, 2, 2.1, 3, etc.)
    const sortTopicsHierarchically = (topicos: any[]) => {
        return [...topicos].sort((a, b) => {
            // Se não houver título, manter ordem original
            if (!a.titulo || !b.titulo) return 0;

            // Extrair números do início do título (ex: "1.2.3" -> [1, 2, 3])
            const extractNumbers = (str: string): number[] => {
                const match = str.match(/^([\d.]+)/);
                if (!match) return [];
                return match[1].split('.').map(n => parseInt(n) || 0);
            };

            const numsA = extractNumbers(a.titulo);
            const numsB = extractNumbers(b.titulo);

            // Comparar cada nível hierárquico
            const maxLen = Math.max(numsA.length, numsB.length);
            for (let i = 0; i < maxLen; i++) {
                const numA = numsA[i] || 0;
                const numB = numsB[i] || 0;
                if (numA !== numB) return numA - numB;
            }

            return 0;
        });
    };

    // Obter a disciplina selecionada com tópicos ordenados
    const disciplinaSelecionada = useMemo(() => {
        const disciplina = selectedDisciplina ? disciplinas.find(d => d.id === selectedDisciplina) : null;
        if (!disciplina) return null;

        return {
            ...disciplina,
            topicos: sortTopicsHierarchically(disciplina.topicos)
        };
    }, [selectedDisciplina, disciplinas]);

    const handleDisciplinaChange = (disciplinaId: string | null) => {
        setSelectedDisciplina(disciplinaId);
        setSelectedTopicos(new Set()); // Limpar seleção de tópicos ao mudar disciplina
    };

    const handleTopicoToggle = (topicoId: string) => {
        const newSelected = new Set(selectedTopicos);
        if (newSelected.has(topicoId)) {
            newSelected.delete(topicoId);
        } else {
            newSelected.add(topicoId);
        }
        setSelectedTopicos(newSelected);
    };

    const handleSelectAllTopicos = () => {
        if (!disciplinaSelecionada) return;
        if (selectedTopicos.size === disciplinaSelecionada.topicos.length) {
            setSelectedTopicos(new Set());
        } else {
            setSelectedTopicos(new Set(disciplinaSelecionada.topicos.map(t => t.id)));
        }
    };

    const handleStart = () => {
        // Construir array de tópicos com id e titulo
        const topicosCompletos = disciplinaSelecionada
            ? disciplinaSelecionada.topicos
                .filter(t => selectedTopicos.has(t.id))
                .map(t => ({ id: t.id, titulo: t.titulo }))
            : [];

        onStart({
            questionCount,
            disciplinaId: selectedDisciplina,
            topicos: topicosCompletos,
            mode,
            difficulty
        });
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-card rounded-2xl border border-border max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <TrophyIcon className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Questões com IA</h2>
                                <p className="text-sm text-muted-foreground">Configure suas questões personalizadas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <PlanBadge />
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-muted rounded-full transition-colors"
                            >
                                <XIcon className="w-5 h-5 text-muted-foreground" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Modo de Quiz e Dificuldade */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <section>
                                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <BrainIcon className="w-4 h-4 text-primary" />
                                    Modo de Estudo
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setMode('standard')}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${mode === 'standard'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${mode === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <LayersIcon className="w-4 h-4" />
                                            </div>
                                            {mode === 'standard' && <CheckIcon className="w-4 h-4 text-primary" />}
                                        </div>
                                        <div className="font-semibold text-sm text-foreground">Múltipla Escolha</div>
                                    </button>

                                    <button
                                        onClick={() => setMode('true_false')}
                                        className={`relative p-3 rounded-xl border-2 text-left transition-all hover:shadow-md ${mode === 'true_false'
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border bg-card hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${mode === 'true_false' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                                <CheckIcon className="w-4 h-4" />
                                            </div>
                                            {mode === 'true_false' && <CheckIcon className="w-4 h-4 text-primary" />}
                                        </div>
                                        <div className="font-semibold text-sm text-foreground">Certo / Errado</div>
                                    </button>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                    <TrophyIcon className="w-4 h-4 text-primary" />
                                    Nível de Dificuldade
                                </h3>
                                <div className="flex p-1 bg-muted rounded-lg">
                                    {(['Fácil', 'Médio', 'Difícil'] as const).map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setDifficulty(level)}
                                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${difficulty === level
                                                ? 'bg-background text-foreground shadow-sm'
                                                : 'text-muted-foreground hover:text-foreground'
                                                }`}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Configurações Gerais */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Coluna Esquerda: Quantidade e Matéria */}
                            <div className="space-y-8">
                                {/* Número de Questões */}
                                <section>
                                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <LayersIcon className="w-4 h-4 text-primary" />
                                        Quantidade de Questões
                                    </h3>
                                    <div className="flex p-1 bg-muted rounded-lg">
                                        {questionOptions.map((count) => (
                                            <button
                                                key={count}
                                                onClick={() => setQuestionCount(count)}
                                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${questionCount === count
                                                    ? 'bg-background text-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {count}
                                            </button>
                                        ))}
                                    </div>
                                    {maxQuestionsPerDay > 0 && (
                                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                            {questionsRemaining} de {maxQuestionsPerDay} disponíveis hoje
                                        </p>
                                    )}
                                </section>

                                {/* Filtro por Disciplina */}
                                <section className="flex-1 flex flex-col min-h-0">
                                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <BookOpenIcon className="w-4 h-4 text-primary" />
                                        Disciplina
                                    </h3>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                        {disciplinas.map((disciplina) => (
                                            <button
                                                key={disciplina.id}
                                                onClick={() => handleDisciplinaChange(disciplina.id)}
                                                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 border ${selectedDisciplina === disciplina.id
                                                    ? 'bg-primary/10 border-primary/30 text-primary'
                                                    : 'bg-card border-border text-foreground hover:border-primary/30 hover:bg-muted/30'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${selectedDisciplina === disciplina.id ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                                <span className="font-medium text-sm truncate">{disciplina.nome}</span>
                                            </button>
                                        ))}
                                        {disciplinas.length === 0 && (
                                            <div className="text-center p-4 border border-dashed border-border rounded-xl">
                                                <p className="text-sm text-muted-foreground">Nenhuma disciplina cadastrada.</p>
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* Coluna Direita: Tópicos */}
                            <div className="flex flex-col h-full min-h-[300px]">
                                <section className="flex-1 flex flex-col h-full bg-muted/10 rounded-xl border border-border overflow-hidden">
                                    <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            Tópicos Específicos
                                        </h3>
                                        {disciplinaSelecionada && (
                                            <button
                                                onClick={handleSelectAllTopicos}
                                                className="text-xs text-primary hover:text-primary/80 font-medium px-2 py-1 hover:bg-primary/10 rounded transition-colors"
                                            >
                                                {selectedTopicos.size === disciplinaSelecionada.topicos.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                        {!disciplinaSelecionada ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                                <BookOpenIcon className="w-8 h-8 mb-2 opacity-20" />
                                                <p className="text-sm">Selecione uma disciplina para ver os tópicos</p>
                                            </div>
                                        ) : disciplinaSelecionada.topicos.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                                                <p className="text-sm">Nenhum tópico encontrado para esta disciplina</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                {disciplinaSelecionada.topicos.map((topico) => {
                                                    const isSelected = selectedTopicos.has(topico.id);
                                                    return (
                                                        <button
                                                            key={topico.id}
                                                            onClick={() => handleTopicoToggle(topico.id)}
                                                            className={`w-full p-2.5 rounded-lg text-left transition-all flex items-start gap-3 group ${isSelected
                                                                ? 'bg-primary/10 text-foreground'
                                                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                                }`}
                                                        >
                                                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                                ? 'bg-primary border-primary'
                                                                : 'border-muted-foreground/30 group-hover:border-primary/50'
                                                                }`}>
                                                                {isSelected && (
                                                                    <CheckIcon className="w-2.5 h-2.5 text-primary-foreground" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-medium leading-relaxed">
                                                                {topico.titulo}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-border bg-muted/20">
                        {/* Mensagens de Erro/Aviso */}
                        {!canGenerate && maxQuestionsPerDay === 0 && (
                            <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3">
                                <span className="text-xl">👑</span>
                                <div>
                                    <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">
                                        Recurso Premium
                                    </p>
                                    <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                                        Faça upgrade para gerar questões ilimitadas com IA.
                                    </p>
                                </div>
                            </div>
                        )}


                        {!canGenerate && maxQuestionsPerDay > 0 && (() => {
                            // Calcular tempo até meia-noite
                            const now = new Date();
                            const midnight = new Date(now);
                            midnight.setHours(24, 0, 0, 0);
                            const diffMs = midnight.getTime() - now.getTime();
                            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                            const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            const timeUntilReset = diffHours > 0
                                ? `${diffHours}h ${diffMinutes}min`
                                : `${diffMinutes} minutos`;

                            return (
                                <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-3">
                                    <span className="text-xl">⏳</span>
                                    <div>
                                        <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                                            Limite Diário Atingido
                                        </p>
                                        <p className="text-xs text-orange-600/80 dark:text-orange-400/80">
                                            Você atingiu o limite de {maxQuestionsPerDay} questões hoje.
                                        </p>
                                        <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1">
                                            🕐 Você poderá gerar novamente em <span className="font-semibold">{timeUntilReset}</span>
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!canGenerate && maxQuestionsPerDay === 0) {
                                        window.location.href = '/pagamento';
                                        return;
                                    }
                                    handleStart();
                                }}
                                disabled={!selectedDisciplina || (!canGenerate && maxQuestionsPerDay > 0)}
                                className="flex-1 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
                            >
                                {!canGenerate && maxQuestionsPerDay === 0 ? 'Fazer Upgrade Agora' : 'Iniciar Questões'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

