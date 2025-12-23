import React from 'react';
import { useQuizStore } from '../stores/useQuizStore';
import { TrophyIcon, CheckCircle2Icon, XCircleIcon, ClockIcon, TargetIcon } from './icons';
import { motion } from 'framer-motion';

interface QuizResultViewProps {
    onRestart: () => void;
    onExit: () => void;
}

export const QuizResultView: React.FC<QuizResultViewProps> = ({ onRestart, onExit }) => {
    const { endQuiz, session } = useQuizStore();

    const result = endQuiz();

    if (!result || !session) return null;

    const { totalQuestions, correctAnswers, incorrectAnswers, accuracy, totalTime, averageTimePerQuestion } = result;

    // Formatação de tempo
    const formatTime = (ms: number) => {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
    };

    // Mensagem baseada na performance
    const getPerformanceMessage = () => {
        if (accuracy >= 90) return { text: 'Excelente! 🎉', color: 'text-green-400' };
        if (accuracy >= 70) return { text: 'Muito Bom! 👏', color: 'text-blue-400' };
        if (accuracy >= 50) return { text: 'Bom trabalho! 👍', color: 'text-yellow-400' };
        return { text: 'Continue praticando! 💪', color: 'text-orange-400' };
    };

    const performance = getPerformanceMessage();

    return (
        <div className="max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="inline-block mb-3"
                >
                    <TrophyIcon className="w-16 h-16 text-yellow-400" />
                </motion.div>

                <h2 className="text-2xl font-bold text-foreground mb-1">Questões Concluídas!</h2>
                <p className={`text-lg font-semibold ${performance.color}`}>{performance.text}</p>
            </motion.div>

            {/* Estatísticas Principais */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/60 backdrop-blur-xl rounded-xl p-6 border border-white/10 mb-4"
            >
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-1">
                            {Math.round(accuracy)}%
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <TargetIcon className="w-3.5 h-3.5" />
                            Acertos
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold text-foreground mb-1">
                            {correctAnswers}/{totalQuestions}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Questões
                        </div>
                    </div>
                </div>

                <div className="w-full bg-muted/30 rounded-full h-2 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${accuracy}%` }}
                        transition={{ delay: 0.5, duration: 1 }}
                        className="h-full bg-gradient-to-r from-green-500 to-primary rounded-full"
                    />
                </div>
            </motion.div>

            {/* Detalhes */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card/60 backdrop-blur-xl rounded-xl p-4 border border-white/10 mb-4"
            >
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2.5 bg-green-500/10 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2Icon className="w-4 h-4 text-green-400" />
                            <span className="text-xs font-medium text-foreground">Acertos</span>
                        </div>
                        <span className="text-base font-bold text-green-400">{correctAnswers}</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 bg-red-500/10 rounded-lg border border-red-500/30">
                        <div className="flex items-center gap-1.5">
                            <XCircleIcon className="w-4 h-4 text-red-400" />
                            <span className="text-xs font-medium text-foreground">Erros</span>
                        </div>
                        <span className="text-base font-bold text-red-400">{incorrectAnswers}</span>
                    </div>
                </div>
            </motion.div>

            {/* Ações */}
            <div className="flex gap-2">
                <button
                    onClick={onRestart}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-sm"
                >
                    Refazer
                </button>
                <button
                    onClick={onExit}
                    className="flex-1 py-2.5 bg-muted text-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors text-sm"
                >
                    Voltar
                </button>
            </div>
        </div>
    );
};
