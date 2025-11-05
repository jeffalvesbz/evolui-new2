import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useFlashcardStudyStore, StudySession } from '../stores/useFlashcardStudyStore';
import { Flashcard as FlashcardType, Disciplina } from '../types';
import {
  SparklesIcon,
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
} from './icons';
import { toast } from './Sonner';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { startOfDay } from 'date-fns';
import { generateFlashcardsFromContent } from '../services/geminiService';
import { useModalStore } from '../stores/useModalStore';
import { calculateNextReview } from '../services/srsService';

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
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl flex flex-col justify-center items-center p-6 cursor-pointer shadow-2xl text-foreground border border-border">
                    <p className="text-sm text-muted-foreground mb-2">Pergunta</p>
                    <p className="text-center text-xl font-semibold">{flashcard.pergunta}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl flex flex-col justify-center items-center p-6 cursor-pointer rotate-y-180 shadow-2xl text-foreground border border-border">
                    <p className="text-sm text-primary mb-2 font-bold">Resposta</p>
                    <p className="text-center font-medium">{flashcard.resposta}</p>
                </div>
            </motion.div>
        </div>
    );
};

const DeckCard: React.FC<{
  title: string;
  cardCount: number;
  dueCount?: number;
  icon: React.ReactNode;
  onSelect: () => void;
  color: string;
}> = ({ title, cardCount, dueCount, icon, onSelect, color }) => (
    <div
        onClick={onSelect}
        className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all hover:scale-105"
    >
        <div>
            <div className={`p-2 rounded-lg bg-white/10 w-min mb-3 ${color}`}>{icon}</div>
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{cardCount} cards</p>
        </div>
        {dueCount !== undefined && dueCount > 0 && (
            <div className="mt-2 text-xs font-bold text-secondary">
                {dueCount} para revisar
            </div>
        )}
    </div>
);

// --- AI Generator Component ---
const GeradorIA: React.FC = () => {
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { addFlashcards } = useFlashcardsStore();
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if(disciplinas.length > 0 && !selectedDisciplinaId) {
            setSelectedDisciplinaId(disciplinas[0].id);
        }
    }, [disciplinas, selectedDisciplinaId]);

    const handleGenerate = async () => {
        const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
        if (!disciplina) {
            toast.error("Por favor, selecione uma disciplina.");
            return;
        }
        if (disciplina.topicos.length === 0) {
            toast.error(`A disciplina "${disciplina.nome}" não possui tópicos. Adicione um tópico primeiro no menu 'Edital'.`);
            return;
        }

        setIsLoading(true);
        toast("Gerando flashcards com IA... Isso pode levar um momento.");
        try {
            const generated = await generateFlashcardsFromContent(disciplina.id);
            // Associa os flashcards gerados ao primeiro tópico da disciplina
            const targetTopicId = disciplina.topicos[0].id;
            await addFlashcards(generated, targetTopicId);
            toast.success(`${generated.length} flashcards gerados para ${disciplina.nome}!`);
        } catch (error) {
            toast.error("Falha ao gerar flashcards com IA.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-card/60 backdrop-blur-xl border border-dashed border-primary/50 rounded-xl p-4 space-y-3">
             <div className="flex items-center gap-3">
                <SparklesIcon className="w-6 h-6 text-primary"/>
                <div>
                    <h3 className="font-bold text-foreground">Gerador de Flashcards com IA</h3>
                    <p className="text-sm text-muted-foreground">Gere cards a partir de seus PDFs (simulado).</p>
                </div>
            </div>
            <select
                value={selectedDisciplinaId}
                onChange={e => setSelectedDisciplinaId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground"
            >
                {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
            <button onClick={handleGenerate} disabled={isLoading} className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50">
                {isLoading ? 'Gerando...' : 'Gerar 5 Flashcards'}
            </button>
             <p className="text-center text-xs text-muted-foreground">Você gerou 742 / 1000 flashcards este mês.</p>
        </div>
    );
};


// --- Main Views ---

const DeckSelectionView: React.FC<{ onSelectDeck: (session: StudySession) => void }> = ({ onSelectDeck }) => {
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const { flashcards, getDueFlashcards, fetchFlashcardsForTopics, loading } = useFlashcardsStore();
    const { openCriarFlashcardModal } = useModalStore();
    
    const allTopicIds = useMemo(() => disciplinas.flatMap(d => d.topicos.map(t => t.id)), [disciplinas]);

    useEffect(() => {
        if(allTopicIds.length > 0) {
            fetchFlashcardsForTopics(allTopicIds);
        }
    }, [allTopicIds, fetchFlashcardsForTopics]);

    const getFlashcardsByDisciplina = useCallback((disciplinaId: string) => {
        const disciplina = disciplinas.find(d => d.id === disciplinaId);
        if (!disciplina) return [];
        const topicIds = new Set(disciplina.topicos.map(t => t.id));
        return flashcards.filter(fc => topicIds.has(fc.topico_id));
    }, [disciplinas, flashcards]);

    const dueFlashcards = useMemo(() => getDueFlashcards(), [flashcards, getDueFlashcards]);

    if (loading && flashcards.length === 0) {
        return <div className="text-center py-20 text-muted-foreground">Carregando seus flashcards...</div>
    }

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
                    <p className="text-muted-foreground mt-1">Escolha um deck para estudar ou revise os cards vencidos.</p>
                </div>
                <button onClick={() => openCriarFlashcardModal()} className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <PlusCircleIcon className="w-4 h-4" />
                    Criar Flashcard
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                 <div className="md:col-span-2 lg:col-span-1"><GeradorIA/></div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Decks por Matéria</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {disciplinas.map((disciplina) => {
                        const cardsInDeck = getFlashcardsByDisciplina(disciplina.id);
                        const dueInDeck = cardsInDeck.filter(c => new Date(c.dueDate) <= startOfDay(new Date()));
                        return (
                             <DeckCard
                                key={disciplina.id}
                                title={disciplina.nome}
                                cardCount={cardsInDeck.length}
                                dueCount={dueInDeck.length}
                                icon={<LayoutGridIcon className="w-6 h-6" />}
                                color="text-primary"
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
        </div>
    );
};

const StudySummary: React.FC = () => {
    const { session, answers, sessionStartTime, exitSession } = useFlashcardStudyStore();
    
    const stats = useMemo(() => {
        const total = session?.deck.length || 0;
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
    const { session, currentIndex, isFlipped, flipCard, answerCard, exitSession, removeCurrentCardFromSession } = useFlashcardStudyStore();
    const { updateFlashcard, removeFlashcard } = useFlashcardsStore();
    const { openCriarFlashcardModal } = useModalStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleAnswer = useCallback(async (difficulty: 'errei' | 'dificil' | 'bom' | 'facil') => {
        if (!session) return;
        const currentCard = session.deck[currentIndex];
        if (!currentCard) return;
        
        let quality: 0 | 1 | 2 | 3 | 4 | 5;
        switch (difficulty) {
            case 'errei': quality = 1; break;
            case 'dificil': quality = 3; break;
            case 'bom': quality = 4; break;
            case 'facil': quality = 5; break;
        }

        const updates = calculateNextReview(currentCard, quality);
        
        try {
            await updateFlashcard(currentCard.id, updates);
            answerCard(difficulty);
        } catch (error) {
            toast.error("Não foi possível salvar seu progresso. Tente novamente.");
        }
    }, [session, currentIndex, updateFlashcard, answerCard]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                flipCard();
            }
            if (isFlipped) {
                if (e.key === '1') handleAnswer('errei');
                if (e.key === '2') handleAnswer('dificil');
                if (e.key === '3') handleAnswer('bom');
                if (e.key === '4') handleAnswer('facil');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFlipped, flipCard, handleAnswer]);

    if (!session) return null;
    
    const currentCard = session.deck[currentIndex];
    const progress = (currentIndex / session.deck.length) * 100;

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
        <div className="flex flex-col items-center max-w-2xl mx-auto">
            <header className="w-full flex items-center justify-between mb-4">
                <button onClick={exitSession} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground">
                    <ChevronLeftIcon className="w-5 h-5" />
                    {session.name}
                </button>
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-muted-foreground">{currentIndex + 1}/{session.deck.length}</span>
                    <div className="relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) { setIsMenuOpen(false); } }} tabIndex={-1}>
                        <button onClick={() => setIsMenuOpen(prev => !prev)} className="p-2 rounded-full hover:bg-white/10">
                            <EllipsisIcon className="w-5 h-5 text-muted-foreground" />
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

            <div className="w-full bg-muted/30 rounded-full h-2 mb-6">
                <motion.div className="h-full bg-secondary rounded-full" animate={{ width: `${progress}%` }} />
            </div>

            <div className="relative w-full h-64 flex items-center justify-center">
                 <FlippableCard flashcard={currentCard} isFlipped={isFlipped} onFlip={flipCard} className="z-10"/>
            </div>
            
            <div className="mt-8 w-full flex justify-center items-center h-20">
                <AnimatePresence mode="wait">
                    {!isFlipped ? (
                        <motion.button
                            key="show"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            onClick={flipCard}
                            className="h-14 px-8 flex items-center gap-2 rounded-full bg-violet-200 text-violet-800 font-bold"
                        >
                            <EyeIcon className="w-5 h-5"/> Mostrar Resposta
                        </motion.button>
                    ) : (
                        <motion.div
                            key="answers"
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                            className="flex flex-wrap justify-center gap-2"
                        >
                            <button onClick={() => handleAnswer('errei')} className="h-12 w-28 rounded-full bg-red-200 text-red-800 font-bold">Errei (1)</button>
                            <button onClick={() => handleAnswer('dificil')} className="h-12 w-28 rounded-full bg-orange-200 text-orange-800 font-bold">Difícil (2)</button>
                            <button onClick={() => handleAnswer('bom')} className="h-12 w-28 rounded-full bg-blue-200 text-blue-800 font-bold">Bom (3)</button>
                            <button onClick={() => handleAnswer('facil')} className="h-12 w-28 rounded-full bg-green-200 text-green-800 font-bold">Fácil (4)</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

const FlashcardsPage: React.FC = () => {
    const { session, startSession } = useFlashcardStudyStore();

    return (
        <div className="w-full">
            <PurpleBackground />
            <AnimatePresence mode="wait">
                <motion.div
                    key={session ? 'study' : 'decks'}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                >
                    {session ? (
                        <StudyView />
                    ) : (
                        <DeckSelectionView onSelectDeck={startSession} />
                    )}
                </motion.div>
            </AnimatePresence>
             <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .rotate-y-180 { transform: rotateY(180deg); } .backface-hidden { backface-visibility: hidden; }`}</style>
        </div>
    );
};

export default FlashcardsPage;