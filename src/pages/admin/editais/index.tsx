import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { PlusIcon, Trash2Icon, EyeIcon, EyeOffIcon, SettingsIcon, FileTextIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import type { Database } from '../../../../types/supabase';

type EditalDefault = Database['public']['Tables']['editais_default']['Row'];
type StatusValidacao = NonNullable<EditalDefault['status_validacao']>;

const AdminEditaisList: React.FC = () => {
    const navigate = useNavigate();
    const [editais, setEditais] = useState<EditalDefault[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEditais();
    }, []);

    const fetchEditais = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('editais_default')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching editais:', error);
        } else {
            setEditais(data || []);
        }
        setLoading(false);
    };

    const toggleVisibility = async (id: string, status: EditalDefault['status_validacao']) => {
        const currentStatus: StatusValidacao = (status ?? 'pendente') as StatusValidacao;
        const nextStatus: StatusValidacao = currentStatus === 'oculto' ? 'aprovado' : 'oculto';

        const { error } = await (supabase
            .from('editais_default') as any)
            .update({
                status_validacao: nextStatus
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating visibility:', error);
        } else {
            fetchEditais();
        }
    };

    const deleteEdital = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este edital?')) return;

        const { error } = await supabase
            .from('editais_default')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting edital:', error);
        } else {
            fetchEditais();
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Editais Padrão</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/editais/solicitacoes')}
                        className="bg-purple-600 text-white hover:bg-purple-700 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                    >
                        <FileTextIcon className="w-5 h-5" />
                        Solicitações
                    </button>
                    <button
                        onClick={() => navigate('/admin/editais/novo')}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-2 font-medium"
                    >
                        <PlusIcon className="w-5 h-5" />
                        Novo Edital
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
            ) : (
                <div className="grid gap-4">
                    {editais.map((edital) => {
                        const status = edital.status_validacao ?? 'pendente';
                        const isVisible = status !== 'oculto';
                        return (
                            <Card key={edital.id} className="bg-card border-border">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xl font-semibold text-foreground">{edital.nome}</h3>
                                        <p className="text-muted-foreground">
                                            {edital.banca || '—'} • {edital.cargo || '—'} • {edital.ano ?? '—'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status === 'oculto'
                                                ? 'bg-zinc-500/10 text-zinc-400'
                                                : status === 'pendente'
                                                    ? 'bg-amber-500/10 text-amber-400'
                                                    : 'bg-green-500/10 text-green-400'
                                                }`}>
                                                {status}
                                            </span>
                                            <button
                                                onClick={() => toggleVisibility(edital.id, status)}
                                                className={`p-2 rounded-md transition-colors ${!isVisible
                                                    ? 'bg-zinc-500/10 text-zinc-500 hover:bg-zinc-500/20'
                                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                                    }`}
                                                title={isVisible ? 'Visível' : 'Oculto'}
                                            >
                                                {isVisible
                                                    ? <EyeIcon className="w-5 h-5" />
                                                    : <EyeOffIcon className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/admin/editais/${edital.id}`)}
                                            className="p-2 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                                            title="Gerenciar"
                                        >
                                            <SettingsIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => deleteEdital(edital.id)}
                                            className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            title="Excluir"
                                        >
                                            <Trash2Icon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    {editais.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            Nenhum edital cadastrado.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminEditaisList;
