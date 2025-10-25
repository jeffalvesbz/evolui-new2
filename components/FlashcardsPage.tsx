import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { generateFlashcards } from '../services/geminiService';
import { Flashcard as FlashcardType } from '../types';
import { SparklesIcon, LayersIcon, SaveIcon, BookOpenCheckIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircle2Icon } from './icons';
import { toast } from './Sonner';
import { calculateNextReview } from '../services/srsService';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

type GeneratedFlashcard = Omit<FlashcardType, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>;
type View = 'generate' | 'review';

// Shared Flippable Card Component
const FlippableCard: React.FC<{
  flashcard: { pergunta: string; resposta: string };
  isFlipped: boolean;
  onFlip: () => void;
  className?: string;
}> = ({ flashcard, isFlipped, onFlip, className = '' }) => {
    return (
        <div className={`w-full h-56 perspective-1000 ${className}`} onClick={onFlip}>
            <motion.div
                className="relative w-full h-full transform-style-3d"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6 }}
            >
                {/* Front */}
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl border border-border flex flex-col justify-center items-center p-4 cursor-pointer shadow-lg">
                    <p className="text-sm text-muted-foreground mb-2">Pergunta</p>
                    <p className="text-center font-semibold text-foreground">{flashcard.pergunta}</p>
                </div>
                {/* Back */}
                <div className="absolute w-full h-full backface-hidden bg-card rounded-xl border border-primary/50 flex flex-col justify-center items-center p-4 cursor-pointer rotate-y-180 shadow-lg">
                    <p className="text-sm text-primary mb-2 font-bold">Resposta</p>
                    <p className="text-center text-sm text-foreground">{flashcard.resposta}</p>
                </div>
            </motion.div>
        </div>
    );
};


// Generator View Component
const GeneratorView: React.FC = () => {
    const [selectedTopicId, setSelectedTopicId] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [generatedFlashcards, setGeneratedFlashcards] = useState<GeneratedFlashcard[]>([]);
    const [flippedStates, setFlippedStates] = useState<boolean[]>([]);

    const allTopics = useDisciplinasStore(state => state.getAllTopics());
    const addFlashcards = useFlashcardsStore(state => state.addFlashcards);

    const selectedTopicName = useMemo(() => {
        return allTopics.find(t => t.id === selectedTopicId)?.titulo || '';
    }, [selectedTopicId, allTopics]);

    useEffect(() => {
        setFlippedStates(new Array(generatedFlashcards.length).fill(false));
    }, [generatedFlashcards]);

    const handleGenerate = async () => {
        if (!selectedTopicId) {
            toast.error('Por favor, selecione um tópico para gerar os flashcards.');
            return;
        }
        setIsLoading(true);
        setGeneratedFlashcards([]);

        try {
            const flashcards = await generateFlashcards(selectedTopicName);
            setGeneratedFlashcards(flashcards);
            toast.success(`Flashcards gerados para "${selectedTopicName}"!`);
        } catch (error) {
            toast.error('Ocorreu um erro ao gerar os flashcards.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSave = () => {
        if (generatedFlashcards.length === 0 || !selectedTopicId) {
            toast.error('Não há flashcards para salvar ou nenhum tópico foi selecionado.');
            return;
        }

        addFlashcards(generatedFlashcards, selectedTopicId);
        toast.success('Flashcards salvos com sucesso!');
        setGeneratedFlashcards([]);
        setSelectedTopicId('');
    };

    const handleFlip = (index: number) => {
        setFlippedStates(states => states.map((s, i) => i === index ? !s : s));
    };

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-6 border-b border-border">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label htmlFor="topic-select" className="block text-sm font-medium text-muted-foreground mb-1">
                            Selecione um Tópico do Edital
                        </label>
                        <select
                            id="topic-select"
                            value={selectedTopicId}
                            onChange={(e) => setSelectedTopicId(e.target.value)}
                            className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm focus:ring-primary focus:border-primary"
                            disabled={isLoading}
                        >
                            <option value="">-- Escolha um tópico --</option>
                            {allTopics.map(topic => (
                                <option key={topic.id} value={topic.id}>
                                    {topic.disciplinaNome} - {topic.titulo}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !selectedTopicId}
                        className="w-full sm:w-auto h-10 px-6 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        {isLoading ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                </div>
            </div>
            
            <div className="p-6">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <SparklesIcon className="w-12 h-12 text-primary animate-pulse mb-4" />
                        <h3 className="font-semibold text-lg text-foreground">Gerando flashcards...</h3>
                        <p className="text-muted-foreground mt-1">Aguarde, a IA está criando conteúdo para você.</p>
                    </div>
                )}

                {!isLoading && generatedFlashcards.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-64 text-center">
                        <LayersIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                        <h3 className="font-semibold text-lg text-foreground">Pronto para começar</h3>
                        <p className="max-w-xs mx-auto text-muted-foreground mt-1">Selecione um tópico e clique em "Gerar com IA" para criar seu material de revisão.</p>
                    </div>
                )}

                {!isLoading && generatedFlashcards.length > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <h3 className="text-xl font-bold mb-4 text-center">Flashcards para: <span className="text-primary">{selectedTopicName}</span></h3>
                        <p className="text-sm text-muted-foreground text-center mb-6">Clique em um card para virar e ver a resposta.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedFlashcards.map((fc, index) => (
                                <FlippableCard key={index} flashcard={fc} isFlipped={flippedStates[index]} onFlip={() => handleFlip(index)} />
                            ))}
                        </div>
                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="h-10 px-6 flex items-center justify-center gap-2 rounded-lg bg-secondary text-black text-sm font-medium hover:bg-secondary/90 transition-colors"
                            >
                                <SaveIcon className="w-4 h-4" />
                                Salvar Flashcards no Edital
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

// Review View Component
interface ReviewViewProps {
  setView: (view: View) => void;
}
const ReviewView: React.FC<ReviewViewProps> = ({ setView }) => {
    const getDueFlashcards = useFlashcardsStore(state => state.getDueFlashcards);
    const getUpcomingFlashcards = useFlashcardsStore(state => state.getUpcomingFlashcards);
    const updateFlashcard = useFlashcardsStore(state => state.updateFlashcard);
    
    const [activeDeck, setActiveDeck] = useState<FlashcardType[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionResults, setSessionResults] = useState<{ correct: number, incorrect: number } | null>(null);
    const [sessionAnswers, setSessionAnswers] = useState<('correct' | 'incorrect')[]>([]);

    const dueFlashcards = useMemo(() => getDueFlashcards(), [getDueFlashcards, activeDeck]); // Re-evaluate when deck changes
    
    const upcomingReviews = useMemo(() => {
        const upcoming = getUpcomingFlashcards();
        const today = startOfDay(new Date());

        const grouped: Record<number, FlashcardType[]> = {};
        
        upcoming.forEach(card => {
            const dueDate = startOfDay(new Date(card.dueDate));
            const diff = differenceInCalendarDays(dueDate, today);
            if (diff > 0) {
                if (!grouped[diff]) {
                    grouped[diff] = [];
                }
                grouped[diff].push(card);
            }
        });

        return Object.entries(grouped)
            .map(([days, cards]) => ({ days: Number(days), count: cards.length }))
            .sort((a, b) => a.days - b.days);
    }, [getUpcomingFlashcards]);

    const formatUpcomingDate = (days: number) => {
        if (days === 1) return 'Amanhã';
        return `Em ${days} dias`;
    };

    const startReview = () => {
        setActiveDeck(dueFlashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setSessionResults(null);
        setSessionAnswers([]);
    };

    const handleNext = () => {
        if (currentCardIndex < activeDeck.length - 1) {
            setCurrentCardIndex(i => i + 1);
            setIsFlipped(false);
        } else {
            const correct = sessionAnswers.filter(a => a === 'correct').length;
            const incorrect = sessionAnswers.filter(a => a === 'incorrect').length;
            setSessionResults({ correct, incorrect });
        }
    };
    
    const handlePrev = () => {
        if (currentCardIndex > 0) {
            setCurrentCardIndex(i => i - 1);
            setIsFlipped(false);
        }
    };
    
    const handleAnswer = (answer: 'correct' | 'incorrect') => {
        const currentCard = activeDeck[currentCardIndex];
        if (!currentCard) return;

        const srsUpdates = calculateNextReview(currentCard, answer);
        updateFlashcard(currentCard.id, srsUpdates);
        setSessionAnswers(current => [...current, answer]);
        setTimeout(handleNext, 300);
    };
    
    const exitSession = () => {
        setActiveDeck([]);
    };

    if (sessionResults) {
        return (
             <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[500px]">
                <CheckCircle2Icon className="w-16 h-16 text-secondary mb-4"/>
                <h3 className="text-2xl font-bold text-foreground">Sessão Concluída!</h3>
                <p className="text-muted-foreground mt-2">Veja seu desempenho abaixo:</p>
                <div className="flex gap-8 my-8">
                    <div>
                        <p className="text-4xl font-bold text-green-400">{sessionResults.correct}</p>
                        <p className="text-sm text-muted-foreground">Acertos</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-red-400">{sessionResults.incorrect}</p>
                        <p className="text-sm text-muted-foreground">Erros</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={exitSession} className="h-10 px-6 rounded-lg bg-muted text-muted-foreground font-semibold">Voltar ao Início</button>
                    <button onClick={() => setView('generate')} className="h-10 px-6 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                        <SparklesIcon className="w-4 h-4" />
                        Gerar Novos Flashcards
                    </button>
                </div>
            </div>
        )
    }

    if (activeDeck.length > 0 && currentCardIndex < activeDeck.length) {
        const currentCard = activeDeck[currentCardIndex];
        return (
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 flex flex-col items-center">
                <AnimatePresence mode="wait">
                    <motion.div key={currentCardIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full max-w-lg">
                       <FlippableCard flashcard={currentCard} isFlipped={isFlipped} onFlip={() => setIsFlipped(!isFlipped)} />
                    </motion.div>
                </AnimatePresence>
                <div className="my-6 text-sm font-semibold text-muted-foreground">
                    Card {currentCardIndex + 1} de {activeDeck.length}
                </div>
                
                <AnimatePresence>
                {isFlipped && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 mb-4">
                        <button onClick={() => handleAnswer('incorrect')} className="h-12 w-32 rounded-lg bg-red-500/20 text-red-400 font-bold hover:bg-red-500/30 transition-colors">Errei</button>
                        <button onClick={() => handleAnswer('correct')} className="h-12 w-32 rounded-lg bg-green-500/20 text-green-400 font-bold hover:bg-green-500/30 transition-colors">Acertei</button>
                    </motion.div>
                )}
                </AnimatePresence>

                <div className="flex items-center justify-between w-full max-w-lg">
                    <button onClick={handlePrev} disabled={currentCardIndex === 0} className="p-3 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50"><ChevronLeftIcon className="w-5 h-5"/></button>
                    <button onClick={exitSession} className="px-4 py-2 text-sm rounded-lg bg-muted text-muted-foreground">Sair</button>
                    <button onClick={handleNext} disabled={!isFlipped} className="p-3 rounded-full bg-muted hover:bg-muted/80 disabled:opacity-50"><ChevronRightIcon className="w-5 h-5"/></button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[500px]">
            <BookOpenCheckIcon className="w-16 h-16 text-primary mb-4" />
            <h3 className="text-2xl font-bold text-foreground">Revisão Espaçada</h3>
            <p className="text-muted-foreground mt-2 max-w-md">O sistema programa automaticamente os melhores dias para você revisar cada flashcard, fortalecendo sua memória a longo prazo.</p>
            
            <div className="my-8 p-6 rounded-lg bg-muted/50 border border-border w-full max-w-xs">
                <p className="text-sm text-muted-foreground">Cards para revisar hoje</p>
                <p className="text-5xl font-bold text-foreground my-2">{dueFlashcards.length}</p>
            </div>

            {dueFlashcards.length > 0 ? (
                <button onClick={startReview} className="h-12 px-8 rounded-lg bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 transition-transform hover:scale-105">
                    Iniciar Revisão
                </button>
            ) : (
                <p className="font-semibold text-secondary">Parabéns, nenhuma revisão pendente por hoje! 🎉</p>
            )}

            {upcomingReviews.length > 0 && (
                <div className="mt-8 w-full max-w-md">
                    <h4 className="text-lg font-semibold text-center text-muted-foreground mb-4">Próximas Revisões</h4>
                    <div className="space-y-2">
                        {upcomingReviews.map(({ days, count }) => (
                            <div key={days} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg text-sm">
                                <span className="font-medium text-foreground">{formatUpcomingDate(days)}</span>
                                <span className="font-semibold text-muted-foreground">{count} card{count > 1 ? 's' : ''}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};


// Main Page Component
const FlashcardsPage: React.FC = () => {
    const [view, setView] = useState<View>('generate');

    const TabButton: React.FC<{
        label: string;
        icon: React.ElementType;
        active: boolean;
        onClick: () => void;
    }> = ({ label, icon: Icon, active, onClick }) => (
        <button
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-t-lg border-b-2 font-semibold transition-all ${
                active ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:bg-muted/50'
            }`}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .rotate-y-180 { transform: rotateY(180deg); } .backface-hidden { backface-visibility: hidden; }`}</style>
            
            <header>
                <h1 className="text-3xl font-bold text-foreground">Flashcards</h1>
                <p className="text-muted-foreground mt-1">Crie flashcards com IA e revise o conteúdo de forma ativa e espaçada.</p>
            </header>

            <div>
                <div className="flex border-b border-border">
                    <TabButton label="Gerador IA" icon={SparklesIcon} active={view === 'generate'} onClick={() => setView('generate')} />
                    <TabButton label="Revisão" icon={BookOpenCheckIcon} active={view === 'review'} onClick={() => setView('review')} />
                </div>
                <div className="pt-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={view}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {view === 'generate' ? <GeneratorView /> : <ReviewView setView={setView} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default FlashcardsPage;