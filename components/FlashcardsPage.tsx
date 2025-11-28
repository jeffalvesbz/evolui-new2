import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useFlashcardStudyStore, StudySession } from '../stores/useFlashcardStudyStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { Flashcard as FlashcardType, Disciplina, FlashcardStats } from '../types';
import {
    LayersIcon,
    ChevronLeftIcon,
    CheckCircle2Icon,
    EyeIcon,
    LayoutGridIcon,
    BookOpenCheckIcon,
    PlusCircleIcon,
    HistoryIcon,
    EllipsisIcon,
    EditIcon,
    Trash2Icon,
    XIcon,
} from './icons';
import { toast } from './Sonner';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { startOfDay } from 'date-fns';
import { useModalStore } from '../stores/useModalStore';
import { calculateNextReview } from '../services/srsService';
import { getFlashcardStats, saveFlashcardReview } from '../services/flashcardStatsService';
import { FlashcardStatsCard } from './FlashcardStatsCard';
{/* Busca e Filtros Removed as per user request */ }

import { supabase } from '../services/supabaseClient';
import { ImportExportModal } from './ImportExportModal';
import { TrophyIcon, DownloadIcon } from './icons';

// --- Helper & Sub-components ---

const PurpleBackground = () => (
    <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(180deg, #4c1d95, #020617 40%)',
        zIndex: -2
    }} />
);

const FlippableCard: React.FC<{
    flashcard: { pergunta: string; resposta: string };
    isFlipped: boolean;
    onFlip: () => void;
    className?: string;
}> = ({ flashcard, isFlipped, onFlip, className = '' }) => {
    return (
        <div className={`w-full h-full perspective-1000 ${className}`} onClick={onFlip}>
            <motion.div
                className="relative w-full h-full transform-style-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl flex flex-col justify-center items-center p-4 sm:p-6 cursor-pointer shadow-2xl text-foreground border border-border overflow-y-auto">
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">Pergunta</p>
                    <p className="text-center text-base sm:text-xl font-semibold break-words px-2">{flashcard.pergunta}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl flex flex-col justify-center items-center p-4 sm:p-6 cursor-pointer rotate-y-180 shadow-2xl text-foreground border border-border overflow-y-auto">
                    <p className="text-xs sm:text-sm text-primary mb-2 font-bold">Resposta</p>
                    <p className="text-center text-sm sm:text-base font-medium break-words px-2">{flashcard.resposta}</p>
                </div>
            </motion.div>
        </div>
    );
};

const DeckCard: React.FC<{
    title: string;
    cardCount?: number;
    dueCount?: number;
    icon: React.ReactNode;
    onSelect: () => void;
    onDeleteAll?: () => void;
    color: string;
    showDeleteButton?: boolean;
}> = ({ title, cardCount, dueCount, icon, onSelect, onDeleteAll, color, showDeleteButton = false }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleDeleteAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (cardCount !== undefined && confirm(`Tem certeza que deseja excluir todos os ${cardCount} flashcards de "${title}"?\n\nEsta ação não pode ser desfeita.`)) {
            onDeleteAll?.();
        }
        setShowMenu(false);
    };

    return (
        <div
            onClick={onSelect}
            className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all hover:scale-105 relative"
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg bg-white/10 w-min ${color}`}>{icon}</div>
                    {showDeleteButton && cardCount !== undefined && cardCount > 0 && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                            >
                                <EllipsisIcon className="w-5 h-5 text-muted-foreground" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-10 min-w-[180px]">
                                    <button
                                        onClick={handleDeleteAll}
                                        className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-red-500 hover:text-red-600 rounded-lg"
                                    >
                                        <Trash2Icon className="w-4 h-4" />
                                        Excluir Todos
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <h3 className="font-bold text-foreground">{title}</h3>
                {cardCount !== undefined && (
                    <p className="text-sm text-muted-foreground">{cardCount} cards</p>
                )}
            </div>
            {dueCount !== undefined && dueCount > 0 && (
                <div className="mt-2 text-xs font-bold text-secondary">
                    {dueCount} para revisar
                </div>
            )}
        </div>
    );
};


// --- Main Views ---

const DeckSelectionView: React.FC<{ onSelectDeck: (session: StudySession) => void; onStartQuiz: () => void; onViewSavedQuizzes: () => void }> = ({ onSelectDeck, onStartQuiz, onViewSavedQuizzes }) => {
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { flashcards, getDueFlashcards, fetchFlashcardsForTopics, loading, getAllTags, searchFlashcards, filterByTags, deleteAllFlashcards } = useFlashcardsStore();
    const { openCriarFlashcardModal } = useModalStore();
    const { planType, flashcardsCreatedThisMonth, getMaxFlashcardsPerMonth } = useSubscriptionStore();

    const maxFlashcards = getMaxFlashcardsPerMonth();
    const flashcardsRestantes = maxFlashcards === Infinity ? Infinity : maxFlashcards - flashcardsCreatedThisMonth;

    const [stats, setStats] = useState<FlashcardStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showImportExport, setShowImportExport] = useState(false);
    const [reviewedFlashcardIds, setReviewedFlashcardIds] = useState<Set<string>>(new Set());

    const allTopicIds = useMemo(() => disciplinas.flatMap(d => d.topicos.map(t => t.id)), [disciplinas]);

    useEffect(() => {
        if (allTopicIds.length > 0) {
            fetchFlashcardsForTopics(allTopicIds);
        }
    }, [allTopicIds, fetchFlashcardsForTopics]);

    // Carregar estatísticas
    useEffect(() => {
        const loadStats = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Passar allTopicIds para filtrar as estatísticas pelo edital ativo
                    const fetchedStats = await getFlashcardStats(user.id, allTopicIds);
                    setStats(fetchedStats);
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            } finally {
                setStatsLoading(false);
            }
        };

        // Recarregar estatísticas quando os tópicos mudarem (troca de edital)
        if (allTopicIds.length > 0) {
            loadStats();
        } else {
            // Se não houver tópicos (edital vazio ou carregando), zerar stats ou carregar vazio
            setStats(null);
            setStatsLoading(false);
        }
    }, [allTopicIds]);

    // Buscar IDs de flashcards que já foram revisados pelo menos uma vez
    useEffect(() => {
        const loadReviewedFlashcards = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Buscar todos os flashcard_ids únicos que têm pelo menos uma revisão
                    const { data: reviews, error } = await supabase
                        .from('flashcard_reviews')
                        .select('flashcard_id')
                        .eq('user_id', user.id);

                    if (error) {
                        console.error('Error loading reviewed flashcards:', error);
                        return;
                    }

                    // Criar um Set com os IDs únicos de flashcards revisados
                    const reviewedIds = new Set((reviews as any[])?.map(r => r.flashcard_id) || []);
                    setReviewedFlashcardIds(reviewedIds);
                }
            } catch (error) {
                console.error('Error loading reviewed flashcards:', error);
            }
        };
        loadReviewedFlashcards();
    }, [flashcards]); // Recarregar quando flashcards mudarem

    const getFlashcardsByDisciplina = useCallback((disciplinaId: string) => {
        const disciplina = disciplinas.find(d => d.id === disciplinaId);
        if (!disciplina) return [];
        const topicIds = new Set(disciplina.topicos.map(t => t.id));
        return flashcards.filter(fc => topicIds.has(fc.topico_id));
    }, [disciplinas, flashcards]);

    // Filtrar flashcards vencidos que foram estudados pelo menos uma vez
    const dueFlashcards = useMemo(() => {
        const allDue = getDueFlashcards();
        // Apenas incluir flashcards que têm pelo menos uma revisão registrada
        return allDue.filter(fc => reviewedFlashcardIds.has(fc.id));
    }, [flashcards, getDueFlashcards, reviewedFlashcardIds]);

    // Aplicar filtros de busca e tags
    const filteredFlashcards = useMemo(() => {
        let result = flashcards;

        if (searchQuery) {
            result = searchFlashcards(searchQuery);
        }

        if (selectedTags.length > 0) {
            result = filterByTags(selectedTags);
        }

        return result;
    }, [flashcards, searchQuery, selectedTags, searchFlashcards, filterByTags]);

    const availableTags = useMemo(() => getAllTags(), [flashcards, getAllTags]);

    if (loading && flashcards.length === 0) {
        return <div className="text-center py-20 text-muted-foreground">Carregando seus flashcards...</div>
    }

    return (
        <div className="space-y-6 sm:space-y-8 px-4 sm:px-0">
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Flashcards</h1>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${planType === 'premium'
                            ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400'
                            : planType === 'pro'
                                ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                            {planType.toUpperCase()}
                        </span>
                    </div>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">Escolha um deck para estudar ou revise os cards vencidos.</p>
                    <p className="text-xs text-muted-foreground font-medium mt-1">
                        {flashcardsRestantes === Infinity
                            ? `${flashcardsCreatedThisMonth} flashcards criados este mês`
                            : `${flashcardsRestantes}/${maxFlashcards} flashcards restantes este mês`
                        }
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => setShowImportExport(true)}
                        className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-lg bg-muted text-foreground text-xs sm:text-sm font-medium hover:bg-muted/80 transition-colors flex-1 sm:flex-initial"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Import/Export</span>
                        <span className="sm:hidden">I/E</span>
                    </button>
                    <button
                        onClick={() => openCriarFlashcardModal()}
                        className="h-10 px-3 sm:px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors flex-1 sm:flex-initial"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        Criar
                    </button>
                </div>
            </header>

            {/* Estatísticas */}
            {stats && <FlashcardStatsCard stats={stats} loading={statsLoading} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <DeckCard
                    title="Revisão do Dia"
                    cardCount={dueFlashcards.length}
                    dueCount={dueFlashcards.length}
                    icon={<BookOpenCheckIcon className="w-6 h-6" />}
                    color="text-secondary"
                    onSelect={() => {
                        if (dueFlashcards.length > 0) {
                            onSelectDeck({ deck: dueFlashcards, name: 'Revisão', isReviewSession: true });
                        } else {
                            toast("Nenhum card para revisar hoje! 🎉");
                        }
                    }}
                />
            </div>

            {/* Modal Import/Export */}
            {showImportExport && <ImportExportModal onClose={() => setShowImportExport(false)} />}

            <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Decks por Matéria</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {disciplinas.map((disciplina) => {
                        const cardsInDeck = getFlashcardsByDisciplina(disciplina.id);
                        const dueInDeck = cardsInDeck.filter(c => new Date(c.dueDate) <= startOfDay(new Date()));

                        const handleDeleteAllForDisciplina = async () => {
                            // Excluir flashcards de todos os tópicos da disciplina
                            for (const topico of disciplina.topicos) {
                                await deleteAllFlashcards(topico.id);
                            }
                        };

                        return (
                            <DeckCard
                                key={disciplina.id}
                                title={disciplina.nome}
                                cardCount={cardsInDeck.length}
                                dueCount={dueInDeck.length}
                                icon={<LayoutGridIcon className="w-6 h-6" />}
                                color="text-primary"
                                showDeleteButton={true}
                                onDeleteAll={handleDeleteAllForDisciplina}
                                onSelect={() => {
                                    if (cardsInDeck.length > 0) {
                                        onSelectDeck({ deck: cardsInDeck, name: disciplina.nome, isReviewSession: false });
                                    } else {
                                        toast(`Nenhum flashcard encontrado para ${disciplina.nome}.`);
                                    }
                                }}
                            />
                        )
                    })}
                </div>
                {disciplinas.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <p>Nenhuma disciplina encontrada.</p>
                        <p className="text-sm">Adicione disciplinas e tópicos na aba 'Edital' para começar.</p>
                    </div>
                )}
            </div>

            {/* Heatmap Removed as per user request */}

            {/* Busca e Filtros */}
        </div>
    );
};

const StudySummary: React.FC = () => {
    const { session, answers, sessionStartTime, exitSession } = useFlashcardStudyStore();

    const stats = useMemo(() => {
        const total = session?.totalCards || 0;
        const answeredCount = Object.keys(answers).length;
        const errei = Object.values(answers).filter(a => a === 'errei').length;
        const dificil = Object.values(answers).filter(a => a === 'dificil').length;
        const bom = Object.values(answers).filter(a => a === 'bom').length;
        const facil = Object.values(answers).filter(a => a === 'facil').length;

        const durationMillis = sessionStartTime ? Date.now() - sessionStartTime : 0;
        const minutes = Math.floor(durationMillis / 60000);
        const seconds = Math.floor((durationMillis % 60000) / 1000);

        return {
            total,
            answeredCount,
            errei,
            dificil,
            bom,
            facil,
            duration: `${minutes}m ${seconds}s`
        }
    }, [session, answers, sessionStartTime]);

    return (
        <div className="text-center py-12 flex flex-col items-center max-w-md mx-auto">
            <CheckCircle2Icon className="w-16 h-16 text-secondary mb-4" />
            <h2 className="text-2xl font-bold">Sessão Concluída!</h2>
            <p className="text-muted-foreground mt-2">Você revisou {stats.answeredCount} de {stats.total} cards em {stats.duration}.</p>

            <div className="w-full my-8 p-4 bg-card/60 rounded-xl border border-border space-y-3">
                <div className="flex justify-between items-center text-sm"><span className="text-red-400 font-bold">Errei</span><span>{stats.errei}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-orange-400 font-bold">Difícil</span><span>{stats.dificil}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-blue-400 font-bold">Bom</span><span>{stats.bom}</span></div>
                <div className="flex justify-between items-center text-sm"><span className="text-green-400 font-bold">Fácil</span><span>{stats.facil}</span></div>
            </div>

            <button onClick={exitSession} className="mt-6 h-10 px-6 rounded-lg bg-primary text-primary-foreground font-semibold">
                Voltar aos Decks
            </button>
        </div>
    );
};

const StudyView: React.FC = () => {
    const { session, currentIndex, isFlipped, flipCard, answerCard, exitSession, removeCurrentCardFromSession, saveProgress } = useFlashcardStudyStore();
    const { updateFlashcard, removeFlashcard, undo, canUndo } = useFlashcardsStore();
    const { openCriarFlashcardModal } = useModalStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleAnswer = useCallback(async (difficulty: 'errei' | 'dificil' | 'bom' | 'facil') => {
        if (!session || isSaving) return;
        const currentCard = session.deck[currentIndex];
        if (!currentCard) return;

        setIsSaving(true);

        let quality: 0 | 1 | 2 | 3 | 4 | 5;
        switch (difficulty) {
            case 'errei': quality = 1; break;
            case 'dificil': quality = 3; break;
            case 'bom': quality = 4; break;
            case 'facil': quality = 5; break;
        }

        const updates = calculateNextReview(currentCard, quality);

        // Verificar se é erro de rede
        const isNetworkError = (error: any) => {
            return error?.message?.includes('Failed to fetch') ||
                error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                error?.message?.includes('NetworkError') ||
                error?.code === 'NETWORK_ERROR';
        };

        try {
            await updateFlashcard(currentCard.id, updates);
            answerCard(difficulty);

            // Salvar review no histórico para estatísticas (não bloquear se falhar)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await saveFlashcardReview({
                        user_id: user.id,
                        flashcard_id: currentCard.id,
                        quality: quality,
                    });
                }
            } catch (reviewError) {
                // Falha silenciosa no review - não é crítico
                console.warn('Error saving review stats:', reviewError);
            }
        } catch (error: any) {
            // Se for erro de rede, permitir continuar estudando
            if (isNetworkError(error)) {
                console.warn('Network error - continuing offline:', error);
                // Aplicar atualização localmente mesmo sem internet
                updateFlashcard(currentCard.id, updates).catch(() => {
                    // Ignorar erro - já aplicamos localmente
                });
                answerCard(difficulty);
                toast.warning('Sem conexão. Continuando offline. O progresso será sincronizado quando a internet voltar.');
            } else {
                // Para outros erros, mostrar mensagem mas permitir continuar
                console.error('Error saving progress:', error);
                toast.error('Erro ao salvar. Verifique sua conexão e tente novamente.');
                // Ainda assim, permitir avançar para não bloquear o estudo
                answerCard(difficulty);
            }
        } finally {
            setIsSaving(false);
        }
    }, [session, currentIndex, updateFlashcard, answerCard, isSaving]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignorar se estiver digitando em um input ou textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.code) {
                case 'Digit1':
                    e.preventDefault();
                    handleAnswer('errei');
                    break;
                case 'Digit2':
                    e.preventDefault();
                    handleAnswer('dificil');
                    break;
                case 'Digit3':
                    e.preventDefault();
                    handleAnswer('bom');
                    break;
                case 'Digit4':
                    e.preventDefault();
                    handleAnswer('facil');
                    break;
                case 'Space':
                    e.preventDefault();
                    flipCard();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flipCard, handleAnswer]);

    // Atalho Ctrl+Z para undo
    useEffect(() => {
        const handleUndo = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'z' && canUndo()) {
                e.preventDefault();
                undo();
                toast.success('Ação desfeita!');
            }
        };

        window.addEventListener('keydown', handleUndo);
        return () => window.removeEventListener('keydown', handleUndo);
    }, [undo, canUndo]);

    // Salvar progresso automaticamente a cada 30 segundos
    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            saveProgress();
        }, 30000); // 30 segundos

        return () => clearInterval(interval);
    }, [session, saveProgress]);

    // Salvar progresso quando a página está sendo fechada ou o usuário navega para fora
    useEffect(() => {
        const handleBeforeUnload = () => {
            saveProgress();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                saveProgress();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [saveProgress]);

    if (!session) return null;

    const currentCard = session.deck[currentIndex];
    // Calcular cards respondidos e progresso baseado no total original
    const totalCards = session.totalCards || session.deck.length;
    const answeredCount = totalCards - session.deck.length;
    const currentCardNumber = answeredCount + 1;
    const progress = (answeredCount / totalCards) * 100;

    const handleDelete = async () => {
        setIsMenuOpen(false);
        if (!currentCard) return;

        const confirmed = window.confirm(`Tem certeza que deseja excluir este flashcard?\n\nPergunta: ${currentCard.pergunta}`);
        if (confirmed) {
            try {
                await removeFlashcard(currentCard.id);
                removeCurrentCardFromSession();
                toast.success("Flashcard excluído.");
            } catch (e) {
                toast.error("Falha ao excluir o flashcard.");
            }
        }
    };

    const handleEdit = () => {
        setIsMenuOpen(false);
        if (!currentCard) return;
        openCriarFlashcardModal(currentCard);
    };

    if (!currentCard) {
        return <StudySummary />;
    }

    return (
        <div className="flex flex-col items-center max-w-2xl mx-auto px-4 sm:px-6">
            <header className="w-full flex items-center justify-between mb-4 gap-2">
                <button onClick={exitSession} className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground flex-shrink-0">
                    <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">{session.name}</span>
                    <span className="sm:hidden">Voltar</span>
                </button>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-muted-foreground">{currentCardNumber}/{totalCards}</span>
                    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setIsMenuOpen(false); } }} tabIndex={-1}>
                        <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-1.5 sm:p-2 rounded-full hover:bg-white/10">
                            <EllipsisIcon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-card rounded-md shadow-lg z-20 border border-border">
                                <button onClick={handleEdit} className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2">
                                    <EditIcon className="w-4 h-4" /> Editar Card
                                </button>
                                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-muted flex items-center gap-2">
                                    <Trash2Icon className="w-4 h-4" /> Excluir Card
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="w-full bg-muted/30 rounded-full h-2 mb-4 sm:mb-6">
                <motion.div className="h-full bg-secondary rounded-full" animate={{ width: `${progress}%` }} />
            </div>

            <div className="relative w-full h-48 sm:h-64 flex items-center justify-center mb-4 sm:mb-6">
                <FlippableCard flashcard={currentCard} isFlipped={isFlipped} onFlip={flipCard} className="z-10" />
            </div>

            <div className="mt-4 sm:mt-8 w-full flex justify-center items-center min-h-[80px] sm:min-h-[100px] pb-4">
                <AnimatePresence mode="wait">
                    {!isFlipped ? (
                        <motion.button
                            key="show"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            onClick={flipCard}
                            className="h-12 sm:h-14 px-6 sm:px-8 flex items-center gap-2 rounded-full bg-violet-200 text-violet-800 font-bold text-sm sm:text-base"
                        >
                            <EyeIcon className="w-4 h-4 sm:w-5 sm:h-5" /> Mostrar Resposta
                        </motion.button>
                    ) : (
                        <motion.div
                            key="answers"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="w-full grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2 sm:gap-2 px-2"
                        >
                            <button
                                onClick={() => handleAnswer('errei')}
                                disabled={isSaving}
                                className="h-11 sm:h-12 w-full sm:w-28 rounded-full bg-red-200 text-red-800 font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                Errei (1)
                            </button>
                            <button
                                onClick={() => handleAnswer('dificil')}
                                disabled={isSaving}
                                className="h-11 sm:h-12 w-full sm:w-28 rounded-full bg-orange-200 text-orange-800 font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                Difícil (2)
                            </button>
                            <button
                                onClick={() => handleAnswer('bom')}
                                disabled={isSaving}
                                className="h-11 sm:h-12 w-full sm:w-28 rounded-full bg-blue-200 text-blue-800 font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                Bom (3)
                            </button>
                            <button
                                onClick={() => handleAnswer('facil')}
                                disabled={isSaving}
                                className="h-11 sm:h-12 w-full sm:w-28 rounded-full bg-green-200 text-green-800 font-bold text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                            >
                                Fácil (4)
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const FlashcardsPage: React.FC = () => {
    const { session, startSession } = useFlashcardStudyStore();
    const { flashcards } = useFlashcardsStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const [viewMode, setViewMode] = useState<'decks' | 'saved-quizzes'>('decks');
    const [showImportExport, setShowImportExport] = useState(false);

    return (
        <div data-tutorial="flashcards-content" className="w-full">
            <PurpleBackground />
            <AnimatePresence mode="wait">
                {session ? (
                    <motion.div
                        key="study-session"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <StudyView />
                    </motion.div>
                ) : (
                    <motion.div
                        key="deck-selection"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                    >
                        <DeckSelectionView
                            onSelectDeck={startSession}
                            onStartQuiz={() => { }}
                            onViewSavedQuizzes={() => { }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .rotate-y-180 { transform: rotateY(180deg); } .backface-hidden { backface-visibility: hidden; }`}</style>
        </div >
    );
};

export default FlashcardsPage;