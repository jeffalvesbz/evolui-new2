import React, { useEffect, useState } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { 
    FileTextIcon, 
    LinkIcon, 
    CheckCircle2Icon, 
    XCircleIcon, 
    ClockIcon,
    RefreshCwIcon
} from '../../../components/icons';
import { Card, CardContent } from '../../../components/ui/Card';
import { toast } from '../../../components/Sonner';
import type { Database } from '../../../types/supabase';

type SolicitacaoEdital = Database['public']['Tables']['solicitacoes_editais']['Row'];

const MinhasSolicitacoes: React.FC = () => {
    const [solicitacoes, setSolicitacoes] = useState<SolicitacaoEdital[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSolicitacoes();
    }, []);

    const fetchSolicitacoes = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('solicitacoes_editais')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar solicitações:', error);
            toast.error('Erro ao carregar suas solicitações');
        } else {
            setSolicitacoes(data || []);
        }
        setLoading(false);
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

    const getStatusText = (status: SolicitacaoEdital['status']) => {
        const texts = {
            pendente: 'Aguardando análise',
            em_analise: 'Em análise pela equipe',
            aprovado: 'Aprovado - Edital será incluído em breve',
            rejeitado: 'Rejeitado'
        };
        return texts[status] || status;
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Minhas Solicitações</h1>
                    <p className="text-muted-foreground mt-1">
                        Acompanhe o status das suas solicitações de inclusão de editais
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

            {loading ? (
                <div className="text-center text-muted-foreground py-12">
                    <RefreshCwIcon className="w-8 h-8 animate-spin mx-auto mb-2" />
                    Carregando suas solicitações...
                </div>
            ) : solicitacoes.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                    <FileTextIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">Nenhuma solicitação encontrada</p>
                    <p className="text-sm">Você ainda não enviou nenhuma solicitação de inclusão de edital.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {solicitacoes.map((solicitacao) => (
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
                                        
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {getStatusText(solicitacao.status)}
                                        </p>
                                        
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
                                                <strong>Enviado em:</strong> {new Date(solicitacao.created_at).toLocaleDateString('pt-BR', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </div>
                                        </div>

                                        {solicitacao.observacoes && (
                                            <p className="text-sm text-muted-foreground mb-3">
                                                <strong>Observações:</strong> {solicitacao.observacoes}
                                            </p>
                                        )}

                                        <div className="flex gap-3 flex-wrap">
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
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 rounded-lg text-sm transition-colors"
                                                >
                                                    <FileTextIcon className="w-4 h-4" />
                                                    Ver PDF Enviado
                                                </a>
                                            )}
                                        </div>
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

export default MinhasSolicitacoes;

