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
    AlertTriangleIcon,
    UploadIcon,
    GiftIcon,
    PlusIcon,
    SparklesIcon,
    LockIcon,
    ChevronDownIcon,
    LoaderIcon
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
    onDelete?: () => void;
    color: string;
    showDeleteButton?: boolean;
}> = ({ title, cardCount, dueCount, icon, onSelect, onDeleteAll, onDelete, color, showDeleteButton = false }) => {
    const [showMenu, setShowMenu] = useState(false);

    const handleDeleteAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (cardCount !== undefined && confirm(`Tem certeza que deseja excluir todos os ${cardCount} flashcards de "${title}"?\n\nEsta ação não pode ser desfeita.`)) {
            onDeleteAll?.();
        }
        setShowMenu(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Tem certeza que deseja excluir a disciplina "${title}" e todos os seus flashcards?\n\nEsta ação não pode ser desfeita.`)) {
            onDelete?.();
        }
        setShowMenu(false);
    };

    return (
        <div
            onClick={onSelect}
            className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-all hover:scale-105 relative group"
        >
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg bg-white/10 w-min ${color}`}>{icon}</div>
                    {showDeleteButton && (
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                className={`p-1 hover:bg-white/10 rounded transition-all duration-200 ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                            >
                                <EllipsisIcon className="w-5 h-5 text-muted-foreground" />
                            </button>
                            {showMenu && (
                                <div className="absolute right-0 top-8 bg-card border border-border rounded-lg shadow-xl z-20 min-w-[200px] overflow-hidden">
                                    {onDeleteAll && cardCount !== undefined && cardCount > 0 && (
                                        <button
                                            onClick={handleDeleteAll}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground/80 hover:text-foreground border-b border-border/50"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                            Excluir Flashcards
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={handleDelete}
                                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-500/10 flex items-center gap-2 text-red-500 hover:text-red-600"
                                        >
                                            <XIcon className="w-4 h-4" />
                                            Excluir Disciplina
                                        </button>
                                    )}
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

// ... (DefaultDecksSection omitted as it is unchanged)

// --- Main Views ---





// --- Default Decks Section ---
interface DefaultDeck {
    id: string;
    nome: string;
    descricao: string | null;
    categoria: string | null;
    count: number;
}

const DefaultDecksSection: React.FC<{
    disciplinas: Disciplina[];
    onImportSuccess: () => void;
    isOpen: boolean;
    onClose: () => void;
}> = ({ disciplinas, onImportSuccess, isOpen, onClose }) => {
    const [decks, setDecks] = useState<DefaultDeck[]>([]);
    const [loading, setLoading] = useState(true);
    const [importingDeckId, setImportingDeckId] = useState<string | null>(null);
    const [showImportModal, setShowImportModal] = useState<DefaultDeck | null>(null);
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>('');
    const [newDisciplinaName, setNewDisciplinaName] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');
    const { addFlashcards } = useFlashcardsStore();
    const { addDisciplina, addTopico } = useDisciplinasStore();
    const { planType } = useSubscriptionStore();
    const isPro = planType === 'pro' || planType === 'premium';

    useEffect(() => {
        if (isOpen) {
            fetchDefaultDecks();
        }
    }, [isOpen]);

    // Calcular decks filtrados
    const filteredDecks = useMemo(() => {
        if (!searchQuery.trim()) return decks;
        const query = searchQuery.toLowerCase();
        return decks.filter(deck =>
            deck.nome.toLowerCase().includes(query) ||
            (deck.categoria && deck.categoria.toLowerCase().includes(query))
        );
    }, [decks, searchQuery]);

    const fetchDefaultDecks = async () => {
        setLoading(true);
        try {
            const { data: decksData, error } = await (supabase
                .from('flashcard_decks_default') as any)
                .select('*')
                .eq('visivel', true)
                .order('nome');

            if (error) throw error;

            const decksWithCount = await Promise.all(
                (decksData || []).map(async (deck: any) => {
                    const { count } = await (supabase
                        .from('flashcards_default') as any)
                        .select('*', { count: 'exact', head: true })
                        .eq('deck_id', deck.id);
                    return { ...deck, count: count || 0 };
                })
            );

            setDecks(decksWithCount);
        } catch (error) {
            console.error('Error fetching default decks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (deck: DefaultDeck, disciplinaId: string, newName?: string) => {
        setImportingDeckId(deck.id);

        try {
            let targetDisciplinaId = disciplinaId;
            let targetTopicoId: string | null = null;

            if (disciplinaId === 'new' && newName) {
                const newDisciplina = await addDisciplina({ nome: newName || deck.nome, topicos: [], is_deck_only: true } as any);
                if (newDisciplina) {
                    targetDisciplinaId = newDisciplina.id;
                    if (newDisciplina.topicos && newDisciplina.topicos.length > 0) {
                        targetTopicoId = newDisciplina.topicos[0].id;
                    } else {
                        const novoTopico = await addTopico(newDisciplina.id, {
                            titulo: 'Geral',
                            concluido: false,
                            nivelDificuldade: 'desconhecido',
                            ultimaRevisao: null,
                            proximaRevisao: null
                        });
                        targetTopicoId = novoTopico.id;
                    }
                } else {
                    throw new Error('Erro ao criar disciplina');
                }
            } else {
                const disc = disciplinas.find(d => d.id === disciplinaId);
                if (disc && disc.topicos.length > 0) {
                    targetTopicoId = disc.topicos[0].id;
                } else if (disc) {
                    const novoTopico = await addTopico(disc.id, {
                        titulo: 'Geral',
                        concluido: false,
                        nivelDificuldade: 'desconhecido',
                        ultimaRevisao: null,
                        proximaRevisao: null
                    });
                    targetTopicoId = novoTopico.id;
                }
            }

            if (!targetTopicoId) {
                toast.error('Disciplina não possui tópicos. Adicione um tópico primeiro.');
                return;
            }

            const { data: flashcardsData, error } = await (supabase
                .from('flashcards_default') as any)
                .select('*')
                .eq('deck_id', deck.id)
                .order('ordem');

            if (error) throw error;

            if (!flashcardsData || flashcardsData.length === 0) {
                toast.error('Deck não possui flashcards.');
                return;
            }

            const cardsToAdd = flashcardsData.map((fc: any) => ({
                pergunta: fc.pergunta,
                resposta: fc.resposta,
                tags: fc.tags || [],
                is_default: true,
            }));

            await addFlashcards(cardsToAdd, targetTopicoId);

            toast.success(`${cardsToAdd.length} flashcards importados!`);
            setShowImportModal(null);
            onImportSuccess();
        } catch (error: any) {
            console.error('Error importing deck:', error);
            toast.error(`Erro ao importar: ${error.message}`);
        } finally {
            setImportingDeckId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            {/* Matches CriarFlashcardModal style: bg-card, border-border, shadow-2xl */}
            <div className="bg-card border border-border rounded-xl max-w-5xl w-full shadow-2xl h-[85vh] relative overflow-hidden">
                <div className="absolute inset-0 overflow-y-auto">

                    {/* Header */}
                    <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-card/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex-1 w-full sm:w-auto">
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <span className="p-1.5 bg-purple-600/10 rounded-lg text-purple-500">
                                        <GiftIcon className="w-5 h-5" />
                                    </span>
                                    Decks Prontos
                                </h2>
                                {!isPro && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border uppercase tracking-wider">
                                        Pro
                                    </span>
                                )}
                            </div>
                            <p className="text-muted-foreground text-sm">
                                Conteúdos curados por especialistas.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64 md:w-80">
                            {/* Ícone de busca absoluto dentro do input */}
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                {/* SVG de Lupa simples */}
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar decks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full h-10 pl-9 pr-4 rounded-lg bg-muted/50 border border-border text-sm focus:bg-background focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none placeholder:text-muted-foreground/70"
                            />
                        </div>

                        <button
                            onClick={onClose}
                            className="hidden sm:flex p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>

                        {/* Mobile close button positioned absolute if needed, or simply part of flex */}
                        <button
                            onClick={onClose}
                            className="sm:hidden absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground"
                        >
                            <XIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 bg-background relative">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="animate-pulse">Carregando biblioteca...</p>
                            </div>
                        ) : decks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <TrophyIcon className="w-12 h-12 mb-4 opacity-20" />
                                <p>Nenhum deck disponível no momento.</p>
                            </div>
                        ) : filteredDecks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <div className="opacity-20 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="11" cy="11" r="8"></circle>
                                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                    </svg>
                                </div>
                                <p>Nenhum resultado para "{searchQuery}"</p>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 ${!isPro ? 'opacity-30 pointer-events-none select-none filter blur-[1px]' : ''}`}>
                                {filteredDecks.map((deck) => (
                                    <div
                                        key={deck.id}
                                        className="group bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 relative overflow-hidden"
                                    >
                                        {/* Top colored line indicator */}
                                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="mb-6">
                                            <div className="flex justify-between items-start mb-3">
                                                <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full border border-primary/20">
                                                    {deck.count} cards
                                                </span>

                                            </div>

                                            <h3 className="font-bold text-lg text-foreground mb-2 leading-tight group-hover:text-primary transition-colors">
                                                {deck.nome}
                                            </h3>

                                            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                                                {deck.descricao || 'Sem descrição.'}
                                            </p>

                                            {deck.categoria && (
                                                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                    <LayersIcon className="w-3.5 h-3.5" />
                                                    {deck.categoria}
                                                </div>
                                            )}
                                        </div>

                                        {/* Botão com cor roxa/primary consistente */}
                                        <button
                                            onClick={() => setShowImportModal(deck)}
                                            disabled={importingDeckId === deck.id}
                                            className="w-full py-2.5 bg-muted/50 border border-border/50 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary rounded-lg transition-all font-medium text-sm flex items-center justify-center gap-2 group-hover:border-primary/30"
                                        >
                                            {importingDeckId === deck.id ? 'Importando...' : 'Importar Deck'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Locked State Overlay */}
                        {!isPro && !loading && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pb-20">
                                <div className="bg-card border border-border p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm text-center mx-4 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />

                                    <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-5">
                                        <LockIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                                    </div>

                                    <h3 className="text-xl font-bold text-foreground mb-2">Recurso Premium</h3>
                                    <p className="text-muted-foreground mb-6 text-sm leading-relaxed">
                                        Os Decks Prontos são exclusivos para assinantes Pro e Premium.
                                    </p>

                                    <a
                                        href="/planos"
                                        className="w-full py-2.5 px-6 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
                                        onClick={(e) => { e.preventDefault(); toast("Redirecionando para planos..."); }}
                                    >
                                        <SparklesIcon className="w-4 h-4" />
                                        Fazer Upgrade
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal de seleção de disciplina (aninhado) */}
                {showImportModal && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
                        <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl relative">
                            <button
                                onClick={() => {
                                    setShowImportModal(null);
                                    setSelectedDisciplinaId('');
                                    setNewDisciplinaName('');
                                }}
                                className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>

                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-foreground mb-1">
                                    Importar "{showImportModal.nome}"
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Selecione onde salvar os {showImportModal.count} flashcards
                                </p>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Destino</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDisciplinaId}
                                            onChange={(e) => setSelectedDisciplinaId(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="">Selecione uma disciplina...</option>
                                            {disciplinas.map((d) => (
                                                <option key={d.id} value={d.id}>{d.nome}</option>
                                            ))}
                                            <option value="new" className="font-bold border-t border-border text-primary">+ Criar nova disciplina</option>
                                        </select>
                                        <ChevronDownIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    </div>
                                </div>

                                {selectedDisciplinaId === 'new' && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Nome da Nova Disciplina</label>
                                        <input
                                            type="text"
                                            value={newDisciplinaName}
                                            onChange={(e) => setNewDisciplinaName(e.target.value)}
                                            placeholder={`Ex: ${showImportModal.nome}`}
                                            className="w-full px-4 py-2.5 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
                                            autoFocus
                                        />
                                    </div>
                                )}

                                <div className="bg-amber-100 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                                    <AlertTriangleIcon className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                                        Estes flashcards possuem direitos autorais e <strong className="text-amber-950">não poderão ser exportados</strong>.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            setShowImportModal(null);
                                            setSelectedDisciplinaId('');
                                            setNewDisciplinaName('');
                                        }}
                                        className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors font-medium text-sm text-foreground"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleImport(
                                            showImportModal,
                                            selectedDisciplinaId,
                                            newDisciplinaName
                                        )}
                                        disabled={!selectedDisciplinaId || (selectedDisciplinaId === 'new' && !newDisciplinaName.trim()) || importingDeckId !== null}
                                        className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
                                    >
                                        {importingDeckId ? (
                                            <>
                                                <LoaderIcon className="w-4 h-4 animate-spin" />
                                                Importando...
                                            </>
                                        ) : (
                                            <>
                                                Confirmar
                                                <CheckCircle2Icon className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main Views ---

const DeckSelectionView: React.FC<{ onSelectDeck: (session: StudySession) => void; onStartQuiz: () => void; onViewSavedQuizzes: () => void; onOpenDefaultDecks: () => void }> = ({ onSelectDeck, onStartQuiz, onViewSavedQuizzes, onOpenDefaultDecks }) => {
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    // FIX: Add removeDisciplina for handling deletions
    const { removeDisciplina } = useDisciplinasStore();
    const { flashcards, getDueFlashcards, fetchFlashcardsForTopics, loading, getAllTags, searchFlashcards, filterByTags, deleteAllFlashcards, loadFlashcardsContent } = useFlashcardsStore();
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

    const handleDeckSelection = async (session: StudySession) => {
        const cardsToLoad = session.deck.filter(c => !c._contentLoaded && !c.pergunta);

        if (cardsToLoad.length > 0) {
            const toastId = toast.loading("Carregando conteúdo dos flashcards...");
            try {
                const cardIds = cardsToLoad.map(c => c.id);
                await loadFlashcardsContent(cardIds);
                toast.dismiss(toastId);

                // Obter cards atualizados da store
                // Precisamos acessar o estado atualizado da store
                // Como estamos dentro de um componente, podemos usar useFlashcardsStore.getState() se fosse fora, 
                // mas aqui flashcards pode não ter atualizado ainda no render cycle.
                // No entanto, loadFlashcardsContent é async e espera o set state.
                // Vamos usar uma referência direta à store ou confiar que o hook atualizará?
                // O hook vai atualizar, mas precisamos dos dados AGORA para passar para onSelectDeck.
                // A melhor forma é pegar o estado mais recente da store diretamente.
                const updatedStoreFlashcards = useFlashcardsStore.getState().flashcards;
                const updatedDeck = session.deck.map(c => updatedStoreFlashcards.find(fc => fc.id === c.id) || c);

                onSelectDeck({ ...session, deck: updatedDeck });
            } catch (error) {
                toast.dismiss(toastId);
                toast.error("Erro ao carregar conteúdo. Tente novamente.");
            }
        } else {
            onSelectDeck(session);
        }
    };

    // Check loading state AFTER all hooks have been called
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
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowImportExport(true)}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                    >
                        <UploadIcon className="w-4 h-4" />
                        Importar
                    </button>
                    <button
                        onClick={onOpenDefaultDecks}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium shadow-lg shadow-purple-900/20"
                    >
                        <GiftIcon className="w-4 h-4" />
                        Decks Prontos
                    </button>
                    <div className="flex bg-primary rounded-lg p-0.5">
                        <button
                            onClick={() => openCriarFlashcardModal({ mode: 'manual' })}
                            className="px-3 py-1.5 hover:bg-white/10 text-primary-foreground rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                            title="Criar Manualmente"
                        >
                            <PlusIcon className="w-4 h-4" />
                            Manual
                        </button>
                        <div className="w-px bg-white/20 my-1"></div>
                        <button
                            onClick={() => openCriarFlashcardModal({ mode: 'ai' })}
                            className="px-3 py-1.5 hover:bg-white/10 text-primary-foreground rounded-md transition-colors flex items-center gap-2 text-sm font-medium"
                            title="Criar com Inteligência Artificial"
                        >
                            <SparklesIcon className="w-4 h-4" />
                            IA
                        </button>
                    </div>
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
                            handleDeckSelection({ deck: dueFlashcards, name: 'Revisão', isReviewSession: true, totalCards: dueFlashcards.length });
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

                        const handleDeleteDisciplina = async () => {
                            await removeDisciplina(disciplina.id);
                            toast.success(`Disciplina "${disciplina.nome}" excluída.`);
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
                                onDelete={disciplina.is_deck_only ? handleDeleteDisciplina : undefined}
                                onSelect={() => {
                                    if (cardsInDeck.length > 0) {
                                        handleDeckSelection({ deck: cardsInDeck, name: disciplina.nome, isReviewSession: false, totalCards: cardsInDeck.length });
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

            {/* Decks Prontos para Importar (Modal) */}
            {/* Decks Prontos - Moved to Main FlashcardsPage */}
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
    const { flashcards, fetchFlashcardsForTopics } = useFlashcardsStore();
    const disciplinas = useDisciplinasStore(state => state.disciplinas);
    const [viewMode, setViewMode] = useState<'decks' | 'saved-quizzes'>('decks');
    const [showImportExport, setShowImportExport] = useState(false);
    const [showDefaultDecks, setShowDefaultDecks] = useState(false);

    const allTopicIds = useMemo(() => disciplinas.flatMap(d => d.topicos.map(t => t.id)), [disciplinas]);

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
                            onOpenDefaultDecks={() => setShowDefaultDecks(true)}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`.perspective-1000 { perspective: 1000px; } .transform-style-3d { transform-style: preserve-3d; } .rotate-y-180 { transform: rotateY(180deg); } .backface-hidden { backface-visibility: hidden; }`}</style>

            <DefaultDecksSection
                disciplinas={disciplinas}
                isOpen={showDefaultDecks}
                onClose={() => setShowDefaultDecks(false)}
                onImportSuccess={() => {
                    if (allTopicIds.length > 0) {
                        fetchFlashcardsForTopics(allTopicIds);
                    }
                }}
            />
        </div>
    );
};

export default FlashcardsPage;