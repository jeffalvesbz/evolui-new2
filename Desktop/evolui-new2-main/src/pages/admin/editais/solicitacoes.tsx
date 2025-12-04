import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../services/supabaseClient';
import { 
    FileTextIcon, 
    LinkIcon, 
    DownloadIcon, 
    CheckCircle2Icon, 
    XCircleIcon, 
    ClockIcon,
    RefreshCwIcon,
    EyeIcon,
    SettingsIcon,
    PlusIcon,
    ArrowLeftIcon,
    Trash2Icon
} from '../../../../components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { toast } from '../../../../components/Sonner';
import type { Database } from '../../../../types/supabase';

type SolicitacaoEdital = Database['public']['Tables']['solicitacoes_editais']['Row'];

const AdminSolicitacoesEditais: React.FC = () => {
    const navigate = useNavigate();
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEdital[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('todos');
    const [creatingEdital, setCreatingEdital] = useState<string | null>(null);
    const [pdfUrls, setPdfUrls] = useState<Record<string, string>>({});

    const getPdfUrl = async (filePath: string, solicitacaoId: string) => {
        if (pdfUrls[solicitacaoId]) return pdfUrls[solicitacaoId];
        
        try {
            // Gerar signed URL (válida por 1 hora)
            const { data, error } = await supabase.storage
                .from('editais')
                .createSignedUrl(filePath, 3600);
            
            if (error) throw error;
            if (data) {
                setPdfUrls(prev => ({ ...prev, [solicitacaoId]: data.signedUrl }));
                return data.signedUrl;
            }
        } catch (error) {
            console.error('Erro ao gerar URL do PDF:', error);
        }
        return filePath;
    };

    useEffect(() => {
        fetchSolicitacoes();
    }, [filterStatus]);

    const fetchSolicitacoes = async () => {
        setLoading(true);
        let query = supabase
            .from('solicitacoes_editais')
            .select('*')
            .order('created_at', { ascending: false });

        if (filterStatus !== 'todos') {
            query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
            toast.error('Erro ao carregar solicitações');
        } else {
            setSolicitacoes(data || []);
        }
        setLoading(false);
    };

    const criarEditalDaSolicitacao = async (solicitacao: SolicitacaoEdital) => {
        setCreatingEdital(solicitacao.id);
        try {
            // Criar edital padrão (inicialmente como pendente até completar as disciplinas)
            const { data: editalData, error: editalError } = await supabase
                .from('editais_default')
                .insert([{
                    nome: solicitacao.nome_edital,
                    banca: solicitacao.banca || null,
                    ano: solicitacao.ano || null,
                    cargo: solicitacao.cargo || null,
                    status_validacao: 'pendente' // Pendente até adicionar disciplinas
                }])
                .select()
                .single();

            if (editalError) throw editalError;

            // Atualizar solicitação com o ID do edital criado e status aprovado
            const { error: updateError } = await supabase
                .from('solicitacoes_editais')
                .update({ 
                    status: 'aprovado',
                    edital_default_id: editalData.id
                })
                .eq('id', solicitacao.id);

            if (updateError) throw updateError;

            toast.success('Edital criado! Agora você precisa adicionar as disciplinas e tópicos.');
            fetchSolicitacoes();
            
            // Redirecionar automaticamente para editar o edital
            setTimeout(() => {
                navigate(`/admin/editais/${editalData.id}`);
            }, 1000);
        } catch (error: any) {
            console.error('Erro ao criar edital:', error);
            toast.error('Erro ao criar edital: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setCreatingEdital(null);
        }
    };

    const updateStatus = async (id: string, novoStatus: SolicitacaoEdital['status']) => {
        if (novoStatus === 'aprovado') {
            // Se está aprovando, criar o edital automaticamente
            const solicitacao = solicitacoes.find(s => s.id === id);
            if (solicitacao) {
                await criarEditalDaSolicitacao(solicitacao);
                return;
            }
        }

        const { error } = await supabase
            .from('solicitacoes_editais')
            .update({ status: novoStatus })
            .eq('id', id);

        if (error) {
            console.error('Erro ao atualizar status:', error);
            toast.error('Erro ao atualizar status');
        } else {
            toast.success('Status atualizado com sucesso!');
            fetchSolicitacoes();
        }
    };

    const deleteSolicitacao = async (id: string, nomeEdital: string) => {
        if (!confirm(`Tem certeza que deseja excluir a solicitação "${nomeEdital}"?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        try {
            const solicitacao = solicitacoes.find(s => s.id === id);
            
            // Se houver PDF, tentar excluir do storage
            if (solicitacao?.arquivo_pdf_url && !solicitacao.arquivo_pdf_url.startsWith('http')) {
                try {
                    await supabase.storage
                        .from('editais')
                        .remove([solicitacao.arquivo_pdf_url]);
                } catch (storageError) {
                    console.warn('Erro ao excluir PDF do storage:', storageError);
                    // Continua mesmo se não conseguir excluir o PDF
                }
            }

            const { error, data } = await supabase
                .from('solicitacoes_editais')
                .delete()
                .eq('id', id)
                .select();

            if (error) {
                console.error('Erro detalhado:', error);
                throw error;
            }

            if (data && data.length === 0) {
                throw new Error('Solicitação não encontrada ou sem permissão para excluir');
            }

            toast.success('Solicitação excluída com sucesso!');
            fetchSolicitacoes();
        } catch (error: any) {
            console.error('Erro ao excluir solicitação:', error);
            toast.error('Erro ao excluir solicitação: ' + (error.message || 'Erro desconhecido'));
        }
    };

    const getStatusBadge = (status: SolicitacaoEdital['status']) => {
        const badges = {
            pendente: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            em_analise: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            aprovado: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            rejeitado: 'bg-red-500/10 text-red-400 border-red-500/20'
        };
        return badges[status] || badges.pendente;
    };

    const getStatusIcon = (status: SolicitacaoEdital['status']) => {
        switch (status) {
            case 'aprovado':
                return <CheckCircle2Icon className="w-4 h-4" />;
            case 'rejeitado':
                return <XCircleIcon className="w-4 h-4" />;
            case 'em_analise':
                return <ClockIcon className="w-4 h-4" />;
            default:
                return <ClockIcon className="w-4 h-4" />;
        }
    };

    const filteredSolicitacoes = solicitacoes;

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => navigate('/admin/editais')}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Voltar para Editais"
                >
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold text-foreground">Solicitações de Editais</h1>
                    <p className="text-muted-foreground mt-1">
                        Gerencie as solicitações de inclusão de editais enviadas pelos usuários
                    </p>
                </div>
                <button
                    onClick={fetchSolicitacoes}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors disabled:opacity-60"
                >
                    <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </button>
            </div>

            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilterStatus('todos')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === 'todos'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    Todos
                </button>
                <button
                    onClick={() => setFilterStatus('pendente')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === 'pendente'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    Pendentes
                </button>
                <button
                    onClick={() => setFilterStatus('em_analise')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === 'em_analise'
                            ? 'bg-blue-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    Em Análise
                </button>
                <button
                    onClick={() => setFilterStatus('aprovado')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === 'aprovado'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    Aprovados
                </button>
                <button
                    onClick={() => setFilterStatus('rejeitado')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === 'rejeitado'
                            ? 'bg-red-500 text-white'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                    Rejeitados
                </button>
            </div>

            {loading ? (
                <div className="text-center text-muted-foreground py-12">
                    <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Carregando solicitações...
                </div>
            ) : filteredSolicitacoes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    Nenhuma solicitação encontrada.
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredSolicitacoes.map((solicitacao) => (
                        <Card key={solicitacao.id} className="bg-card border-border">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-foreground">
                                                {solicitacao.nome_edital}
                                            </h3>
                                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(solicitacao.status)}`}>
                                                {getStatusIcon(solicitacao.status)}
                                                {solicitacao.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                                            {solicitacao.banca && (
                                                <div><strong>Banca:</strong> {solicitacao.banca}</div>
                                            )}
                                            {solicitacao.cargo && (
                                                <div><strong>Cargo:</strong> {solicitacao.cargo}</div>
                                            )}
                                            {solicitacao.ano && (
                                                <div><strong>Ano:</strong> {solicitacao.ano}</div>
                                            )}
                                            <div>
                                                <strong>Data:</strong> {new Date(solicitacao.created_at).toLocaleDateString('pt-BR')}
                                            </div>
                                        </div>

                                        {solicitacao.observacoes && (
                                            <p className="text-sm text-muted-foreground mb-3">
                                                <strong>Observações:</strong> {solicitacao.observacoes}
                                            </p>
                                        )}

                                        <div className="flex gap-3 flex-wrap mb-3">
                                            {solicitacao.link_edital && (
                                                <a
                                                    href={solicitacao.link_edital}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm transition-colors"
                                                >
                                                    <LinkIcon className="w-4 h-4" />
                                                    Ver Link do Edital
                                                </a>
                                            )}
                                            {solicitacao.arquivo_pdf_url && (
                                                <a
                                                    href={solicitacao.arquivo_pdf_url.startsWith('http') 
                                                        ? solicitacao.arquivo_pdf_url 
                                                        : pdfUrls[solicitacao.id] || '#'}
                                                    onClick={async (e) => {
                                                        if (!solicitacao.arquivo_pdf_url?.startsWith('http')) {
                                                            e.preventDefault();
                                                            const url = await getPdfUrl(solicitacao.arquivo_pdf_url, solicitacao.id);
                                                            if (url) window.open(url, '_blank');
                                                        }
                                                    }}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm transition-colors"
                                                >
                                                    <FileTextIcon className="w-4 h-4" />
                                                    Ver PDF
                                                </a>
                                            )}
                                        </div>

                                        {solicitacao.status === 'pendente' || solicitacao.status === 'em_analise' ? (
                                            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2">
                                                <strong>Próximo passo:</strong> Após aprovar, você será redirecionado para cadastrar as disciplinas e tópicos do edital.
                                            </div>
                                        ) : solicitacao.status === 'aprovado' && solicitacao.edital_default_id ? (
                                            <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                                                <strong>Status:</strong> Edital criado. Use o botão "Completar Edital" para adicionar disciplinas e tópicos baseado no PDF.
                                            </div>
                                        ) : null}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        {solicitacao.status === 'pendente' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(solicitacao.id, 'em_analise')}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Em Análise
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(solicitacao.id, 'aprovado')}
                                                    disabled={creatingEdital === solicitacao.id}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                                >
                                                    {creatingEdital === solicitacao.id ? (
                                                        <>
                                                            <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                            Criando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2Icon className="w-4 h-4" />
                                                            Aprovar e Criar Edital
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(solicitacao.id, 'rejeitado')}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Rejeitar
                                                </button>
                                                <button
                                                    onClick={() => deleteSolicitacao(solicitacao.id, solicitacao.nome_edital)}
                                                    className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-red-500/50"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                    Excluir
                                                </button>
                                            </>
                                        )}
                                        {solicitacao.status === 'em_analise' && (
                                            <>
                                                <button
                                                    onClick={() => updateStatus(solicitacao.id, 'aprovado')}
                                                    disabled={creatingEdital === solicitacao.id}
                                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                                >
                                                    {creatingEdital === solicitacao.id ? (
                                                        <>
                                                            <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                            Criando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2Icon className="w-4 h-4" />
                                                            Aprovar e Criar Edital
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => updateStatus(solicitacao.id, 'rejeitado')}
                                                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                                                >
                                                    Rejeitar
                                                </button>
                                                <button
                                                    onClick={() => deleteSolicitacao(solicitacao.id, solicitacao.nome_edital)}
                                                    className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 border border-red-500/50"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                    Excluir
                                                </button>
                                            </>
                                        )}
                                        {solicitacao.status === 'aprovado' && (
                                            <div className="space-y-2">
                                                {solicitacao.edital_default_id ? (
                                                    <>
                                                        <div className="text-xs text-muted-foreground text-center p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                                            <CheckCircle2Icon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                                                            Edital criado
                                                        </div>
                                                        <button
                                                            onClick={() => navigate(`/admin/editais/${solicitacao.edital_default_id}`)}
                                                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                        >
                                                            <SettingsIcon className="w-4 h-4" />
                                                            Completar Edital
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="text-xs text-amber-400 text-center p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 mb-2">
                                                            <ClockIcon className="w-4 h-4 mx-auto mb-1" />
                                                            Aguardando criação
                                                        </div>
                                                        <button
                                                            onClick={() => criarEditalDaSolicitacao(solicitacao)}
                                                            disabled={creatingEdital === solicitacao.id}
                                                            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                                        >
                                                            {creatingEdital === solicitacao.id ? (
                                                                <>
                                                                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                                                    Criando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <PlusIcon className="w-4 h-4" />
                                                                    Cadastrar Edital
                                                                </>
                                                            )}
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => deleteSolicitacao(solicitacao.id, solicitacao.nome_edital)}
                                                    className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Trash2Icon className="w-4 h-4" />
                                                    Excluir
                                                </button>
                                            </div>
                                        )}
                                        {solicitacao.status === 'rejeitado' && (
                                            <button
                                                onClick={() => deleteSolicitacao(solicitacao.id, solicitacao.nome_edital)}
                                                className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                                Excluir
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminSolicitacoesEditais;

