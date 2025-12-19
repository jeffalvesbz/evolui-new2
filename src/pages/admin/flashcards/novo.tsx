import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { ArrowLeftIcon, SaveIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { toast } from '../../../../components/Sonner';

const AdminFlashcardsNovo: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        nome: '',
        descricao: '',
        categoria: '',
        visivel: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.nome.trim()) {
            toast.error('Nome do deck é obrigatório');
            return;
        }

        setLoading(true);

        const { data, error } = await (supabase
            .from('flashcard_decks_default') as any)
            .insert({
                nome: formData.nome.trim(),
                descricao: formData.descricao.trim() || null,
                categoria: formData.categoria.trim() || null,
                visivel: formData.visivel,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating deck:', error);
            toast.error('Erro ao criar deck');
        } else if (data) {
            toast.success('Deck criado com sucesso!');
            navigate(`/admin/flashcards/${data.id}`);
        }

        setLoading(false);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/flashcards')}
                    className="p-2 rounded-md hover:bg-muted transition-colors"
                >
                    <ArrowLeftIcon className="w-5 h-5 text-muted-foreground" />
                </button>
                <h1 className="text-3xl font-bold text-foreground">Novo Deck de Flashcards</h1>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Informações do Deck</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Nome do Deck *
                            </label>
                            <input
                                type="text"
                                value={formData.nome}
                                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                placeholder="Ex: Direito Constitucional - Básico"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Categoria
                            </label>
                            <input
                                type="text"
                                value={formData.categoria}
                                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                placeholder="Ex: Direito, Informática, Língua Portuguesa"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Descrição
                            </label>
                            <textarea
                                value={formData.descricao}
                                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                placeholder="Breve descrição do conteúdo do deck"
                                rows={3}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="visivel"
                                checked={formData.visivel}
                                onChange={(e) => setFormData({ ...formData, visivel: e.target.checked })}
                                className="w-4 h-4 rounded border-border"
                            />
                            <label htmlFor="visivel" className="text-sm text-foreground">
                                Tornar visível para usuários
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => navigate('/admin/flashcards')}
                                className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <SaveIcon className="w-4 h-4" />
                                {loading ? 'Salvando...' : 'Criar Deck'}
                            </button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminFlashcardsNovo;
