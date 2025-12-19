// FlashcardGenerator component - generates flashcards by discipline
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { Flashcard } from '../types';
import { LoaderIcon, SparklesIcon, Trash2Icon, SaveIcon, CheckIcon, XIcon, UploadIcon, ChevronDownIcon } from './icons';

import { toast } from './Sonner';

interface FlashcardGeneratorProps {
    disciplinaId?: string;
    topicoId?: string;
    onSave: () => void;
    onCancel: () => void;
}

// Simple MultiSelect Component
const MultiSelect: React.FC<{
    options: { id: string; label: string }[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    disabled?: boolean;
}> = ({ options, selectedIds, onChange, placeholder = "Selecione...", disabled = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(selectedId => selectedId !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const handleSelectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedIds.length === options.length) {
            onChange([]);
        } else {
            onChange(options.map(o => o.id));
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full bg-slate-900 border rounded-md px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-900/50' : 'border-slate-700 hover:border-violet-500'} ${isOpen ? 'ring-2 ring-violet-600 border-transparent' : ''}`}
            >
                <div className="truncate flex-1">
                    {selectedIds.length === 0 ? (
                        <span className="text-slate-400">{placeholder}</span>
                    ) : selectedIds.length === 1 ? (
                        <span className="text-slate-100">{options.find(o => o.id === selectedIds[0])?.label}</span>
                    ) : (
                        <span className="text-slate-100">{selectedIds.length} tópicos selecionados</span>
                    )}
                </div>
                <ChevronDownIcon className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-slate-900 border border-slate-700 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {options.length > 0 && (
                        <div
                            onClick={handleSelectAll}
                            className="px-3 py-2 text-xs font-semibold text-violet-400 cursor-pointer hover:bg-slate-800 border-b border-slate-800 sticky top-0 bg-slate-900 z-10 flex items-center gap-2"
                        >
                            <div className={`w-3 h-3 border rounded border-violet-500 flex items-center justify-center ${selectedIds.length === options.length ? 'bg-violet-500' : ''}`}>
                                {selectedIds.length === options.length && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                            </div>
                            {selectedIds.length === options.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                        </div>
                    )}
                    {options.map(option => {
                        const isSelected = selectedIds.includes(option.id);
                        return (
                            <div
                                key={option.id}
                                onClick={() => toggleOption(option.id)}
                                className="px-3 py-2 hover:bg-slate-800 cursor-pointer flex items-center gap-2 text-sm transition-colors border-b border-slate-800/50 last:border-0"
                            >
                                <div className={`w-4 h-4 border rounded flex items-center justify-center transition-colors flex-shrink-0 ${isSelected ? 'bg-violet-600 border-violet-600' : 'border-slate-600'}`}>
                                    {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                                </div>
                                <span className={isSelected ? 'text-slate-100 font-medium' : 'text-slate-400'}>
                                    {option.label}
                                </span>
                            </div>
                        );
                    })}
                    {options.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-slate-500">
                            Nenhum tópico disponível
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export function FlashcardGenerator({ disciplinaId: initialDisciplinaId, topicoId: initialTopicoId, onSave, onCancel }: FlashcardGeneratorProps) {
    const { generateFlashcards, addFlashcards, generating, generatorState, saveGeneratorState, clearGeneratorState } = useFlashcardsStore();
    const { disciplinas } = useDisciplinasStore();

    // Restaurar estado salvo ou usar valores iniciais
    // Props iniciais só são usadas se não houver estado salvo
    const savedState = generatorState;
    const initialState = {
        mode: (savedState?.mode || 'topic') as 'topic' | 'text',
        prompt: savedState?.prompt || '',
        quantity: savedState?.quantity || 5,
        difficulty: savedState?.difficulty || 'médio',
        generatedCards: savedState?.generatedCards || [],
        step: (savedState?.step || 'input') as 'input' | 'preview',
        // Se houver estado salvo, usa ele; senão, usa as props iniciais
        selectedDisciplinaId: savedState?.selectedDisciplinaId || initialDisciplinaId || '',
        selectedSourceTopicIds: savedState?.selectedSourceTopicIds || (initialTopicoId ? [initialTopicoId] : []),
    };

    const [mode, setMode] = useState<'topic' | 'text'>(initialState.mode);
    const [prompt, setPrompt] = useState(initialState.prompt);
    const [quantity, setQuantity] = useState(initialState.quantity);
    const [difficulty, setDifficulty] = useState(initialState.difficulty);
    const [generatedCards, setGeneratedCards] = useState<Partial<Flashcard>[]>(initialState.generatedCards);
    const [step, setStep] = useState<'input' | 'preview'>(initialState.step);
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>(initialState.selectedDisciplinaId);

    // Multi-select state for inputs
    const [selectedSourceTopicIds, setSelectedSourceTopicIds] = useState<string[]>(initialState.selectedSourceTopicIds);

    // Single select state for saving
    // Initialize with the first selected source topic if available, or empty
    const [targetTopicoId, setTargetTopicoId] = useState<string>(
        (selectedSourceTopicIds.length > 0 ? selectedSourceTopicIds[0] : '')
    );

    const [selectedCardIndices, setSelectedCardIndices] = useState<Set<number>>(
        new Set(savedState?.selectedCardIndices || [])
    );

    // Salvar estado sempre que houver mudanças
    useEffect(() => {
        saveGeneratorState({
            mode,
            prompt,
            quantity,
            difficulty,
            generatedCards,
            step,
            selectedDisciplinaId,
            selectedSourceTopicIds,
            selectedCardIndices: Array.from(selectedCardIndices),
        });
    }, [mode, prompt, quantity, difficulty, generatedCards, step, selectedDisciplinaId, selectedSourceTopicIds, selectedCardIndices, saveGeneratorState]);

    const topicosFiltrados = useMemo(() => {
        if (!selectedDisciplinaId) return [];
        const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
        const topicos = disciplina?.topicos || [];

        // Ordenar tópicos por número no início do título (ex: "1.", "2.", "10.")
        return [...topicos].sort((a, b) => {
            // Extrai o número do início do título
            const numA = parseInt(a.titulo.match(/^(\d+)/)?.[1] || '0', 10);
            const numB = parseInt(b.titulo.match(/^(\d+)/)?.[1] || '0', 10);

            // Se ambos têm número, ordena por número
            if (numA && numB) return numA - numB;
            // Se apenas um tem número, quem tem número vem primeiro
            if (numA) return -1;
            if (numB) return 1;
            // Se nenhum tem número, ordena alfabeticamente
            return a.titulo.localeCompare(b.titulo, 'pt-BR');
        });
    }, [selectedDisciplinaId, disciplinas]);

    // Quando mudamos para o passo de preview, garantimos que temos um target definido
    useEffect(() => {
        if (step === 'preview' && !targetTopicoId && selectedSourceTopicIds.length > 0) {
            setTargetTopicoId(selectedSourceTopicIds[0]);
        }
    }, [step, selectedSourceTopicIds, targetTopicoId]);

    const handleGenerate = async () => {
        console.log('[FlashcardGenerator] handleGenerate iniciado');
        console.log('[FlashcardGenerator] Estado:', { mode, promptLength: prompt.length, quantity, difficulty, selectedDisciplinaId, selectedSourceTopicIds });

        let temaParaGerar = prompt.trim();

        if (mode === 'topic') {
            // Check if we have selected topics
            if (selectedSourceTopicIds.length > 0) {
                // Get titles of selected topics
                const selectedTopics = topicosFiltrados.filter(t => selectedSourceTopicIds.includes(t.id));
                const topicTitles = selectedTopics.map(t => t.titulo).join(', ');

                if (selectedTopics.length > 0) {
                    // Combine topic titles
                    temaParaGerar = `Tópicos: ${topicTitles}`;
                    if (prompt.trim()) {
                        temaParaGerar += `. Contexto adicional: ${prompt.trim()}`;
                    }
                } else {
                    // Selected IDs don't match current topics (maybe switched discipline?)
                    console.warn('[FlashcardGenerator] Tópicos selecionados não encontrados na lista atual.');
                    // Check if prompt is enough
                    if (!temaParaGerar) {
                        toast.error('Tópicos selecionados inválidos. Por favor, selecione os tópicos novamente.');
                        return;
                    }
                }
            } else if (!temaParaGerar) {
                console.warn('[FlashcardGenerator] Nenhum tópico ou texto selecionado');
                toast.error('Por favor, selecione pelo menos um tópico ou descreva sobre o que você quer estudar.');
                return;
            }
        } else {
            // Modo texto: precisa de texto
            if (!temaParaGerar) {
                console.warn('[FlashcardGenerator] Texto vazio');
                toast.error('Por favor, cole o texto para gerar os flashcards.');
                return;
            }
        }

        if (mode === 'topic' && temaParaGerar.length < 3) {
            toast.error('O tema deve ter pelo menos 3 caracteres.');
            return;
        }

        if (mode === 'text' && temaParaGerar.length < 50) {
            console.warn('[FlashcardGenerator] Texto muito curto:', temaParaGerar.length);
            toast.error('O texto deve ter pelo menos 50 caracteres para gerar flashcards relevantes.');
            return;
        }

        try {
            console.log('[FlashcardGenerator] Chamando generateFlashcards com tema:', temaParaGerar);
            const cards = await generateFlashcards(temaParaGerar, mode, { quantidade: quantity, dificuldade: difficulty });
            console.log('[FlashcardGenerator] Resultado:', cards);
            if (cards && cards.length > 0) {
                setGeneratedCards(cards);
                setStep('preview');
                // Set default target topic if not set
                if (!targetTopicoId && selectedSourceTopicIds.length > 0) {
                    setTargetTopicoId(selectedSourceTopicIds[0]);
                }
            } else {
                toast.error('Nenhum flashcard foi gerado. Tente novamente com um prompt diferente.');
            }
        } catch (error: any) {
            console.error('[FlashcardGenerator] Erro ao gerar flashcards:', error);
            // O store já lança toast, mas vamos garantir caso o error venha de outro lugar
            const msg = error?.message || JSON.stringify(error) || 'Erro desconhecido';
        }
    };

    const handleSaveAll = async () => {
        console.log('[FlashcardGenerator] handleSaveAll chamado');
        console.log('[FlashcardGenerator] selectedDisciplinaId:', selectedDisciplinaId);
        console.log('[FlashcardGenerator] targetTopicoId:', targetTopicoId); // Using target for saving
        console.log('[FlashcardGenerator] generatedCards.length:', generatedCards.length);

        try {
            // Se houver cards selecionados, salvar apenas eles; senão, salvar todos
            const cardsToSave = selectedCardIndices.size > 0
                ? generatedCards.filter((_, i) => selectedCardIndices.has(i))
                : generatedCards;

            const validCards = cardsToSave.filter(c => c.pergunta && c.resposta) as Omit<Flashcard, 'id' | 'topico_id' | 'interval' | 'easeFactor' | 'dueDate'>[];

            if (validCards.length === 0) {
                toast.error('Nenhum card válido para salvar.');
                return;
            }

            // Validação de disciplina e tópico (ambos obrigatórios para salvar)
            if (!selectedDisciplinaId) {
                console.warn('[FlashcardGenerator] selectedDisciplinaId está vazio!');
                // Volta para a tela de input para selecionar disciplina
                // setStep('input'); // Don't allow going back, force selection here
                toast.error('Selecione uma disciplina.');
                return;
            }

            if (!targetTopicoId) {
                console.warn('[FlashcardGenerator] targetTopicoId está vazio!');
                toast.error('Selecione um tópico para salvar os flashcards.');
                return;
            }

            console.log('[FlashcardGenerator] Chamando addFlashcards com topicoId:', targetTopicoId);
            await addFlashcards(validCards, targetTopicoId);

            // Remover os cards salvos da lista
            if (selectedCardIndices.size > 0) {
                const indicesToRemove = Array.from(selectedCardIndices).sort((a: number, b: number) => b - a);
                indicesToRemove.forEach((index: number) => {
                    setGeneratedCards(prev => prev.filter((_, i) => i !== index));
                });
                setSelectedCardIndices(new Set<number>());
            } else {
                // Se salvou todos, limpar tudo
                setGeneratedCards([]);
                clearGeneratorState();
            }

            toast.success(`${validCards.length} flashcard${validCards.length > 1 ? 's' : ''} salvo${validCards.length > 1 ? 's' : ''} com sucesso!`);

            // Se não sobrou nenhum card, fechar
            if (generatedCards.length - validCards.length === 0) {
                clearGeneratorState();
                onSave();
            }
        } catch (error: any) {
            console.error('Erro ao salvar flashcards:', error);
        }
    };

    const removeCard = (index: number) => {
        setGeneratedCards(prev => prev.filter((_, i) => i !== index));
        setSelectedCardIndices(prev => {
            const newSet = new Set<number>(prev);
            newSet.delete(index);
            // Ajustar índices após remoção
            const adjusted = new Set<number>();
            newSet.forEach((idx: number) => {
                if (idx > index) {
                    adjusted.add(idx - 1);
                } else if (idx < index) {
                    adjusted.add(idx);
                }
            });
            return adjusted;
        });
    };

    const toggleCardSelection = (index: number) => {
        setSelectedCardIndices(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const removeSelectedCards = () => {
        const indicesToRemove = Array.from(selectedCardIndices).sort((a: number, b: number) => b - a); // Ordenar do maior para o menor
        indicesToRemove.forEach((index: number) => {
            removeCard(index);
        });
        setSelectedCardIndices(new Set<number>());
    };

    const selectAllCards = () => {
        setSelectedCardIndices(new Set(generatedCards.map((_, i) => i)));
    };

    const deselectAllCards = () => {
        setSelectedCardIndices(new Set());
    };

    const updateCard = (index: number, field: 'pergunta' | 'resposta', value: string) => {
        setGeneratedCards(prev =>
            prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
        );
    };

    if (step === 'preview') {
        const selectedCount = selectedCardIndices.size;
        const hasSelection = selectedCount > 0;

        return (
            <div className="flex flex-col space-y-4 min-h-0">
                {/* Header com ações */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-primary" />
                        Flashcards Gerados ({generatedCards.length})
                        {hasSelection && (
                            <span className="text-sm font-normal text-primary">
                                ({selectedCount} selecionado{selectedCount > 1 ? 's' : ''})
                            </span>
                        )}
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        {hasSelection ? (
                            <>
                                <button
                                    type="button"
                                    onClick={removeSelectedCards}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600/30 rounded-md hover:bg-red-600/10 transition-colors flex items-center gap-2"
                                >
                                    <XIcon className="w-4 h-4" /> Excluir Selecionados
                                </button>
                                <button
                                    type="button"
                                    onClick={deselectAllCards}
                                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors"
                                >
                                    Desmarcar Todos
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={selectAllCards}
                                className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors"
                            >
                                Selecionar Todos
                            </button>
                        )}
                        <button type="button" onClick={() => setStep('input')} className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors">
                            Voltar
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAll}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <SaveIcon className="w-4 h-4" /> {hasSelection ? `Salvar ${selectedCount}` : 'Salvar Todos'}
                        </button>
                    </div>
                </div>

                {/* Seleção de disciplina e tópico (ALVO) na preview */}
                <div className={`grid grid-cols-2 gap-4 p-4 border rounded-lg ${!selectedDisciplinaId || !targetTopicoId ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-muted/30 border-border'}`}>
                    {(!selectedDisciplinaId || !targetTopicoId) && (
                        <div className="col-span-2 text-sm text-yellow-600 dark:text-yellow-400 font-medium flex items-center gap-2 mb-2">
                            ⚠️ Selecione onde salvar os flashcards
                        </div>
                    )}
                    <div>
                        <label className={`block text-xs mb-1 ${!selectedDisciplinaId ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-muted-foreground'}`}>
                            Disciplina Alvo
                        </label>
                        <select
                            value={selectedDisciplinaId}
                            onChange={e => {
                                setSelectedDisciplinaId(e.target.value);
                                setTargetTopicoId(''); // Limpa tópico ao mudar disciplina
                                // Limpa input sources se mudar disciplina, opcional, mas seguro
                                setSelectedSourceTopicIds([]);
                            }}
                            className={`w-full bg-input border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none ${!selectedDisciplinaId ? 'border-yellow-500' : 'border-border'}`}
                        >
                            <option value="">Selecione...</option>
                            {disciplinas.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={`block text-xs mb-1 ${selectedDisciplinaId && !targetTopicoId ? 'text-yellow-600 dark:text-yellow-400 font-medium' : 'text-muted-foreground'}`}>
                            Tópico Alvo
                        </label>
                        <select
                            value={targetTopicoId}
                            onChange={e => {
                                console.log('[FlashcardGenerator] Tópico Alvo selecionado:', e.target.value);
                                setTargetTopicoId(e.target.value);
                            }}
                            disabled={!selectedDisciplinaId || topicosFiltrados.length === 0}
                            className={`w-full bg-input border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed max-w-full ${selectedDisciplinaId && !targetTopicoId ? 'border-yellow-500' : 'border-border'}`}
                            style={{ maxWidth: '100%' }}
                        >
                            <option value="">Selecione...</option>
                            {topicosFiltrados.map(t => (
                                <option key={t.id} value={t.id} title={t.titulo}>
                                    {t.titulo.length > 60 ? `${t.titulo.substring(0, 60)}...` : t.titulo}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Grid de flashcards - com scroll para muitos cards */}
                <div className="flex-1 min-h-0 overflow-y-auto max-h-[40vh]">
                    <div className="grid grid-cols-1 gap-3 pr-1">
                        {generatedCards.map((card, index) => {
                            const isSelected = selectedCardIndices.has(index);
                            return (
                                <div
                                    key={index}
                                    className={`bg-card border-2 rounded-lg p-3 transition-all ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:border-primary/50'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Checkbox de seleção */}
                                        <button
                                            onClick={() => toggleCardSelection(index)}
                                            className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected
                                                ? 'bg-primary border-primary'
                                                : 'border-muted-foreground/30 hover:border-primary/50'
                                                }`}
                                        >
                                            {isSelected && (
                                                <CheckIcon className="w-3 h-3 text-primary-foreground" />
                                            )}
                                        </button>

                                        {/* Conteúdo do card */}
                                        <div className="flex-1 min-w-0 space-y-2">
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Pergunta</label>
                                                <div className="bg-input border border-border rounded-md p-2 text-sm text-foreground min-h-[50px] max-h-[100px] overflow-y-auto">
                                                    {card.pergunta || <span className="text-muted-foreground/50">Sem pergunta</span>}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-muted-foreground mb-1 block">Resposta</label>
                                                <div className="bg-input border border-border rounded-md p-2 text-sm text-foreground min-h-[50px] max-h-[100px] overflow-y-auto">
                                                    {card.resposta || <span className="text-muted-foreground/50">Sem resposta</span>}
                                                </div>
                                            </div>
                                            {card.tags && card.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {card.tags.map((tag, i) => (
                                                        <span key={i} className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Botão de excluir individual */}
                                        <button
                                            onClick={() => removeCard(index)}
                                            className="mt-1 p-1.5 text-muted-foreground hover:text-red-500 transition-colors rounded hover:bg-red-500/10 flex-shrink-0"
                                            title="Excluir este flashcard"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {generatedCards.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                        Todos os cards foram removidos. Volte para gerar novamente.
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-4 border-b border-border pb-4">
                <button onClick={() => setMode('topic')} className={`flex-1 pb-2 text-sm font-medium transition-colors relative ${mode === 'topic' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    Por Tópico
                    {mode === 'topic' && <span className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-primary" />}
                </button>
                <button onClick={() => setMode('text')} className={`flex-1 pb-2 text-sm font-medium transition-colors relative ${mode === 'text' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                    Por Texto
                    {mode === 'text' && <span className="absolute bottom-[-17px] left-0 w-full h-0.5 bg-primary" />}
                </button>
            </div>
            <div className="space-y-4">
                {/* Seleção de disciplina e tópico (opcional na etapa de input) */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-lg">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Disciplina (opcional)</label>
                        <select
                            value={selectedDisciplinaId}
                            onChange={e => {
                                setSelectedDisciplinaId(e.target.value);
                                setSelectedSourceTopicIds([]); // Limpa tópicos ao mudar disciplina
                                setTargetTopicoId('');
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-100 focus:ring-2 focus:ring-violet-600 outline-none"
                        >
                            <option value="" className="bg-slate-900 text-slate-400">Selecione...</option>
                            {disciplinas.map(d => (
                                <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">{d.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Tópicos (opcional)</label>
                        <MultiSelect
                            options={topicosFiltrados.map(t => ({ id: t.id, label: t.titulo }))}
                            selectedIds={selectedSourceTopicIds}
                            onChange={setSelectedSourceTopicIds}
                            disabled={!selectedDisciplinaId || topicosFiltrados.length === 0}
                            placeholder="Selecione..."
                        />
                    </div>
                    <p className="col-span-2 text-xs text-muted-foreground">
                        💡 {selectedSourceTopicIds.length > 0 && mode === 'topic'
                            ? `Os ${selectedSourceTopicIds.length} tópicos selecionados serão usados como base. Você pode adicionar mais contexto abaixo.`
                            : 'Você pode selecionar a disciplina e os tópicos agora ou depois de gerar os flashcards'}
                    </p>
                </div>
                {mode === 'topic' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {selectedSourceTopicIds.length > 0 ? 'Contexto adicional (opcional)' : 'Sobre o que você quer estudar?'}
                            </label>
                            <input
                                placeholder={selectedSourceTopicIds.length > 0
                                    ? "Ex: Focar apenas na parte legislativa, ou em exemplos práticos..."
                                    : "Ex: Revolução Francesa, Leis de Newton, Verbos em Inglês..."}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-input border border-border rounded-md p-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {selectedSourceTopicIds.length > 0
                                    ? 'A IA usará os títulos dos tópicos selecionados + o contexto acima.'
                                    : 'Descreva o tema ou assunto que você quer estudar. Seja específico para melhores resultados.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Quantidade</label>
                                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-violet-600 outline-none">
                                    <option value={3} className="bg-slate-900">3 cards</option>
                                    <option value={5} className="bg-slate-900">5 cards</option>
                                    <option value={10} className="bg-slate-900">10 cards</option>
                                    <option value={15} className="bg-slate-900">15 cards</option>
                                    <option value={20} className="bg-slate-900">20 cards</option>
                                    <option value={30} className="bg-slate-900">30 cards</option>
                                    <option value={50} className="bg-slate-900">50 cards</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Dificuldade</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-100 focus:ring-2 focus:ring-violet-600 outline-none">
                                    <option value="fácil" className="bg-slate-900">Fácil</option>
                                    <option value="médio" className="bg-slate-900">Médio</option>
                                    <option value="difícil" className="bg-slate-900">Difícil</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-foreground">Cole o texto para gerar flashcards</label>
                            </div>
                            <textarea
                                placeholder="Cole aqui um parágrafo, resumo, anotação ou conteúdo de estudo. Mínimo 50 caracteres.

Exemplos de uso:
• Cole um resumo de aula
• Cole um trecho de livro ou artigo
• Cole suas anotações pessoais"
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-input border border-border rounded-md p-3 text-foreground focus:ring-2 focus:ring-primary outline-none min-h-[200px] font-mono text-sm leading-relaxed"
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-muted-foreground">
                                    A IA irá identificar os conceitos chave e criar perguntas baseadas exclusivamente no texto fornecido.
                                </p>
                                {prompt.length > 0 && (
                                    <span className={`text-xs font-medium ${prompt.length < 50 ? 'text-yellow-600 dark:text-yellow-500' : 'text-green-600 dark:text-green-500'}`}>
                                        {prompt.length} caractere{prompt.length !== 1 ? 's' : ''}
                                        {prompt.length < 50 && ` (mínimo 50)`}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Quantidade aproximada</label>
                                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-input border border-border rounded-md p-2 text-foreground focus:ring-2 focus:ring-primary outline-none">
                                    <option value={3}>~3 cards</option>
                                    <option value={5}>~5 cards</option>
                                    <option value={10}>~10 cards</option>
                                    <option value={15}>~15 cards</option>
                                    <option value={20}>~20 cards</option>
                                    <option value={30}>~30 cards</option>
                                    <option value={50}>~50 cards</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Dica</label>
                                <div className="w-full bg-muted/30 border border-border rounded-md p-2 text-xs text-muted-foreground">
                                    💡 Textos maiores geram mais flashcards relevantes
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="pt-4 flex gap-3">
                <button type="button" onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={() => {
                        console.log('[FlashcardGenerator] Botão clicado. Disabled?', generating || (mode === 'topic' && selectedSourceTopicIds.length === 0 && !prompt.trim()) || (mode === 'text' && (!prompt.trim() || prompt.trim().length < 50)));
                        handleGenerate();
                    }}
                    disabled={generating || (mode === 'topic' && selectedSourceTopicIds.length === 0 && !prompt.trim()) || (mode === 'text' && (!prompt.trim() || prompt.trim().length < 50))}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? (
                        <>
                            <LoaderIcon className="w-4 h-4 animate-spin" /> Gerando...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-4 h-4" /> Gerar com IA
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
