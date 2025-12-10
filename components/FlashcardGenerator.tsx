// FlashcardGenerator component - generates flashcards by discipline
import React, { useState, useMemo, useEffect } from 'react';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { Flashcard } from '../types';
import { LoaderIcon, SparklesIcon, Trash2Icon, SaveIcon, CheckIcon, XIcon, UploadIcon } from './icons';

import { toast } from './Sonner';

interface FlashcardGeneratorProps {
    disciplinaId?: string;
    topicoId?: string;
    onSave: () => void;
    onCancel: () => void;
}

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
        selectedTopicoId: savedState?.selectedTopicoId || initialTopicoId || '',
    };

    const [mode, setMode] = useState<'topic' | 'text'>(initialState.mode);
    const [prompt, setPrompt] = useState(initialState.prompt);
    const [quantity, setQuantity] = useState(initialState.quantity);
    const [difficulty, setDifficulty] = useState(initialState.difficulty);
    const [generatedCards, setGeneratedCards] = useState<Partial<Flashcard>[]>(initialState.generatedCards);
    const [step, setStep] = useState<'input' | 'preview'>(initialState.step);
    const [selectedDisciplinaId, setSelectedDisciplinaId] = useState<string>(initialState.selectedDisciplinaId);
    const [selectedTopicoId, setSelectedTopicoId] = useState<string>(initialState.selectedTopicoId);
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
            selectedTopicoId,
            selectedCardIndices: Array.from(selectedCardIndices),
        });
    }, [mode, prompt, quantity, difficulty, generatedCards, step, selectedDisciplinaId, selectedTopicoId, selectedCardIndices, saveGeneratorState]);

    const topicosFiltrados = useMemo(() => {
        if (!selectedDisciplinaId) return [];
        const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
        return disciplina?.topicos || [];
    }, [selectedDisciplinaId, disciplinas]);

    const topicoSelecionado = useMemo(() => {
        return topicosFiltrados.find(t => t.id === selectedTopicoId);
    }, [selectedTopicoId, topicosFiltrados]);

    const handleGenerate = async () => {
        // Se tópico estiver selecionado e modo for 'topic', usa o nome do tópico como tema
        let temaParaGerar = prompt.trim();

        if (mode === 'topic') {
            if (selectedTopicoId && topicoSelecionado) {
                // Se tópico está selecionado, usa o nome do tópico como tema
                temaParaGerar = topicoSelecionado.titulo;
            } else if (!temaParaGerar) {
                toast.error('Por favor, selecione um tópico ou descreva sobre o que você quer estudar.');
                return;
            }
        } else {
            // Modo texto
            if (!temaParaGerar) {
                toast.error('Por favor, cole o texto para gerar os flashcards.');
                return;
            }
        }

        if (mode === 'topic' && temaParaGerar.length < 3) {
            toast.error('O tema deve ter pelo menos 3 caracteres.');
            return;
        }

        if (mode === 'text' && temaParaGerar.length < 50) {
            toast.error('O texto deve ter pelo menos 50 caracteres para gerar flashcards relevantes.');
            return;
        }

        try {
            const cards = await generateFlashcards(temaParaGerar, mode, { quantidade: quantity, dificuldade: difficulty });
            if (cards && cards.length > 0) {
                setGeneratedCards(cards);
                setStep('preview');
            } else {
                toast.error('Nenhum flashcard foi gerado. Tente novamente com um prompt diferente.');
            }
        } catch (error: any) {
            // O erro já foi tratado no store com toast, apenas logamos aqui
            console.error('Erro ao gerar flashcards:', error);
            // Não precisamos fazer nada aqui, o store já mostrou o erro ao usuário
        }
    };

    const handleSaveAll = async () => {
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
                toast.error('Por favor, selecione uma disciplina antes de salvar.');
                setStep('input');
                return;
            }

            if (!selectedTopicoId) {
                toast.error('Por favor, selecione um tópico antes de salvar.');
                setStep('input');
                return;
            }

            await addFlashcards(validCards, selectedTopicoId);

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
        } catch (error) {
            console.error('Erro ao salvar flashcards:', error);
            toast.error('Falha ao salvar flashcards.');
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
                                    onClick={removeSelectedCards}
                                    className="px-3 py-1.5 text-sm font-medium text-red-600 border border-red-600/30 rounded-md hover:bg-red-600/10 transition-colors flex items-center gap-2"
                                >
                                    <XIcon className="w-4 h-4" /> Excluir Selecionados
                                </button>
                                <button
                                    onClick={deselectAllCards}
                                    className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors"
                                >
                                    Desmarcar Todos
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={selectAllCards}
                                className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors"
                            >
                                Selecionar Todos
                            </button>
                        )}
                        <button onClick={() => setStep('input')} className="px-3 py-1.5 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-muted/50 transition-colors">
                            Voltar
                        </button>
                        <button
                            onClick={handleSaveAll}
                            className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <SaveIcon className="w-4 h-4" /> {hasSelection ? `Salvar ${selectedCount}` : 'Salvar Todos'}
                        </button>
                    </div>
                </div>

                {/* Seleção de disciplina e tópico na preview */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-lg">
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Disciplina *</label>
                        <select
                            value={selectedDisciplinaId}
                            onChange={e => {
                                setSelectedDisciplinaId(e.target.value);
                                setSelectedTopicoId(''); // Limpa tópico ao mudar disciplina
                            }}
                            className="w-full bg-input border border-border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">Selecione...</option>
                            {disciplinas.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Tópico *</label>
                        <select
                            value={selectedTopicoId}
                            onChange={e => setSelectedTopicoId(e.target.value)}
                            disabled={!selectedDisciplinaId || topicosFiltrados.length === 0}
                            className="w-full bg-input border border-border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Selecione...</option>
                            {topicosFiltrados.map(t => (
                                <option key={t.id} value={t.id}>{t.titulo}</option>
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
                    <span className="flex items-center justify-center gap-1.5">
                        Por Texto
                        {mode === 'text' && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Importar arquivo</span>}
                    </span>
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
                                setSelectedTopicoId(''); // Limpa tópico ao mudar disciplina
                            }}
                            className="w-full bg-input border border-border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none"
                        >
                            <option value="">Selecione...</option>
                            {disciplinas.map(d => (
                                <option key={d.id} value={d.id}>{d.nome}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-muted-foreground mb-1">Tópico (opcional)</label>
                        <select
                            value={selectedTopicoId}
                            onChange={e => setSelectedTopicoId(e.target.value)}
                            disabled={!selectedDisciplinaId || topicosFiltrados.length === 0}
                            className="w-full bg-input border border-border rounded-md p-2 text-sm text-foreground focus:ring-2 focus:ring-primary outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Selecione...</option>
                            {topicosFiltrados.map(t => (
                                <option key={t.id} value={t.id}>{t.titulo}</option>
                            ))}
                        </select>
                    </div>
                    <p className="col-span-2 text-xs text-muted-foreground">
                        💡 {selectedTopicoId && mode === 'topic'
                            ? `O tópico "${topicoSelecionado?.titulo}" será usado como tema. Você pode descrever um tema adicional se quiser.`
                            : 'Você pode selecionar a disciplina e tópico agora ou depois de gerar os flashcards'}
                    </p>
                </div>
                {mode === 'topic' ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                {selectedTopicoId ? 'Tema adicional (opcional)' : 'Sobre o que você quer estudar?'}
                            </label>
                            <input
                                placeholder={selectedTopicoId
                                    ? "Ex: Aspectos específicos, detalhes adicionais..."
                                    : "Ex: Revolução Francesa, Leis de Newton, Verbos em Inglês..."}
                                value={prompt}
                                onChange={e => setPrompt(e.target.value)}
                                className="w-full bg-input border border-border rounded-md p-2 text-foreground focus:ring-2 focus:ring-primary outline-none"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {selectedTopicoId
                                    ? `Se deixar vazio, será usado o tópico "${topicoSelecionado?.titulo}" como tema.`
                                    : 'Descreva o tema ou assunto que você quer estudar. Seja específico para melhores resultados.'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Quantidade</label>
                                <select value={quantity} onChange={e => setQuantity(Number(e.target.value))} className="w-full bg-input border border-border rounded-md p-2 text-foreground focus:ring-2 focus:ring-primary outline-none">
                                    <option value={3}>3 cards</option>
                                    <option value={5}>5 cards</option>
                                    <option value={10}>10 cards</option>
                                    <option value={15}>15 cards</option>
                                    <option value={20}>20 cards</option>
                                    <option value={30}>30 cards</option>
                                    <option value={50}>50 cards</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">Dificuldade</label>
                                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className="w-full bg-input border border-border rounded-md p-2 text-foreground focus:ring-2 focus:ring-primary outline-none">
                                    <option value="fácil">Fácil</option>
                                    <option value="médio">Médio</option>
                                    <option value="difícil">Difícil</option>
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
                <button onClick={onCancel} className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={handleGenerate}
                    disabled={generating || (mode === 'topic' && !selectedTopicoId && !prompt.trim()) || (mode === 'text' && (!prompt.trim() || prompt.trim().length < 50))}
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
