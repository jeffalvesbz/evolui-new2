import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizStore } from '../../stores/useQuizStore';
import { useDisciplinasStore } from '../../stores/useDisciplinasStore';
import { QuizConfigModal, QuizConfig } from '../../components/QuizConfigModal';
import { QuizView } from '../../components/QuizView';
import { QuizResultView } from '../../components/QuizResultView';
import { SavedQuizzesList } from '../../components/SavedQuizzesList';
import { Quiz } from '../../types';
import { PlusCircleIcon } from '../../components/icons';

const PurpleBackground = () => (
    <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'linear-gradient(180deg, #4c1d95, #020617 40%)',
        zIndex: -2
    }} />
);

const QuizPage: React.FC = () => {
    const { startQuiz, resetQuiz, loadSavedQuiz, isGenerating, generationProgress, geracaoEmAndamento, session: quizSession, clearPersistedSession } = useQuizStore();
    const { disciplinas } = useDisciplinasStore();
    const [quizMode, setQuizMode] = useState<'inactive' | 'generating' | 'active' | 'result'>('inactive');
    const [showQuizConfig, setShowQuizConfig] = useState(false);
    const [showResumeModal, setShowResumeModal] = useState(false);

    // Verificar se há quiz salvo ao montar o componente
    useEffect(() => {
        if (quizSession && !isGenerating && !geracaoEmAndamento) {
            setShowResumeModal(true);
        }
    }, []);

    // Sincronizar estado de geração persistente
    useEffect(() => {
        if (geracaoEmAndamento || isGenerating) {
            setQuizMode('generating');
        } else if (quizSession?.completed) {
            setQuizMode('result');
        } else if (quizSession) {
            setQuizMode('active');
        } else {
            setQuizMode('inactive');
        }
    }, [geracaoEmAndamento, isGenerating, quizSession]);

    const handleStartQuizWithConfig = async (config: QuizConfig) => {
        setShowQuizConfig(false);
        try {
            setQuizMode('generating');
            const disciplinaNome = config.disciplinaId
                ? disciplinas.find(d => d.id === config.disciplinaId)?.nome || 'Geral'
                : 'Conhecimentos Gerais';

            await startQuiz(
                false,
                config.mode,
                disciplinaNome,
                config.questionCount,
                config.topicos
            );
            setQuizMode('active');
        } catch (error) {
            console.error('Erro ao gerar quiz:', error);
            setQuizMode('inactive');
        }
    };

    const handleQuizComplete = () => {
        const { completeQuiz } = useQuizStore.getState();
        completeQuiz();
        setQuizMode('result');
    };

    const handleExitQuiz = () => {
        resetQuiz();
        setQuizMode('inactive');
    };

    const handleStartSavedQuiz = (quiz: Quiz) => {
        loadSavedQuiz(quiz, false);
        setQuizMode('active');
    };

    const handleResumeQuiz = () => {
        setShowResumeModal(false);
        setQuizMode('active');
    };

    const handleStartNewQuiz = () => {
        setShowResumeModal(false);
        resetQuiz();
        setShowQuizConfig(true);
    };

    return (
        <div className="w-full min-h-screen relative">
            <PurpleBackground />

            <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                    {quizMode === 'generating' ? (
                        <motion.div
                            key="quiz-generating"
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6"
                        >
                            <div className="relative w-24 h-24">
                                <motion.div
                                    className="absolute inset-0 border-4 border-primary/30 rounded-full"
                                    animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />
                                <motion.div
                                    className="absolute inset-0 border-t-4 border-primary rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Gerando Questões com IA</h2>
                                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                                    Analisando seus materiais e criando questões personalizadas...
                                </p>
                                {generationProgress > 0 && (
                                    <div className="max-w-xs mx-auto bg-white/10 rounded-full h-2 overflow-hidden">
                                        <motion.div
                                            className="h-full bg-primary"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress}%` }}
                                        />
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ) : quizMode === 'active' ? (
                        <QuizView
                            key="quiz-active"
                            onComplete={handleQuizComplete}
                            onExit={handleExitQuiz}
                        />
                    ) : quizMode === 'result' ? (
                        <QuizResultView
                            key="quiz-result"
                            onRestart={() => {
                                resetQuiz();
                                setShowQuizConfig(true);
                            }}
                            onExit={handleExitQuiz}
                        />
                    ) : (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowQuizConfig(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20"
                                >
                                    <PlusCircleIcon className="w-5 h-5" />
                                    Novas Questões
                                </button>
                            </div>
                            <SavedQuizzesList
                                onStartQuiz={handleStartSavedQuiz}
                                onBack={() => { }} // No back needed as it's the main view
                            />
                        </div>
                    )}
                </AnimatePresence>

                {/* Modal de Configuração */}
                {showQuizConfig && (
                    <QuizConfigModal
                        onClose={() => setShowQuizConfig(false)}
                        onStart={handleStartQuizWithConfig}
                        disciplinas={disciplinas}
                    />
                )}

                {/* Modal de Retomada */}
                {showResumeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-foreground mb-2">Questões em Andamento</h3>
                            <p className="text-muted-foreground mb-6">
                                Você tem questões não finalizadas. Deseja continuar de onde parou?
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={handleStartNewQuiz}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Iniciar Novo
                                </button>
                                <button
                                    onClick={handleResumeQuiz}
                                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                >
                                    Continuar Questões
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuizPage;
