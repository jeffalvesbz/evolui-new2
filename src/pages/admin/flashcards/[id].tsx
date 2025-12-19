import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { ArrowLeftIcon, PlusIcon, Trash2Icon, UploadIcon, EditIcon, SaveIcon, XIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { toast } from '../../../../components/Sonner';
import { importFlashcardsFromCSV, validateCsvFormat } from '../../../../services/flashcardCsvService';
import type { Database } from '../../../../types/supabase';

type FlashcardDeckDefault = Database['public']['Tables']['flashcard_decks_default']['Row'];
type FlashcardDefault = Database['public']['Tables']['flashcards_default']['Row'];

const AdminFlashcardsEdit: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [deck, setDeck] = useState<FlashcardDeckDefault | null>(null);
    const [flashcards, setFlashcards] = useState<FlashcardDefault[]>([]);
    const [loading, setLoading] = useState(true);
    const [importing, setImporting] = useState(false);

    // Form states
    const [editingCard, setEditingCard] = useState<string | null>(null);
    const [newCard, setNewCard] = useState({ pergunta: '', resposta: '' });
    const [showNewForm, setShowNewForm] = useState(false);

    useEffect(() => {
        if (id) fetchDeckAndFlashcards();
    }, [id]);

    const fetchDeckAndFlashcards = async () => {
        setLoading(true);

        // Buscar deck
        const { data: deckData, error: deckError } = await (supabase
            .from('flashcard_decks_default') as any)
            .select('*')
            .eq('id', id)
            .single();

        if (deckError || !deckData) {
            console.error('Error fetching deck:', deckError);
            toast.error('Deck não encontrado');
            navigate('/admin/flashcards');
            return;
        }

        setDeck(deckData);

        // Buscar flashcards
        const { data: cardsData, error: cardsError } = await (supabase
            .from('flashcards_default') as any)
            .select('*')
            .eq('deck_id', id)
            .order('ordem', { ascending: true });

        if (cardsError) {
            console.error('Error fetching flashcards:', cardsError);
        } else {
            setFlashcards(cardsData || []);
        }

        setLoading(false);
    };

    const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !id) return;

        setImporting(true);

        try {
            const text = await file.text();
            const cleanText = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

            // Tentar importar
            let cards: { pergunta: string; resposta: string; tags: string[] }[] = [];

            // Tentar Anki primeiro
            try {
                const { importAnkiFile, extractAutoTags } = await import('../../../../services/ankiImportService');
                const ankiResult = importAnkiFile(cleanText);
                if (ankiResult.cards.length > 0) {
                    cards = ankiResult.cards.map(card => ({
                        pergunta: card.pergunta,
                        resposta: card.resposta,
                        tags: extractAutoTags(card.pergunta, card.resposta)
                    }));
                }
            } catch (ankiError) {
                console.log('Anki parser failed:', ankiError);
            }

            // Se não encontrou, tentar CSV
            if (cards.length === 0) {
                const validation = validateCsvFormat(text);
                if (validation.valid) {
                    const imported = importFlashcardsFromCSV(text);
                    cards = imported.map(fc => ({
                        pergunta: fc.pergunta,
                        resposta: fc.resposta,
                        tags: fc.tags ? fc.tags.split(';').filter(t => t.trim()) : [],
                    }));
                }
            }

            if (cards.length === 0) {
                throw new Error('Nenhum flashcard encontrado no arquivo');
            }

            // Inserir no banco
            const maxOrdem = flashcards.length > 0 ? Math.max(...flashcards.map(c => c.ordem)) : 0;

            const cardsToInsert = cards.map((card, index) => ({
                deck_id: id,
                pergunta: card.pergunta,
                resposta: card.resposta,
                tags: card.tags,
                ordem: maxOrdem + index + 1,
            }));

            const { error } = await (supabase
                .from('flashcards_default') as any)
                .insert(cardsToInsert);

            if (error) throw error;

            toast.success(`${cards.length} flashcards importados com sucesso!`);
            fetchDeckAndFlashcards();
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(`Erro ao importar: ${error.message}`);
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addFlashcard = async () => {
        if (!newCard.pergunta.trim() || !newCard.resposta.trim() || !id) {
            toast.error('Pergunta e resposta são obrigatórios');
            return;
        }

        const maxOrdem = flashcards.length > 0 ? Math.max(...flashcards.map(c => c.ordem)) : 0;

        const { error } = await (supabase
            .from('flashcards_default') as any)
            .insert({
                deck_id: id,
                pergunta: newCard.pergunta.trim(),
                resposta: newCard.resposta.trim(),
                ordem: maxOrdem + 1,
            });

        if (error) {
            toast.error('Erro ao adicionar flashcard');
        } else {
            toast.success('Flashcard adicionado!');
            setNewCard({ pergunta: '', resposta: '' });
            setShowNewForm(false);
            fetchDeckAndFlashcards();
        }
    };

    const updateFlashcard = async (cardId: string, pergunta: string, resposta: string) => {
        const { error } = await (supabase
            .from('flashcards_default') as any)
            .update({ pergunta, resposta })
            .eq('id', cardId);

        if (error) {
            toast.error('Erro ao atualizar flashcard');
        } else {
            toast.success('Flashcard atualizado!');
            setEditingCard(null);
            fetchDeckAndFlashcards();
        }
    };

    const deleteFlashcard = async (cardId: string) => {
        if (!confirm('Excluir este flashcard?')) return;

        const { error } = await (supabase
            .from('flashcards_default') as any)
            .delete()
            .eq('id', cardId);

        if (error) {
            toast.error('Erro ao excluir flashcard');
        } else {
            toast.success('Flashcard excluído!');
            fetchDeckAndFlashcards();
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                Carregando...
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/flashcards')}
                        className="p-2 rounded-md hover:bg-muted transition-colors"
                    >
                        <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">{deck?.nome}</h1>
                        <p className="text-muted-foreground">
                            {deck?.categoria || 'Sem categoria'} • {flashcards.length} flashcards
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleImportFile}
                        className="hidden"
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={importing}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <UploadIcon className="w-4 h-4" />
                        {importing ? 'Importando...' : 'Importar CSV/TXT'}
                    </button>
                    <button
                        onClick={() => setShowNewForm(true)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Adicionar
                    </button>
                </div>
            </div>

            {/* New Card Form */}
            {showNewForm && (
                <Card className="border-primary/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Novo Flashcard</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Pergunta</label>
                            <textarea
                                value={newCard.pergunta}
                                onChange={(e) => setNewCard({ ...newCard, pergunta: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                placeholder="Digite a pergunta..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Resposta</label>
                            <textarea
                                value={newCard.resposta}
                                onChange={(e) => setNewCard({ ...newCard, resposta: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                placeholder="Digite a resposta..."
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={addFlashcard}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
                            >
                                <SaveIcon className="w-4 h-4" />
                                Salvar
                            </button>
                            <button
                                onClick={() => {
                                    setShowNewForm(false);
                                    setNewCard({ pergunta: '', resposta: '' });
                                }}
                                className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                            >
                                Cancelar
                            </button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Flashcards List */}
            <div className="space-y-3">
                {flashcards.map((card, index) => (
                    <FlashcardItem
                        key={card.id}
                        card={card}
                        index={index}
                        isEditing={editingCard === card.id}
                        onEdit={() => setEditingCard(card.id)}
                        onSave={(pergunta, resposta) => updateFlashcard(card.id, pergunta, resposta)}
                        onCancel={() => setEditingCard(null)}
                        onDelete={() => deleteFlashcard(card.id)}
                    />
                ))}

                {flashcards.length === 0 && !showNewForm && (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhum flashcard ainda. Use "Importar CSV/TXT" ou "Adicionar" para começar.
                    </div>
                )}
            </div>
        </div>
    );
};

// Componente para cada flashcard
interface FlashcardItemProps {
    card: FlashcardDefault;
    index: number;
    isEditing: boolean;
    onEdit: () => void;
    onSave: (pergunta: string, resposta: string) => void;
    onCancel: () => void;
    onDelete: () => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({
    card,
    index,
    isEditing,
    onEdit,
    onSave,
    onCancel,
    onDelete,
}) => {
    const [pergunta, setPergunta] = useState(card.pergunta);
    const [resposta, setResposta] = useState(card.resposta);

    if (isEditing) {
        return (
            <Card className="border-primary/50">
                <CardContent className="p-4 space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Pergunta</label>
                        <textarea
                            value={pergunta}
                            onChange={(e) => setPergunta(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Resposta</label>
                        <textarea
                            value={resposta}
                            onChange={(e) => setResposta(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg resize-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onSave(pergunta, resposta)}
                            className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm flex items-center gap-1"
                        >
                            <SaveIcon className="w-3 h-3" />
                            Salvar
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 border border-border rounded-md text-sm hover:bg-muted"
                        >
                            Cancelar
                        </button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-card hover:bg-muted/30 transition-colors">
            <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground font-mono">#{index + 1}</span>
                    </div>
                    <p className="font-medium text-foreground">{card.pergunta}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{card.resposta}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-md hover:bg-primary/10 text-primary"
                        title="Editar"
                    >
                        <EditIcon className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-md hover:bg-red-500/10 text-red-500"
                        title="Excluir"
                    >
                        <Trash2Icon className="w-4 h-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminFlashcardsEdit;
