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
    XIcon,
    FileTextIcon
} from './icons';
import { toast } from './Sonner';
import SolicitarEditalModal from './SolicitarEditalModal';

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
        
        // Calcular score de afinidade baseado no edital ativo
        const calcularAfinidade = (edital: EditalDefault): number => {
            if (!editalAtivo) return 0;
            
            let score = 0;
            
            // Mesma banca = maior afinidade
            if (editalAtivo.banca && edital.banca && 
                editalAtivo.banca.toLowerCase() === edital.banca.toLowerCase()) {
                score += 2;
            }
            
            // Mesmo cargo = afinidade adicional
            if (editalAtivo.orgao && edital.cargo && 
                editalAtivo.orgao.toLowerCase().includes(edital.cargo.toLowerCase())) {
                score += 1;
            }
            
            return score;
        };
        
        // Ordenar primeiro por afinidade (maior score primeiro), depois alfabeticamente
        return [...filtered].sort((a, b) => {
            const afinidadeA = calcularAfinidade(a);
            const afinidadeB = calcularAfinidade(b);
            
            // Se afinidades diferentes, ordenar por afinidade (maior primeiro)
            if (afinidadeA !== afinidadeB) {
                return afinidadeB - afinidadeA;
            }
            
            // Se mesma afinidade, ordenar alfabeticamente
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

    if (!isDefaultEditalModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6" onClick={closeDefaultEditalModal}>
            <div
                className="bg-[#0f111a] w-full max-w-5xl h-[90vh] max-h-[820px] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between p-6 border-b border-slate-800 bg-[#131620]">
                    <div>
                        <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                            <BookOpenIcon className="w-6 h-6 text-purple-400" />
                            Escolher Edital Padrão
                        </h2>
                        <p className="text-sm text-slate-400 mt-1">Clone um edital validado pela nossa equipe pedagógica para acelerar seus estudos.</p>
                    </div>
                    <button
                        onClick={closeDefaultEditalModal}
                        className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label="Fechar modal"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 bg-[#0f111a] border-b border-slate-800 flex flex-col gap-3 sticky top-0 z-10">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <SearchIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, banca ou cargo..."
                                className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 placeholder-slate-500 transition-all"
                            />
                        </div>
                        <button
                            onClick={fetchEditaisPadrao}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition-colors border border-slate-700 disabled:opacity-60"
                        >
                            <RefreshCwIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Atualizar lista</span>
                        </button>
                    </div>
                    <button
                        onClick={() => setIsSolicitarModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-purple-900/30"
                    >
                        <FileTextIcon className="w-4 h-4" />
                        Solicitar Inclusão de Edital
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0b0d14] custom-scrollbar">
                    {errorMessage && (
                        <div className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-lg">{errorMessage}</div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-2">
                            <RefreshCwIcon className="w-6 h-6 animate-spin" />
                            Carregando editais padrão...
                        </div>
                    ) : filteredEditais.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-4">
                            <SearchIcon className="w-12 h-12 opacity-20" />
                            <div className="text-center">
                                <p className="text-lg font-medium text-slate-400 mb-2">
                                    Nenhum edital encontrado para &quot;{search}&quot;
                                </p>
                                <p className="text-sm text-slate-500">
                                    Use o botão acima para solicitar a inclusão de um novo edital.
                                </p>
                            </div>
                        </div>
                    ) : (
                        filteredEditais.map((edital) => (
                            <EditalCard
                                key={edital.id}
                                edital={edital}
                                onActivate={() => handleActivate(edital.id)}
                                isActivating={cloningId === edital.id}
                            />
                        ))
                    )}
                </div>

                <div className="p-4 bg-[#131620] border-t border-slate-800 flex justify-end">
                    <button
                        onClick={closeDefaultEditalModal}
                        className="px-5 py-2.5 text-slate-300 hover:text-white font-medium rounded-lg transition-colors border border-transparent hover:border-slate-700"
                    >
                        Fechar
                    </button>
                </div>
            </div>
            
            <SolicitarEditalModal
                isOpen={isSolicitarModalOpen}
                onClose={() => setIsSolicitarModalOpen(false)}
                searchTerm={search}
            />
        </div>
    );
};

const MetaTag: React.FC<{ icon: React.FC<{ className?: string }>; label: string | null; muted?: boolean }> = ({ icon: IconComponent, label, muted }) => (
    <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
            muted ? 'bg-slate-800/50 text-slate-500 border-slate-800' : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}
    >
        <IconComponent className="w-3.5 h-3.5" />
        <span className="truncate max-w-[160px]">{label ?? 'Não informado'}</span>
    </div>
);

type EditalCardProps = {
    edital: EditalDefault;
    onActivate: () => void;
    isActivating: boolean;
};

const EditalCard: React.FC<EditalCardProps> = ({ edital, onActivate, isActivating }) => (
    <div className="group relative bg-[#161b26] border border-slate-800 rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-900/10">
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-purple-600/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <BookOpenIcon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white leading-tight group-hover:text-purple-300 transition-colors">
                            {edital.nome}
                        </h3>
                        {edital.observacoes && <p className="text-sm text-slate-400 mt-1">{edital.observacoes}</p>}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                    <MetaTag icon={LandmarkIcon} label={edital.banca || 'Banca não informada'} />
                    <MetaTag icon={UserIcon} label={edital.cargo || 'Cargo não informado'} />
                    <MetaTag icon={CalendarDaysIcon} label={edital.ano ? String(edital.ano) : 'Ano não informado'} muted={!edital.ano} />
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800/60 flex justify-end">
                    <button
                        onClick={onActivate}
                        disabled={isActivating}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-lg font-medium transition-all active:scale-[0.98] shadow-lg shadow-purple-900/30 disabled:opacity-60"
                    >
                        {isActivating ? (
                            'Ativando...'
                        ) : (
                            <>
                                <BookCopyIcon className="w-4 h-4" />
                                Usar este edital
                                <ArrowRightIcon className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
);

export default ActivateDefaultEditalModal;
