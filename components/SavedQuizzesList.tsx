import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuizzesRepository } from '../stores/useQuizzesRepository';
import { useQuizStore } from '../stores/useQuizStore';
import { Quiz } from '../types';
import { TrophyIcon, Trash2Icon, SearchIcon, FilterIcon, PlayIcon, XIcon } from './icons';
import { toast } from './Sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useEditalStore } from '../stores/useEditalStore';

interface SavedQuizzesListProps {
    onStartQuiz: (quiz: Quiz) => void;
    onBack: () => void;
}

export const SavedQuizzesList: React.FC<SavedQuizzesListProps> = ({ onStartQuiz, onBack }) => {
    const { quizzes, loading, fetchQuizzes, deleteQuiz, searchQuizzes, filterByMode } = useQuizzesRepository();
    const { editalAtivo } = useEditalStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMode, setSelectedMode] = useState<'all' | 'standard' | 'true_false'>('all');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchQuizzes(editalAtivo?.id);
    }, [fetchQuizzes, editalAtivo?.id]);

    const filteredQuizzes = useMemo(() => {
        let result = quizzes;

        if (searchQuery) {
            result = searchQuizzes(searchQuery);
        }

        if (selectedMode !== 'all') {
            result = filterByMode(selectedMode);
        }

        return result;
    }, [quizzes, searchQuery, selectedMode, searchQuizzes, filterByMode]);

    const handleDelete = async (quiz: Quiz, e: React.MouseEvent) => {
        e.stopPropagation();

        if (confirm(`Tem certeza que deseja excluir o quiz "${quiz.title}"?\n\nEsta ação não pode ser desfeita.`)) {
            try {
                await deleteQuiz(quiz.id);
            } catch (error) {
                console.error('Error deleting quiz:', error);
            }
        }
    };

    const handleStartQuiz = (quiz: Quiz) => {
        onStartQuiz(quiz);
    };

    if (loading && quizzes.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                        />
                    </div>
                    <p className="text-muted-foreground">Carregando quizzes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 sm:px-0">
            {/* Header */}
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={onBack}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <XIcon className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Quizzes Salvos</h1>
                    </div>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Evolua seus estudos com questões geradas por IA.
                    </p>
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-10 px-4 flex items-center gap-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
                >
                    <FilterIcon className="w-4 h-4" />
                    Filtros
                </button>
            </header>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 space-y-4"
                    >
                        {/* Search */}
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por título ou descrição..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-10 pr-4 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        {/* Mode Filter */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelectedMode('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMode === 'all'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                Todos
                            </button>
                            <button
                                onClick={() => setSelectedMode('standard')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMode === 'standard'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                Múltipla Escolha
                            </button>
                            <button
                                onClick={() => setSelectedMode('true_false')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMode === 'true_false'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                Certo/Errado
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Quiz List */}
            {filteredQuizzes.length === 0 ? (
                <div className="text-center py-20">
                    <TrophyIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-xl font-bold text-foreground mb-2">
                        {searchQuery || selectedMode !== 'all' ? 'Nenhum quiz encontrado' : 'Nenhum quiz salvo ainda'}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                        {searchQuery || selectedMode !== 'all'
                            ? 'Tente ajustar os filtros de busca.'
                            : 'Crie seu primeiro quiz para começar!'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredQuizzes.map((quiz) => (
                        <motion.div
                            key={quiz.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:border-primary/50 transition-all cursor-pointer group relative"
                            onClick={() => handleStartQuiz(quiz)}
                        >
                            {/* Delete Button */}
                            <button
                                onClick={(e) => handleDelete(quiz, e)}
                                className="absolute top-3 right-3 p-2 rounded-lg bg-background/50 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2Icon className="w-4 h-4" />
                            </button>

                            {/* Quiz Icon */}
                            <div className="mb-4">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${quiz.mode === 'standard'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    <TrophyIcon className="w-6 h-6" />
                                </div>
                            </div>

                            {/* Quiz Info */}
                            <h3 className="font-bold text-foreground text-lg mb-2 pr-8">
                                {quiz.title}
                            </h3>

                            {quiz.description && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                    {quiz.description}
                                </p>
                            )}

                            {/* Metadata */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${quiz.mode === 'standard'
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-green-500/20 text-green-400'
                                    }`}>
                                    {quiz.mode === 'standard' ? 'Múltipla Escolha' : 'Certo/Errado'}
                                </span>
                                <span className="px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">
                                    {quiz.questions.length} questões
                                </span>
                            </div>

                            {/* Date */}
                            <p className="text-xs text-muted-foreground mb-4">
                                Criado em {format(new Date(quiz.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>

                            {/* Play Button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartQuiz(quiz);
                                }}
                                className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                            >
                                <PlayIcon className="w-4 h-4" />
                                Refazer Quiz
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
