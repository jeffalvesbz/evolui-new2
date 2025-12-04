import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../../../services/supabaseClient';
import { ArrowLeftIcon } from '../../../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../components/ui/Card';

const AdminDisciplinaDetalhes: React.FC = () => {
    const { id, disciplinaId } = useParams<{ id: string; disciplinaId: string }>();
    const navigate = useNavigate();
    const [mode, setMode] = useState<'manual' | 'json'>('manual');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [disciplinaName, setDisciplinaName] = useState('');

    // Manual Mode: one topic per line
    const [manualInput, setManualInput] = useState('');

    // JSON Mode: array of strings
    const [jsonInput, setJsonInput] = useState('');

    useEffect(() => {
        if (disciplinaId) {
            fetchData();
        }
    }, [disciplinaId]);

    const fetchData = async () => {
        setLoading(true);

        // Fetch Disciplina Name
        const { data: discData } = await supabase
            .from('disciplinas_default')
            .select('nome')
            .eq('id', disciplinaId)
            .single();

        if (discData) setDisciplinaName(discData.nome);

        // Fetch Topics
        const { data: topicsData, error } = await supabase
            .from('topicos_default')
            .select('nome')
            .eq('disciplina_default_id', disciplinaId)
            .order('ordem');

        if (error) {
            console.error('Error fetching topics:', error);
        } else {
            const topics = topicsData?.map(t => t.nome) || [];
            setManualInput(topics.join('\n'));
            setJsonInput(JSON.stringify(topics, null, 2));
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let newTopics: string[] = [];

            if (mode === 'manual') {
                newTopics = manualInput.split('\n').map(t => t.trim()).filter(t => t.length > 0);
            } else {
                newTopics = JSON.parse(jsonInput);
                if (!Array.isArray(newTopics)) throw new Error('JSON deve ser um array de strings.');
            }

            // 1. Delete existing topics
            const { error: deleteError } = await supabase
                .from('topicos_default')
                .delete()
                .eq('disciplina_default_id', disciplinaId);

            if (deleteError) throw deleteError;

            // 2. Insert new topics
            if (newTopics.length > 0) {
                const topicsToInsert = newTopics.map((nome, index) => ({
                    disciplina_default_id: disciplinaId,
                    nome,
                    ordem: index
                }));

                const { error: insertError } = await supabase
                    .from('topicos_default')
                    .insert(topicsToInsert);

                if (insertError) throw insertError;
            }

            navigate(`/admin/editais/${id}`);
        } catch (err: any) {
            alert('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(`/admin/editais/${id}`)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Editar Tópicos</h1>
                    <p className="text-muted-foreground">{disciplinaName}</p>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setMode('manual')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'manual'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                >
                    Modo Manual (Linhas)
                </button>
                <button
                    onClick={() => setMode('json')}
                    className={`px-4 py-2 rounded-md font-medium transition-colors ${mode === 'json'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                >
                    Modo JSON
                </button>
            </div>

            <Card className="bg-card border-border">
                <CardContent className="p-6 space-y-4">
                    {mode === 'manual' ? (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tópicos (um por linha)</label>
                            <textarea
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                className="w-full h-[500px] p-4 rounded-md bg-zinc-950 border border-input font-mono text-sm focus:border-primary outline-none"
                                placeholder="Tópico 1&#10;Tópico 2&#10;Tópico 3"
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <label className="text-sm font-medium">JSON Array</label>
                            <textarea
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                                className="w-full h-[500px] p-4 rounded-md bg-zinc-950 border border-input font-mono text-sm focus:border-primary outline-none"
                                placeholder='["Tópico 1", "Tópico 2"]'
                            />
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium disabled:opacity-50"
                        >
                            {saving ? 'Salvando...' : 'Salvar Tópicos'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDisciplinaDetalhes;
