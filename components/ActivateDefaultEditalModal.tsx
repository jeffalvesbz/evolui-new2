import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useModalStore } from '../stores/useModalStore';
import { useEditalStore } from '../stores/useEditalStore';
import type { Database } from '../types/supabase';
import {
    ArrowRightIcon,
    BookCopyIcon,
    BookOpenIcon,
    CalendarDaysIcon,
    LandmarkIcon,
    RefreshCwIcon,
    SearchIcon,
    UserIcon,
    FileTextIcon,
    CheckCircle2Icon,
    SparklesIcon
} from './icons';
import { toast } from './Sonner';
import SolicitarEditalModal from './SolicitarEditalModal';
import { Modal } from './ui/BaseModal';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';

type EditalDefault = Database['public']['Tables']['editais_default']['Row'];

const ActivateDefaultEditalModal: React.FC = () => {
    const { isDefaultEditalModalOpen, closeDefaultEditalModal } = useModalStore();
    const { fetchEditais, setEditalAtivo, editalAtivo } = useEditalStore();

    const [editais, setEditais] = useState<EditalDefault[]>([]);
    const [loading, setLoading] = useState(false);
    const [cloningId, setCloningId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSolicitarModalOpen, setIsSolicitarModalOpen] = useState(false);

    useEffect(() => {
        if (!isDefaultEditalModalOpen) return;
        fetchEditaisPadrao();
    }, [isDefaultEditalModalOpen]);

    const fetchEditaisPadrao = async () => {
        setLoading(true);
        setErrorMessage(null);
        const { data, error } = await supabase
            .from('editais_default')
            .select('*')
            .in('status_validacao', ['aprovado', 'pendente'])
            .order('nome', { ascending: true });

        if (error) {
            console.error('Erro ao carregar editais padrão:', error);
            setErrorMessage('Não foi possível carregar os editais padrão.');
        } else {
            setEditais(data || []);
        }
        setLoading(false);
    };

    const filteredEditais = useMemo(() => {
        const filtered = !search.trim()
            ? editais
            : editais.filter((edital) =>
                edital.nome.toLowerCase().includes(search.toLowerCase()) ||
                (edital.banca ?? '').toLowerCase().includes(search.toLowerCase()) ||
                (edital.cargo ?? '').toLowerCase().includes(search.toLowerCase())
            );

        const calcularAfinidade = (edital: EditalDefault): number => {
            if (!editalAtivo) return 0;
            let score = 0;
            if (editalAtivo.banca && edital.banca &&
                editalAtivo.banca.toLowerCase() === edital.banca.toLowerCase()) {
                score += 2;
            }
            if (editalAtivo.orgao && edital.cargo &&
                editalAtivo.orgao.toLowerCase().includes(edital.cargo.toLowerCase())) {
                score += 1;
            }
            return score;
        };

        return [...filtered].sort((a, b) => {
            const afinidadeA = calcularAfinidade(a);
            const afinidadeB = calcularAfinidade(b);
            if (afinidadeA !== afinidadeB) {
                return afinidadeB - afinidadeA;
            }
            return (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' });
        });
    }, [editais, search, editalAtivo]);

    const handleActivate = async (editalId: string) => {
        setCloningId(editalId);
        try {
            const { data: sessionData } = await supabase.auth.getUser();
            const userId = sessionData.user?.id;
            if (!userId) throw new Error('Usuário não autenticado.');

            const payload: Database['public']['Functions']['clone_edital_default']['Args'] = {
                edital_default_id: editalId,
                user_id: userId
            };

            // @ts-expect-error Tipos locais do Supabase ainda não incluem esta RPC
            const { data, error } = await supabase.rpc('clone_edital_default', payload);

            if (error) throw error;

            const newEditalId = data ?? undefined;

            await fetchEditais();

            if (newEditalId) {
                const { editais: userEditais } = useEditalStore.getState();
                const novoPlano = userEditais.find((e) => e.id === newEditalId) || userEditais[userEditais.length - 1];
                if (novoPlano) {
                    setEditalAtivo(novoPlano);
                }
            }

            toast.success('Edital padrão ativado com sucesso!');
            closeDefaultEditalModal();
        } catch (err: any) {
            console.error('Erro ao ativar edital padrão:', err);
            toast.error(err.message || 'Não foi possível ativar o edital padrão.');
        } finally {
            setCloningId(null);
        }
    };

    return (
        <>
            <Modal
                isOpen={isDefaultEditalModalOpen}
                onClose={closeDefaultEditalModal}
                size="4xl"
            >
                <Modal.Header onClose={closeDefaultEditalModal}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                            <BookOpenIcon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Escolher Edital Padrão</h2>
                            <p className="text-sm text-muted-foreground">Clone um edital validado pela nossa equipe pedagógica</p>
                        </div>
                    </div>
                </Modal.Header>

                {/* Search and Actions Bar */}
                <div className="px-4 sm:px-6 py-4 bg-gradient-to-b from-muted/50 to-transparent border-b border-border space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, banca ou cargo..."
                                className="w-full bg-card border border-border text-foreground pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 placeholder-muted-foreground transition-all shadow-sm"
                            />
                        </div>
                        <button
                            onClick={fetchEditaisPadrao}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-muted text-foreground rounded-xl font-medium transition-all border border-border disabled:opacity-60 shadow-sm hover:shadow"
                        >
                            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Atualizar</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setIsSolicitarModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.99]"
                    >
                        <FileTextIcon className="w-4 h-4" />
                        Solicitar Inclusão de Edital
                    </button>
                </div>

                <Modal.Body className="space-y-3 min-h-[400px]">
                    {errorMessage && (
                        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl flex items-center gap-2">
                            <span className="text-red-400">⚠</span>
                            {errorMessage}
                        </div>
                    )}

                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-card border border-border rounded-2xl p-5">
                                    <div className="flex items-start gap-4">
                                        <Skeleton variant="avatar" width={48} height={48} />
                                        <div className="flex-1 space-y-3">
                                            <Skeleton variant="title" width="70%" />
                                            <div className="flex gap-2">
                                                <Skeleton width={80} height={24} />
                                                <Skeleton width={120} height={24} />
                                                <Skeleton width={60} height={24} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredEditais.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-4">
                            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                                <SearchIcon className="w-8 h-8 opacity-40" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-foreground mb-1">
                                    Nenhum edital encontrado
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {search ? `Não encontramos resultados para "${search}"` : 'Nenhum edital disponível'}
                                </p>
                                <button
                                    onClick={() => setIsSolicitarModalOpen(true)}
                                    className="mt-4 text-purple-400 hover:text-purple-300 font-medium text-sm"
                                >
                                    Solicitar inclusão de edital →
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground pb-2">
                                {filteredEditais.length} edital(is) encontrado(s)
                            </p>
                            {filteredEditais.map((edital) => (
                                <EditalCard
                                    key={edital.id}
                                    edital={edital}
                                    onActivate={() => handleActivate(edital.id)}
                                    isActivating={cloningId === edital.id}
                                />
                            ))}
                        </>
                    )}
                </Modal.Body>

                <Modal.Footer>
                    <button
                        onClick={closeDefaultEditalModal}
                        className="px-5 py-2.5 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </Modal.Footer>
            </Modal>

            <SolicitarEditalModal
                isOpen={isSolicitarModalOpen}
                onClose={() => setIsSolicitarModalOpen(false)}
                searchTerm={search}
            />
        </>
    );
};

type EditalCardProps = {
    edital: EditalDefault;
    onActivate: () => void;
    isActivating: boolean;
};

const EditalCard: React.FC<EditalCardProps> = ({ edital, onActivate, isActivating }) => (
    <div className="group relative bg-card border border-border rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5 hover:-translate-y-0.5">
        <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-purple-400 flex items-center justify-center group-hover:from-purple-500 group-hover:to-pink-500 group-hover:text-white transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/30">
                <BookOpenIcon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
                {/* Title */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground leading-tight group-hover:text-purple-400 transition-colors">
                            {edital.nome}
                        </h3>
                        {edital.observacoes && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {edital.observacoes}
                            </p>
                        )}
                    </div>
                    {edital.status_validacao === 'aprovado' && (
                        <Badge variant="success" size="xs" icon={<CheckCircle2Icon className="w-3 h-3" />}>
                            Validado
                        </Badge>
                    )}
                </div>

                {/* Meta Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="default" size="sm" icon={<LandmarkIcon className="w-3 h-3" />}>
                        {edital.banca || 'Banca não informada'}
                    </Badge>
                    <Badge variant="default" size="sm" icon={<UserIcon className="w-3 h-3" />}>
                        {edital.cargo || 'Cargo não informado'}
                    </Badge>
                    {edital.ano && (
                        <Badge variant="info" size="sm" icon={<CalendarDaysIcon className="w-3 h-3" />}>
                            {edital.ano}
                        </Badge>
                    )}
                </div>

                {/* Action Button */}
                <div className="mt-4 pt-4 border-t border-border/50 flex justify-end">
                    <button
                        onClick={onActivate}
                        disabled={isActivating}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-60 disabled:cursor-not-allowed group/btn"
                    >
                        {isActivating ? (
                            <>
                                <RefreshCwIcon className="w-4 h-4 animate-spin" />
                                Ativando...
                            </>
                        ) : (
                            <>
                                <BookCopyIcon className="w-4 h-4" />
                                Usar este edital
                                <ArrowRightIcon className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ActivateDefaultEditalModal;
