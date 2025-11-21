import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { ArrowLeftIcon, Trash2Icon, PlusIcon, EditIcon, FileTextIcon, LinkIcon, AlertCircleIcon } from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { toast } from '../../../../components/Sonner';
import type { Database } from '../../../../types/supabase';

type EditalDefault = Database['public']['Tables']['editais_default']['Row'];
type StatusValidacao = NonNullable<EditalDefault['status_validacao']>;
type SolicitacaoEdital = Database['public']['Tables']['solicitacoes_editais']['Row'];

interface DisciplinaDefault {
    id: string;
    nome: string;
    ordem: number;
}

const AdminEditalDetalhes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [edital, setEdital] = useState<EditalDefault | null>(null);
    const [disciplinas, setDisciplinas] = useState<DisciplinaDefault[]>([]);
    const [loading, setLoading] = useState(true);
    const [newDisciplina, setNewDisciplina] = useState('');
    const [solicitacao, setSolicitacao] = useState<SolicitacaoEdital | null>(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Edital
        const { data: editalData, error: editalError } = await supabase
            .from('editais_default')
            .select('*')
            .eq('id', id)
            .single();

        if (editalError) {
            console.error('Error fetching edital:', editalError);
            navigate('/admin/editais');
            return;
        }
        setEdital(editalData);

        // Buscar solicitação relacionada (se houver)
        const { data: solicitacaoData } = await supabase
            .from('solicitacoes_editais')
            .select('*')
            .eq('edital_default_id', id)
            .maybeSingle();

        if (solicitacaoData) {
            setSolicitacao(solicitacaoData);
        }

        // Fetch Disciplinas
        const { data: discData, error: discError } = await supabase
            .from('disciplinas_default')
            .select('*')
            .eq('edital_default_id', id)
            .order('ordem');

        if (discError) {
            console.error('Error fetching disciplinas:', discError);
        } else {
            setDisciplinas(discData || []);
        }
        setLoading(false);
    };

    const handleUpdateEdital = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!edital) return;

        const { error } = await supabase
            .from('editais_default')
            .update({
                nome: edital.nome,
                banca: edital.banca,
                ano: edital.ano,
                cargo: edital.cargo,
                status_validacao: edital.status_validacao ?? 'pendente'
            })
            .eq('id', edital.id);

        if (error) {
            alert('Erro ao atualizar edital');
        } else {
            alert('Edital atualizado com sucesso');
        }
    };

    // Função para formatar texto em Title Case (primeira letra de cada palavra maiúscula)
    const formatarTitleCase = (texto: string): string => {
        if (!texto) return '';
        return texto
            .split(' ')
            .map(palavra => {
                if (!palavra) return palavra;
                // Manter siglas em maiúsculas (ex: TCDF, CEBRASPE)
                if (palavra === palavra.toUpperCase() && palavra.length > 1) {
                    return palavra;
                }
                // Primeira letra maiúscula, resto minúscula
                return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
            })
            .join(' ');
    };

    const handleAddDisciplina = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDisciplina.trim() || !edital) return;

        const { error } = await supabase
            .from('disciplinas_default')
            .insert([{
                edital_default_id: edital.id,
                nome: formatarTitleCase(newDisciplina),
                ordem: disciplinas.length
            }]);

        if (error) {
            console.error('Error adding disciplina:', error);
        } else {
            setNewDisciplina('');
            fetchData();
        }
    };

    const handleDeleteDisciplina = async (discId: string) => {
        if (!confirm('Tem certeza? Isso apagará todos os tópicos desta disciplina.')) return;

        const { error } = await supabase
            .from('disciplinas_default')
            .delete()
            .eq('id', discId);

        if (error) {
            console.error('Error deleting disciplina:', error);
        } else {
            fetchData();
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!edital) return <div className="p-8 text-center">Edital não encontrado</div>;

    return (
        <div className="p-8 space-y-8 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/editais')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-bold text-foreground">Gerenciar Edital</h1>
            </div>

            {/* Banner informativo quando criado a partir de solicitação */}
            {solicitacao && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-blue-400 mb-2">
                                Edital criado a partir de solicitação
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Este edital foi criado automaticamente. <strong>Analise o PDF/link abaixo</strong> e adicione as disciplinas e tópicos conforme o edital original.
                            </p>
                            <div className="flex gap-2 flex-wrap">
                                {solicitacao.link_edital && (
                                    <a
                                        href={solicitacao.link_edital}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-sm transition-colors"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                        Abrir Link do Edital
                                    </a>
                                )}
                                {solicitacao.arquivo_pdf_url && (
                                    <a
                                        href={solicitacao.arquivo_pdf_url.startsWith('http') 
                                            ? solicitacao.arquivo_pdf_url 
                                            : '#'}
                                        onClick={async (e) => {
                                            if (!solicitacao.arquivo_pdf_url?.startsWith('http')) {
                                                e.preventDefault();
                                                try {
                                                    const { data, error } = await supabase.storage
                                                        .from('editais')
                                                        .createSignedUrl(solicitacao.arquivo_pdf_url, 3600);
                                                    if (error) throw error;
                                                    if (data) window.open(data.signedUrl, '_blank');
                                                } catch (error) {
                                                    console.error('Erro ao abrir PDF:', error);
                                                    toast.error('Erro ao abrir PDF');
                                                }
                                            }
                                        }}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm transition-colors"
                                    >
                                        <FileTextIcon className="w-4 h-4" />
                                        Abrir PDF do Edital
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Aviso se não tem disciplinas */}
            {disciplinas.length === 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <AlertCircleIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="font-semibold text-amber-400 mb-1">
                                Edital incompleto
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Adicione as disciplinas e tópicos baseado no PDF/link acima. O edital só ficará visível para os usuários após ser marcado como "Aprovado" no status de visibilidade.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-8">
                {/* Edital Details Form */}
                <Card className="bg-card border-border">
                    <CardHeader>
                        <CardTitle>Dados do Edital</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleUpdateEdital} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Nome</label>
                                    <input
                                        type="text"
                                        value={edital.nome || ''}
                                        onChange={(e) => setEdital({ ...edital, nome: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Banca</label>
                                    <input
                                        type="text"
                                        value={edital.banca || ''}
                                        onChange={(e) => setEdital({ ...edital, banca: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ano</label>
                                    <input
                                        type="number"
                                        value={edital.ano || ''}
                                        onChange={(e) => setEdital({ ...edital, ano: parseInt(e.target.value) || null })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cargo</label>
                                    <input
                                        type="text"
                                        value={edital.cargo || ''}
                                        onChange={(e) => setEdital({ ...edital, cargo: e.target.value })}
                                        className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Status de visibilidade</label>
                                <select
                                    value={edital.status_validacao ?? 'pendente'}
                                    onChange={(e) => setEdital({ ...edital, status_validacao: e.target.value as StatusValidacao })}
                                    className="w-full p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                                >
                                    <option value="pendente">Pendente (não visível)</option>
                                    <option value="aprovado">Aprovado (visível)</option>
                                    <option value="oculto">Oculto</option>
                                </select>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium"
                                >
                                    Salvar Alterações
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Disciplinas Management */}
                <Card className="bg-card border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Disciplinas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Add Disciplina Form */}
                        <form onSubmit={handleAddDisciplina} className="flex gap-2">
                            <input
                                type="text"
                                value={newDisciplina}
                                onChange={(e) => {
                                    const valor = e.target.value;
                                    // Formata em Title Case enquanto digita
                                    const palavras = valor.split(' ');
                                    const ultimaPalavra = palavras[palavras.length - 1];
                                    const palavrasFormatadas = palavras.slice(0, -1).map(p => {
                                        if (!p) return p;
                                        if (p === p.toUpperCase() && p.length > 1) return p;
                                        return p.charAt(0).toUpperCase() + p.slice(1).toLowerCase();
                                    });
                                    const valorFormatado = [...palavrasFormatadas, ultimaPalavra].join(' ');
                                    setNewDisciplina(valorFormatado);
                                }}
                                placeholder="Nome da nova disciplina"
                                className="flex-1 p-2 rounded-md bg-background border border-input focus:border-primary outline-none"
                            />
                            <button
                                type="submit"
                                className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium flex items-center gap-2"
                            >
                                <PlusIcon className="w-4 h-4" />
                                Adicionar
                            </button>
                        </form>

                        {/* Disciplinas List */}
                        <div className="space-y-2">
                            {disciplinas.map((disc) => (
                                <div
                                    key={disc.id}
                                    className="flex items-center justify-between p-3 rounded-md bg-muted/50 border border-border"
                                >
                                    <span className="font-medium">{disc.nome}</span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/editais/${edital.id}/disciplina/${disc.id}`)}
                                            className="p-2 rounded-md bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 text-sm flex items-center gap-1"
                                        >
                                            <EditIcon className="w-4 h-4" />
                                            Tópicos
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDisciplina(disc.id)}
                                            className="p-2 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        >
                                            <Trash2Icon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {disciplinas.length === 0 && (
                                <p className="text-center text-muted-foreground text-sm">Nenhuma disciplina cadastrada.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminEditalDetalhes;
