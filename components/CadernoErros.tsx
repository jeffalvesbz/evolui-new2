import React, { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useModalStore } from '../stores/useModalStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useEditalStore } from '../stores/useEditalStore';
import { CadernoErro, NivelDificuldade, Topico } from '../types';
import { BookCopyIcon, PlusCircleIcon, SearchIcon, FilterIcon, EditIcon, Trash2Icon, CheckCircle2Icon, AlertCircleIcon, XIcon, SaveIcon, AlertTriangleIcon } from './icons';
import { toast } from './Sonner';
import { addDays } from 'date-fns';

type FormData = Omit<CadernoErro, 'id' | 'revisoes'>;

const NIVEIS_DIFICULDADE: NivelDificuldade[] = ['fácil', 'médio', 'difícil'];

// --- Modal de Adicionar/Editar Erro ---
const ErroFormModal: React.FC = () => {
    const { isErroModalOpen, erroEmEdicao, closeErroModal } = useModalStore();
    const { addErro, updateErro } = useCadernoErrosStore();
    const { disciplinas } = useDisciplinasStore();
    
    const [topicosFiltrados, setTopicosFiltrados] = useState<Topico[]>([]);

    const { register, handleSubmit, control, reset, watch } = useForm<FormData>();
    const disciplinaIdSelecionada = watch('disciplinaId');

    useEffect(() => {
        if (isErroModalOpen) {
            if (erroEmEdicao) {
                const disciplinaId = erroEmEdicao.disciplinaId || disciplinas.find(d => d.nome === erroEmEdicao.disciplina)?.id;
                reset({ ...erroEmEdicao, disciplinaId, data: new Date(erroEmEdicao.data).toISOString().split('T')[0] });
            } else {
                reset({
                    disciplina: '',
                    assunto: '',
                    descricao: '',
                    resolvido: false,
                    data: new Date().toISOString().split('T')[0],
                    nivelDificuldade: 'médio',
                    observacoes: ''
                });
            }
        }
    }, [isErroModalOpen, erroEmEdicao, reset, disciplinas]);
    
     useEffect(() => {
        if (disciplinaIdSelecionada) {
            const disciplina = disciplinas.find(d => d.id === disciplinaIdSelecionada);
            setTopicosFiltrados(disciplina?.topicos || []);
        } else {
            setTopicosFiltrados([]);
        }
    }, [disciplinaIdSelecionada, disciplinas]);

    const onSubmit = async (data: FormData) => {
        const disciplinaSelecionada = disciplinas.find(d => d.id === data.disciplinaId);
        if (!disciplinaSelecionada || !data.topicoId) {
            toast.error("Por favor, selecione uma disciplina e um tópico válidos.");
            return;
        }

        const topicoSelecionado = disciplinaSelecionada.topicos.find(t => t.id === data.topicoId);

        const payload: CadernoErro = {
            ...data,
            id: erroEmEdicao?.id || '', // será ignorado se for criação
            disciplina: disciplinaSelecionada.nome,
            topicoTitulo: topicoSelecionado?.titulo || 'Tópico não encontrado',
            data: new Date(data.data).toISOString(),
        };

        try {
            if (erroEmEdicao) {
                await updateErro(erroEmEdicao.id, payload);
                toast.success("Erro atualizado com sucesso!");
            } else {
                await addErro(payload);
                toast.success("Erro registrado com sucesso!");
            }
            closeErroModal();
        } catch (error) {
            toast.error("Falha ao salvar o erro.");
            console.error(error);
        }
    };

    if (!isErroModalOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/[0.999] backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={closeErroModal}>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-card/90 backdrop-blur-xl rounded-xl border border-border shadow-2xl w-full max-w-2xl my-auto max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="text-lg font-bold">{erroEmEdicao ? 'Editar Erro' : 'Registrar Novo Erro'}</h2>
                    <button type="button" onClick={closeErroModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
                </header>
                <main className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Controller
                            name="disciplinaId"
                            control={control}
                            rules={{ required: "Selecione uma disciplina" }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Disciplina *</label>
                                    <select {...field} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground">
                                        <option value="">-- Selecione --</option>
                                        {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                    </select>
                                    {fieldState.error && <p className="text-xs text-red-500 mt-1">{fieldState.error.message}</p>}
                                </div>
                            )}
                        />
                         <Controller
                            name="topicoId"
                            control={control}
                            rules={{ required: "Selecione um tópico" }}
                            render={({ field, fieldState }) => (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Tópico do Edital *</label>
                                    <select {...field} disabled={!disciplinaIdSelecionada} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50">
                                        <option value="">-- Selecione --</option>
                                        {topicosFiltrados.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
                                    </select>
                                    {fieldState.error && <p className="text-xs text-red-500 mt-1">{fieldState.error.message}</p>}
                                </div>
                            )}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Assunto *</label>
                        <input {...register('assunto', { required: true })} placeholder="Ex: Crase facultativa" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Descrição do Erro *</label>
                        <textarea {...register('descricao', { required: true })} rows={3} placeholder="Descreva o que você errou, qual foi seu raciocínio, etc." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"></textarea>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Observações / Como resolver</label>
                        <textarea {...register('observacoes')} rows={3} placeholder="Anote a forma correta, um macete, ou o que for preciso para não errar mais." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"></textarea>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="text-sm font-medium text-muted-foreground mb-1 block">Nível de Dificuldade</label>
                            <select {...register('nivelDificuldade')} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground">
                                {NIVEIS_DIFICULDADE.map(n => <option key={n} value={n}>{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Data</label>
                            <input type="date" {...register('data')} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"/>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('resolvido')} className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary" /> Marcar como resolvido</label>
                </main>
                <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <button type="button" onClick={closeErroModal} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
                    <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                        <SaveIcon className="w-4 h-4" /> Salvar
                    </button>
                </footer>
            </form>
        </div>
    );
}

// --- Card de Erro ---
const ErroCard: React.FC<{ erro: CadernoErro; onEdit: (e: CadernoErro) => void; onDelete: (id: string) => void; onToggle: (e: CadernoErro) => void; }> = ({ erro, onEdit, onDelete, onToggle }) => {
    const dificuldadeStyle = {
        'fácil': 'bg-green-500/10 text-green-400',
        'médio': 'bg-yellow-500/10 text-yellow-400',
        'difícil': 'bg-red-500/10 text-red-400',
    }[erro.nivelDificuldade || 'médio'];

    return (
        <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -50 }} className="bg-card rounded-xl border border-border shadow-sm transition-all hover:border-primary/50">
            <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-primary">{erro.disciplina}</p>
                        <h3 className="font-bold text-foreground">{erro.assunto}</h3>
                        <p className="text-xs text-muted-foreground">{erro.topicoTitulo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${dificuldadeStyle}`}>{erro.nivelDificuldade}</span>
                        {erro.resolvido ? 
                            <span className="flex items-center gap-1 text-xs font-semibold text-secondary"><CheckCircle2Icon className="w-4 h-4"/> Resolvido</span> :
                            <span className="flex items-center gap-1 text-xs font-semibold text-yellow-400"><AlertCircleIcon className="w-4 h-4"/> Pendente</span>
                        }
                    </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 py-3 border-y border-border">{erro.descricao}</p>
                {erro.observacoes && <p className="text-sm text-foreground bg-muted/30 p-3 mt-3 rounded-lg">{erro.observacoes}</p>}
            </div>
            <div className="p-2 bg-muted/20 border-t border-border flex justify-between items-center">
                 <p className="text-xs text-muted-foreground px-2">Registrado em: {new Date(erro.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</p>
                 <div className="flex items-center gap-1">
                    <button onClick={() => onToggle(erro)} className="px-3 py-1.5 text-xs font-semibold rounded-md hover:bg-muted">{erro.resolvido ? 'Marcar Pendente' : 'Marcar Resolvido'}</button>
                    <button onClick={() => onEdit(erro)} className="p-2 rounded-md hover:bg-muted"><EditIcon className="w-4 h-4 text-muted-foreground"/></button>
                    <button onClick={() => onDelete(erro.id)} className="p-2 rounded-md hover:bg-muted"><Trash2Icon className="w-4 h-4 text-red-500"/></button>
                 </div>
            </div>
        </motion.div>
    );
};

// --- Componente Principal ---
const CadernoErros: React.FC = () => {
    const { editalAtivo } = useEditalStore();
    const { erros, removeErro, updateErro, fetchErros } = useCadernoErrosStore();
    const { addRevisao } = useRevisoesStore();
    const { openErroModal } = useModalStore();
    
    const [filtroStatus, setFiltroStatus] = useState<'todos' | 'resolvido' | 'pendente'>('todos');
    const [filtroDisciplina, setFiltroDisciplina] = useState('todas');
    const [busca, setBusca] = useState('');
    const [erroParaExcluir, setErroParaExcluir] = useState<CadernoErro | null>(null);

    // Garantir que os erros sejam carregados quando o componente é montado ou quando o edital muda
    useEffect(() => {
        if (editalAtivo?.id) {
            fetchErros(editalAtivo.id).catch(err => {
                console.error("Erro ao carregar erros:", err);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editalAtivo?.id]);

    const disciplinas = useMemo(() => [...new Set(erros.map(e => e.disciplina))], [erros]);

    const errosFiltrados = useMemo(() => {
        return erros
            .filter(e => {
                if (filtroStatus === 'todos') return true;
                return filtroStatus === 'resolvido' ? e.resolvido : !e.resolvido;
            })
            .filter(e => filtroDisciplina === 'todas' || e.disciplina === filtroDisciplina)
            .filter(e => 
                e.assunto.toLowerCase().includes(busca.toLowerCase()) ||
                e.descricao.toLowerCase().includes(busca.toLowerCase()) ||
                e.disciplina.toLowerCase().includes(busca.toLowerCase())
            )
            .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    }, [erros, filtroStatus, filtroDisciplina, busca]);

    const handleToggleStatus = async (erro: CadernoErro) => {
        const isResolving = !erro.resolvido;
        await updateErro(erro.id, { resolvido: isResolving });
        toast.success(`Erro marcado como ${isResolving ? 'resolvido' : 'pendente'}.`);

        if (isResolving && erro.topicoId && erro.disciplinaId) {
            setTimeout(() => {
                if (window.confirm(`Deseja agendar uma revisão futura sobre "${erro.assunto}" para garantir a fixação?`)) {
                    addRevisao({
                        topico_id: erro.topicoId!,
                        disciplinaId: erro.disciplinaId!,
                        conteudo: `Revisar erro: ${erro.assunto}`,
                        data_prevista: addDays(new Date(), 7).toISOString(),
                        status: 'pendente',
                        origem: 'teorica',
                        dificuldade: erro.nivelDificuldade || 'médio',
                    }).then(() => {
                        toast.success("Revisão teórica agendada para daqui a 7 dias.");
                    }).catch(() => {
                        toast.error("Falha ao agendar revisão.");
                    });
                }
            }, 300);
        }
    };
    
    const confirmarExclusao = async () => {
        if (erroParaExcluir) {
            await removeErro(erroParaExcluir.id);
            toast.success("Erro removido com sucesso.");
            setErroParaExcluir(null);
        }
    };

    return (
        <div data-tutorial="erros-content" className="max-w-7xl mx-auto space-y-6">
            <ErroFormModal />
            <header className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><BookCopyIcon className="w-8 h-8"/> Caderno de Erros</h1>
                    <p className="text-muted-foreground mt-1">Transforme seus erros em aprendizado contínuo.</p>
                </div>
                <button onClick={() => openErroModal()} className="h-10 px-4 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    <PlusCircleIcon className="w-4 h-4" />
                    Registrar Erro
                </button>
            </header>
            
            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/>
                    <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por assunto, descrição..." className="w-full bg-input border border-border rounded-md px-3 py-2 pl-9 text-sm text-foreground"/>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center gap-2">
                         <label className="text-sm font-semibold text-muted-foreground">Status:</label>
                         <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value as any)} className="bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground">
                             <option value="todos">Todos</option>
                             <option value="pendente">Pendentes</option>
                             <option value="resolvido">Resolvidos</option>
                         </select>
                    </div>
                     <div className="flex items-center gap-2">
                         <label className="text-sm font-semibold text-muted-foreground">Disciplina:</label>
                         <select value={filtroDisciplina} onChange={e => setFiltroDisciplina(e.target.value)} className="bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground">
                             <option value="todas">Todas</option>
                             {disciplinas.map(d => <option key={d} value={d}>{d}</option>)}
                         </select>
                    </div>
                </div>
            </div>

            <section>
                <AnimatePresence>
                    {errosFiltrados.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {errosFiltrados.map(erro => (
                                <ErroCard key={erro.id} erro={erro} onEdit={() => openErroModal(erro)} onDelete={() => setErroParaExcluir(erro)} onToggle={handleToggleStatus} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 bg-card rounded-xl border-2 border-dashed border-border">
                            <BookCopyIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <h3 className="text-xl font-semibold text-foreground">Nenhum erro encontrado</h3>
                            <p className="text-muted-foreground mt-2">Clique em "Registrar Erro" para começar a adicionar.</p>
                        </div>
                    )}
                </AnimatePresence>
            </section>
            
            {/* Delete Confirmation Modal */}
            {erroParaExcluir && (
                <div className="fixed inset-0 bg-background/[0.999] backdrop-blur-md z-[101] flex items-center justify-center p-4">
                     <div className="bg-card rounded-xl border border-red-500/50 shadow-2xl w-full max-w-md p-6 text-center">
                        <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4"/>
                        <h3 className="text-lg font-bold">Confirmar Exclusão</h3>
                        <p className="text-muted-foreground mt-2 mb-6">Tem certeza que deseja remover o erro sobre "{erroParaExcluir.assunto}"? Esta ação é irreversível.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setErroParaExcluir(null)} className="h-10 px-6 rounded-lg border border-border font-semibold hover:bg-muted">Cancelar</button>
                            <button onClick={confirmarExclusao} className="h-10 px-6 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700">Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CadernoErros;