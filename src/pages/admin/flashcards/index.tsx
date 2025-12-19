import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { PlusIcon, Trash2Icon, EyeIcon, EyeOffIcon, SettingsIcon, LayersIcon } from '../../../../components/icons';
import { Card, CardContent } from '../../../../components/ui/Card';
import type { Database } from '../../../../types/supabase';

type FlashcardDeckDefault = Database['public']['Tables']['flashcard_decks_default']['Row'];

const AdminFlashcardsList: React.FC = () => {
    const navigate = useNavigate();
    const [decks, setDecks] = useState<(FlashcardDeckDefault & { count: number })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDecks();
    }, []);

    const fetchDecks = async () => {
        setLoading(true);

        // Buscar decks
        const { data: decksData, error: decksError } = await (supabase
            .from('flashcard_decks_default') as any)
            .select('*')
            .order('created_at', { ascending: false });

        if (decksError) {
            console.error('Error fetching decks:', decksError);
            setLoading(false);
            return;
        }

        // Buscar contagem de flashcards por deck
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
        setLoading(false);
    };

    const toggleVisibility = async (id: string, currentVisibility: boolean) => {
        const { error } = await (supabase
            .from('flashcard_decks_default') as any)
            .update({ visivel: !currentVisibility })
            .eq('id', id);

        if (error) {
            console.error('Error updating visibility:', error);
        } else {
            fetchDecks();
        }
    };

    const deleteDeck = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este deck e todos os flashcards?')) return;

        const { error } = await (supabase
            .from('flashcard_decks_default') as any)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting deck:', error);
        } else {
            fetchDecks();
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Flashcards Padrão</h1>
                <button
                    onClick={() => navigate('/admin/flashcards/novo')}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                >
                    <PlusIcon className="w-5 h-5" />
                    Novo Deck
                </button>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
            ) : (
                <div className="grid gap-4">
                    {decks.map((deck) => (
                        <Card key={deck.id} className="bg-card border-border">
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-lg">
                                        <LayersIcon className="w-6 h-6 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground">{deck.nome}</h3>
                                        <p className="text-muted-foreground">
                                            {deck.categoria || 'Sem categoria'} • {deck.count} flashcards
                                        </p>
                                        {deck.descricao && (
                                            <p className="text-sm text-muted-foreground mt-1">{deck.descricao}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${deck.visivel
                                            ? 'bg-green-500/10 text-green-400'
                                            : 'bg-zinc-500/10 text-zinc-400'
                                            }`}>
                                            {deck.visivel ? 'Visível' : 'Oculto'}
                                        </span>
                                        <button
                                            onClick={() => toggleVisibility(deck.id, deck.visivel)}
                                            className={`p-2 rounded-md transition-colors ${deck.visivel
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                : 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                                                }`}
                                            title={deck.visivel ? 'Ocultar' : 'Tornar visível'}
                                        >
                                            {deck.visivel
                                                ? <EyeIcon className="w-5 h-5" />
                                                : <EyeOffIcon className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/admin/flashcards/${deck.id}`)}
                                        className="p-2 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                        title="Gerenciar"
                                    >
                                        <SettingsIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => deleteDeck(deck.id)}
                                        className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        title="Excluir"
                                    >
                                        <Trash2Icon className="w-5 h-5" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {decks.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            Nenhum deck cadastrado. Clique em "Novo Deck" para criar.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminFlashcardsList;
