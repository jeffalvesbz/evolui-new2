import React, { useState, useEffect } from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { CheckCircle2Icon, XCircleIcon, ClockIcon, ChevronLeftIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from './Sonner';

interface QuizViewProps {
    onExit: () => void;
    onComplete: () => void;
}

export const QuizView: React.FC<QuizViewProps> = ({ onExit, onComplete }) => {
    const { session, answerQuestion, nextQuestion, getCurrentQuestion, isQuizComplete } = useQuizStore();
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const currentQuestion = getCurrentQuestion();

    // Timer
    useEffect(() => {
        if (!session?.timerEnabled || !session.timeLimit || showResult) return;

        setTimeLeft(session.timeLimit);
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev === null || prev <= 1) {
                    handleTimeout();
                    return null;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [session?.currentQuestionIndex, showResult]);

    const handleTimeout = () => {
        if (!selectedAnswer && currentQuestion) {
            // Timeout sem resposta = errou
            answerQuestion('');
            setShowResult(true);
            toast.error('Tempo esgotado!');
        }
    };

    const handleAnswer = (answer: string) => {
        if (showResult) return;

        setSelectedAnswer(answer);
        answerQuestion(answer);
        setShowResult(true);
    };

    const handleNext = () => {
        if (!session) return;

        if (session.currentQuestionIndex < session.questions.length - 1) {
            nextQuestion();
            setSelectedAnswer(null);
            setShowResult(false);
        } else {
            // Quiz finalizado
            onComplete();
        }
    };

    if (!session || !currentQuestion) {
        return null;
    }

    const progress = ((session.currentQuestionIndex + 1) / session.questions.length) * 100;
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <button
                    onClick={onExit}
                    className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                    Sair do Quiz
                </button>
            </div>

            {/* Progresso */}
            <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-bold text-foreground">
                        {session.currentQuestionIndex + 1}/{session.questions.length}
                    </span>
                    {session.timerEnabled && timeLeft !== null && (
                        <div className="flex items-center gap-1.5 text-xs">
                            <ClockIcon className="w-3.5 h-3.5" />
                            <span className={timeLeft <= 5 ? 'text-red-400 font-bold' : 'text-foreground'}>
                                {timeLeft}s
                            </span>
                        </div>
                    )}
                </div>
                <div className="w-full bg-muted/30 rounded-full h-1.5">
                    <motion.div
                        className="h-full bg-primary rounded-full"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                    />
                </div>
            </div>

            {/* Pergunta */}
            <div className="bg-card/60 backdrop-blur-xl rounded-xl p-6 border border-white/10 mb-4">
                <h2 className="text-xl font-bold text-center mb-6 text-foreground">
                    {currentQuestion.flashcard.pergunta}
                </h2>

                {/* Opções */}
                <div className="space-y-2">
                    <AnimatePresence mode="wait">
                        {currentQuestion.options.map((option, index) => {
                            const isSelected = selectedAnswer === option;
                            const isCorrectOption = option === currentQuestion.correctAnswer;
                            const showCorrect = showResult && isCorrectOption;
                            const showIncorrect = showResult && isSelected && !isCorrectOption;

                            return (
                                <motion.button
                                    key={`${session.currentQuestionIndex}-${index}`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleAnswer(option)}
                                    disabled={showResult}
                                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${showCorrect
                                        ? 'border-green-500 bg-green-500/20'
                                        : showIncorrect
                                            ? 'border-red-500 bg-red-500/20'
                                            : isSelected
                                                ? 'border-primary bg-primary/20'
                                                : 'border-border hover:border-primary/50 hover:bg-white/5'
                                        } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-foreground">{option}</span>
                                        {showCorrect && <CheckCircle2Icon className="w-4 h-4 text-green-500" />}
                                        {showIncorrect && <XCircleIcon className="w-4 h-4 text-red-500" />}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Feedback */}
                {showResult && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 p-3 rounded-lg ${isCorrect ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
                            }`}
                    >
                        <p className={`text-xs font-semibold ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                            {isCorrect ? '✓ Correto!' : `✗ Resposta: ${currentQuestion.correctAnswer}`}
                        </p>

                        {currentQuestion.explanation && (
                            <p className="text-xs text-foreground/80 mt-2 leading-relaxed">
                                {currentQuestion.explanation}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>

            {/* Botão próxima */}
            {showResult && (
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleNext}
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                    {session.currentQuestionIndex < session.questions.length - 1
                        ? 'Próxima →'
                        : 'Ver Resultado'}
                </motion.button>
            )}
        </div>
    );
};
