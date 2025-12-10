import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import { BookOpenIcon, BookCopyIcon } from '../../../components/icons';
import type { Database } from '../../../types/supabase';

type EditalDefault = Database['public']['Tables']['editais_default']['Row'];

const UserEditaisDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [editais, setEditais] = useState<EditalDefault[]>([]);
    const [loading, setLoading] = useState(true);
    const [cloningId, setCloningId] = useState<string | null>(null);

    useEffect(() => {
        fetchEditais();
    }, []);

    const fetchEditais = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('editais_default')
            .select('*')
            .eq('status_validacao', 'aprovado')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching editais:', error);
        } else {
            setEditais(data || []);
        }
        setLoading(false);
    };

    const handleClone = async (editalId: string) => {
        setCloningId(editalId);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const payload = {
                edital_default_id: editalId,
                user_id: user.id
            };

            // @ts-expect-error Tipos locais do Supabase ainda não incluem esta RPC
            const { data, error } = await supabase.rpc('clone_edital_default', payload);

            if (error) throw error;

            // Redirect to the new edital (assuming the function returns the new ID)
            // Note: The RPC function returns the new ID directly or as data
            const newEditalId = data;

            if (newEditalId) {
                navigate(`/edital?id=${newEditalId}`); // Adjust route as per existing app structure
            } else {
                alert('Edital clonado com sucesso!');
            }
        } catch (err: any) {
            console.error('Error cloning edital:', err);
            alert('Erro ao clonar edital: ' + err.message);
        } finally {
            setCloningId(null);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-foreground">Editais Disponíveis</h1>
                <p className="text-muted-foreground">Clone um edital padrão para começar seus estudos imediatamente.</p>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground">Carregando...</div>
            ) : (
                <div className="bg-card border border-border rounded-xl divide-y divide-border">
                    {editais.map((edital) => (
                        <div
                            key={edital.id}
                            className="p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between hover:bg-card/80 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <BookOpenIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-xl font-bold text-foreground">{edital.nome}</h3>
                                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                                            {edital.ano ?? '—'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground mt-1 space-x-2">
                                        <span>Banca: <span className="text-foreground">{edital.banca || '—'}</span></span>
                                        <span>•</span>
                                        <span>Cargo: <span className="text-foreground">{edital.cargo || '—'}</span></span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleClone(edital.id)}
                                disabled={cloningId === edital.id}
                                className="w-full md:w-auto py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {cloningId === edital.id ? (
                                    'Clonando...'
                                ) : (
                                    <>
                                        <BookCopyIcon className="w-4 h-4" />
                                        Clonar Edital
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                    {editais.length === 0 && (
                        <div className="text-center text-muted-foreground py-12">
                            Nenhum edital disponível no momento.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserEditaisDashboard;
