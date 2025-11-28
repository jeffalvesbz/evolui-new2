import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from './Sonner';
import { useUiStore } from '../stores/useUiStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { scheduleAutoRevisoes } from '../hooks/useAutoRevisoes';
import { BookOpenIcon, XIcon, ClockIcon, SaveIcon, SparklesIcon, PlusIcon } from './icons';
import { startOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sortTopicosPorNumero } from '../utils/sortTopicos';

interface SalvarSessaoFormData {
  categoria: 'Teoria' | 'Questões' | 'Revisão' | 'Simulado';
  disciplinaId: string;
  topico: string;
  materialUtilizado: string;
  paginaInicial: string;
  paginaFinal: string;
  comentarios: string;
  gerarRevisoes: boolean;
  teoriaFinalizada: boolean;
  contabilizarPlanejamento: boolean;
}

const SalvarSessaoModal: React.FC = () => {
    const { isSaveModalOpen, closeSaveModal } = useUiStore();
    const { 
        sessaoAtual, 
        salvarSessao, 
        descartarSessao, 
        getTrilhaSemana, 
        toggleTopicoConcluidoNaTrilha,
        isTopicoConcluidoNaTrilha,
        semanaAtualKey,
        trilhasPorSemana
    } = useEstudosStore();
    const { disciplinas, updateTopico } = useDisciplinasStore();

    const [editableHours, setEditableHours] = useState(0);
    const [editableMinutes, setEditableMinutes] = useState(0);
    const [intervalosRevisao, setIntervalosRevisao] = useState<number[]>([1, 7, 30, 60]);
    const [novoIntervalo, setNovoIntervalo] = useState<string>('');
    const [mostrarInputNovoIntervalo, setMostrarInputNovoIntervalo] = useState(false);
    
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<SalvarSessaoFormData>({
        defaultValues: {
          categoria: 'Teoria',
          disciplinaId: '',
          topico: '',
          materialUtilizado: '',
          paginaInicial: '',
          paginaFinal: '',
          comentarios: '',
          gerarRevisoes: true,
          teoriaFinalizada: false,
          contabilizarPlanejamento: true,
        },
    });

    const comentariosValue = watch('comentarios');
    const disciplinaIdSelecionada = watch('disciplinaId');
    const topicoSelecionado = watch('topico');

    const topicosDaDisciplina = useMemo(() => {
        if (!disciplinaIdSelecionada) return [];
        const disciplina = disciplinas.find(d => d.id === disciplinaIdSelecionada);
        const topicos = disciplina?.topicos || [];
        return sortTopicosPorNumero(topicos);
    }, [disciplinaIdSelecionada, disciplinas]);
    
    useEffect(() => {
        if (isSaveModalOpen && sessaoAtual) {
            // Determinar valores iniciais para disciplina e tópico
            const disciplinaIdInicial = sessaoAtual.topico.disciplinaId || '';
            const topicoInicial = (sessaoAtual.topico.disciplinaId && !sessaoAtual.topico.id.startsWith('manual-')) 
                ? sessaoAtual.topico.nome 
                : '';
            
            // Determinar se teoria finalizada deve estar marcada
            const teoriaFinalizadaInicial = sessaoAtual.isConclusaoRapida && !sessaoAtual.topico.id.startsWith('manual-');
            
            reset({
              categoria: 'Teoria',
              disciplinaId: disciplinaIdInicial,
              topico: topicoInicial,
              materialUtilizado: '',
              paginaInicial: '',
              paginaFinal: '',
              comentarios: '',
              gerarRevisoes: true,
              teoriaFinalizada: teoriaFinalizadaInicial,
              contabilizarPlanejamento: true,
            });
            
            // Resetar intervalos para os padrão quando o modal abrir
            setIntervalosRevisao([1, 7, 30, 60]);
            setNovoIntervalo('');
            setMostrarInputNovoIntervalo(false);

            let totalSeconds = 0;
            if (sessaoAtual.mode === 'cronometro') {
                totalSeconds = sessaoAtual.elapsedSeconds;
            } else { // Pomodoro
                totalSeconds = sessaoAtual.workSecondsAccumulated;
                if (sessaoAtual.pomodoroStage === 'work') {
                    totalSeconds += sessaoAtual.elapsedSeconds;
                }
            }
            
            setEditableHours(Math.floor(totalSeconds / 3600));
            setEditableMinutes(Math.floor((totalSeconds % 3600) / 60));
        }
    }, [isSaveModalOpen, reset, sessaoAtual]);

    // Garantir que o tópico seja selecionado após os tópicos da disciplina carregarem
    useEffect(() => {
        if (isSaveModalOpen && sessaoAtual && disciplinaIdSelecionada && topicosDaDisciplina.length > 0) {
            const topicoAtual = watch('topico');
            const topicoEsperado = sessaoAtual.topico.nome;
            
            // Se a disciplina está selecionada mas o tópico ainda não foi definido corretamente
            if (disciplinaIdSelecionada === sessaoAtual.topico.disciplinaId && 
                topicoAtual !== topicoEsperado && 
                !sessaoAtual.topico.id.startsWith('manual-')) {
                // Verificar se o tópico existe na lista de tópicos da disciplina
                const topicoExiste = topicosDaDisciplina.some(t => t.titulo === topicoEsperado);
                if (topicoExiste) {
                    setValue('topico', topicoEsperado);
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSaveModalOpen, sessaoAtual, disciplinaIdSelecionada, topicosDaDisciplina, setValue]);

    const onSubmit = async (data: SalvarSessaoFormData) => {
        if (!sessaoAtual) return;

        const disciplina = disciplinas.find(d => d.id === data.disciplinaId);
        if (!disciplina) {
            toast.error("Disciplina não encontrada.");
            return;
        }

        const targetTopic = disciplina.topicos.find(t => t.titulo === data.topico);
        if (!targetTopic) {
            toast.error("Tópico não encontrado. Cadastre-o no edital ou selecione um tópico válido.");
            return;
        }

        if (data.gerarRevisoes && intervalosRevisao.length === 0) {
            toast.error("Selecione pelo menos um intervalo de revisão ou desmarque a opção 'PROGRAMAR REVISÕES'.");
            return;
        }

        const tempoParaSalvar = (editableHours * 3600) + (editableMinutes * 60);

        await salvarSessao({
          topico_id: targetTopic.id,
          comentarios: data.comentarios,
        }, tempoParaSalvar);
        
        if (data.teoriaFinalizada) {
            await updateTopico(disciplina.id, targetTopic.id, { concluido: true });
        }

        if (data.gerarRevisoes && intervalosRevisao.length > 0) {
            await scheduleAutoRevisoes({
                disciplinaId: disciplina.id,
                disciplinaNome: disciplina.nome,
                topicoId: targetTopic.id,
                topicoNome: targetTopic.titulo,
                intervals: intervalosRevisao,
            });
        }

        // Marcar como concluído na trilha se "contabilizarPlanejamento" estiver marcado
        if (data.contabilizarPlanejamento) {
            // Obter a chave da semana atual
            const weekKeyAtual = semanaAtualKey || format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            
            // IDs de tópico a verificar (o selecionado no formulário e o original da sessão)
            const topicIdsToCheck = [targetTopic.id];
            if (sessaoAtual.topico.id && sessaoAtual.topico.id !== targetTopic.id && !sessaoAtual.topico.id.startsWith('manual-')) {
                topicIdsToCheck.push(sessaoAtual.topico.id);
            }
            
            const diasSemana = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
            let encontrado = false;
            
            // Função auxiliar para marcar como concluído (não faz toggle, apenas marca)
            const marcarComoConcluido = (weekKey: string, diaId: string, topicId: string) => {
                const state = useEstudosStore.getState();
                const key = `${weekKey}-${diaId}-${topicId}`;
                // Só atualiza se não estiver já marcado
                if (!state.trilhaConclusao[key]) {
                    const novasConclusoes = { ...state.trilhaConclusao };
                    novasConclusoes[key] = true;
                    useEstudosStore.setState({ trilhaConclusao: novasConclusoes });
                    
                    // Salvar no banco de dados em segundo plano
                    const saveFunction = useEstudosStore.getState().saveTrilhasToDb;
                    setTimeout(() => {
                        saveFunction().catch(err => {
                            console.error("Erro ao salvar trilhas no banco:", err);
                        });
                    }, 500);
                    
                    // Estado atualizado com sucesso
                }
            };
            
            // Primeiro, verificar na semana atual
            const trilhaAtual = getTrilhaSemana(weekKeyAtual);
            for (const diaId of diasSemana) {
                const topicosDoDia = trilhaAtual[diaId] || [];
                for (const topicId of topicIdsToCheck) {
                    if (topicosDoDia.includes(topicId)) {
                        marcarComoConcluido(weekKeyAtual, diaId, topicId);
                        encontrado = true;
                        break;
                    }
                }
                if (encontrado) break;
            }
            
            // Se não encontrou na semana atual, buscar em todas as semanas
            if (!encontrado) {
                for (const [weekKey, trilha] of Object.entries(trilhasPorSemana)) {
                    for (const diaId of diasSemana) {
                        const topicosDoDia = trilha[diaId] || [];
                        for (const topicId of topicIdsToCheck) {
                            if (topicosDoDia.includes(topicId)) {
                                marcarComoConcluido(weekKey, diaId, topicId);
                                encontrado = true;
                                break;
                            }
                        }
                        if (encontrado) break;
                    }
                    if (encontrado) break;
                }
            }
        }

        toast.success("Estudo salvo com sucesso!");
        
        // Fechar o modal após salvar
        closeSaveModal();
    };

    if (!isSaveModalOpen || !sessaoAtual) return null;

    return (
        <>
            <style>{`
                /* Limitar altura do dropdown de select para evitar que ultrapasse a tela */
                select {
                    max-height: 40px;
                }
                /* Garantir que o dropdown respeite os limites do modal */
                form select:focus {
                    position: relative;
                    z-index: 1;
                }
                /* Truncar opções do select dentro do dropdown */
                select option {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    padding: 8px 12px;
                }
                /* Limitar altura máxima do select de tópico */
                form select[name="topico"] {
                    max-width: 100%;
                    box-sizing: border-box;
                }
                /* Garantir que o container do select não ultrapasse os limites */
                form select[name="topico"] {
                    position: relative;
                }
                /* Limitar o tamanho do texto exibido no select */
                form select[name="topico"] option {
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
            `}</style>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={descartarSessao}>
                <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-2xl my-auto max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-bold">Salvar e Encerrar Estudo</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 rounded-lg">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="number"
                            aria-label="Horas"
                            value={editableHours}
                             onChange={(e) => {
                                const hours = parseInt(e.target.value, 10);
                                setEditableHours(isNaN(hours) || hours < 0 ? 0 : hours);
                            }}
                            className="w-12 bg-input border border-border focus:border-primary focus:ring-0 text-center font-mono font-semibold rounded-md p-1 text-foreground"
                            min="0"
                        />
                        <span className="font-bold text-muted-foreground">:</span>
                        <input
                            type="number"
                            aria-label="Minutos"
                            value={String(editableMinutes).padStart(2, '0')}
                            onFocus={e => e.target.select()}
                             onChange={(e) => {
                                const minutes = parseInt(e.target.value, 10);
                                setEditableMinutes(isNaN(minutes) || minutes < 0 ? 0 : Math.min(minutes, 59));
                            }}
                           className="w-12 bg-input border border-border focus:border-primary focus:ring-0 text-center font-mono font-semibold rounded-md p-1 text-foreground"
                            min="0" max="59"
                        />
                    </div>
                </header>

                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overflow-x-hidden">
                    {sessaoAtual.isConclusaoRapida && (
                        <div className="p-3 bg-primary/10 rounded-lg text-primary text-xs flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 flex-shrink-0" />
                            <span><b>Dica:</b> Ative o cronometro em seu próximo estudo para registrar automaticamente seu tempo e acompanhar sua evolução.</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Categoria *</label>
                            <select {...register('categoria')} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary">
                                <option>Teoria</option><option>Questões</option><option>Revisão</option><option>Simulado</option>
                            </select>
                        </div>
                        <div>
                           <label className="text-sm font-medium text-muted-foreground mb-1 block">Disciplina *</label>
                            <select {...register('disciplinaId', { required: true })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary">
                                <option value="">Selecione a disciplina</option>
                                {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                            </select>
                            {errors.disciplinaId && <p className="text-xs text-red-500 mt-1">Campo obrigatório</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Tópico *</label>
                            <div className="relative group w-full overflow-hidden">
                                <select 
                                    {...register('topico', { required: true })} 
                                    disabled={!disciplinaIdSelecionada} 
                                    className="w-full bg-input border border-border rounded-md px-3 py-2 pr-8 text-sm text-foreground focus:ring-primary focus:border-primary disabled:opacity-50 appearance-none truncate"
                                    style={{
                                        textOverflow: 'ellipsis',
                                        overflow: 'hidden',
                                        whiteSpace: 'nowrap',
                                        maxWidth: '100%',
                                        width: '100%',
                                        boxSizing: 'border-box'
                                    }}
                                >
                                    <option value="">Selecione o tópico</option>
                                    {topicosDaDisciplina.map(t => (
                                        <option key={t.id} value={t.titulo} title={t.titulo}>
                                            {t.titulo.length > 80 ? `${t.titulo.substring(0, 80)}...` : t.titulo}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                {/* Tooltip com tópico completo ao passar o mouse */}
                                {topicoSelecionado && topicoSelecionado.length > 50 && (
                                    <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-card border border-border rounded-lg shadow-lg text-xs text-foreground max-w-md z-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-normal break-words">
                                        {topicoSelecionado}
                                    </div>
                                )}
                            </div>
                            {errors.topico && <p className="text-xs text-red-500 mt-1">Campo obrigatório</p>}
                        </div>
                         <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Material utilizado</label>
                            <input {...register('materialUtilizado')} placeholder="Ex: PDF, livro, Video Aula" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pág. inicial</label>
                                <input {...register('paginaInicial')} type="number" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                            </div>
                             <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pág. final</label>
                                <input {...register('paginaFinal')} type="number" className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Comentários</label>
                            <textarea {...register('comentarios')} rows={4} placeholder="Observações sobre o estudo, pontos de dúvida, etc." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"></textarea>
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-border">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                                <input 
                                    type="checkbox" 
                                    {...register('gerarRevisoes')} 
                                    className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary" 
                                /> 
                                PROGRAMAR REVISÕES
                            </label>
                            
                            {watch('gerarRevisoes') && (
                                <div className="ml-6 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {intervalosRevisao.map((intervalo, index) => (
                                            <div 
                                                key={index}
                                                className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium"
                                            >
                                                <span>{intervalo}d</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIntervalosRevisao(prev => prev.filter((_, i) => i !== index));
                                                    }}
                                                    className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                                                >
                                                    <XIcon className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {!mostrarInputNovoIntervalo ? (
                                            <button
                                                type="button"
                                                onClick={() => setMostrarInputNovoIntervalo(true)}
                                                className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                                            >
                                                <PlusIcon className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    value={novoIntervalo}
                                                    onChange={(e) => setNovoIntervalo(e.target.value)}
                                                    placeholder="dias"
                                                    className="w-20 bg-input border border-border rounded-md px-2 py-1 text-sm text-foreground focus:ring-primary focus:border-primary"
                                                    min="1"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            const valor = parseInt(novoIntervalo);
                                                            if (valor > 0 && !intervalosRevisao.includes(valor)) {
                                                                setIntervalosRevisao(prev => [...prev, valor].sort((a, b) => a - b));
                                                                setNovoIntervalo('');
                                                                setMostrarInputNovoIntervalo(false);
                                                            }
                                                        } else if (e.key === 'Escape') {
                                                            setMostrarInputNovoIntervalo(false);
                                                            setNovoIntervalo('');
                                                        }
                                                    }}
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const valor = parseInt(novoIntervalo);
                                                        if (valor > 0 && !intervalosRevisao.includes(valor)) {
                                                            setIntervalosRevisao(prev => [...prev, valor].sort((a, b) => a - b));
                                                            setNovoIntervalo('');
                                                            setMostrarInputNovoIntervalo(false);
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-primary text-primary-foreground rounded-md text-xs hover:bg-primary/90 transition-colors"
                                                >
                                                    Adicionar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setMostrarInputNovoIntervalo(false);
                                                        setNovoIntervalo('');
                                                    }}
                                                    className="px-2 py-1 bg-muted text-muted-foreground rounded-md text-xs hover:bg-muted/80 transition-colors"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {intervalosRevisao.length === 0 && (
                                        <p className="text-xs text-muted-foreground">Adicione pelo menos um intervalo de revisão</p>
                                    )}
                                </div>
                            )}
                        </div>
                        <label className="flex items-center gap-2 text-sm">
                            <input 
                                type="checkbox" 
                                {...register('teoriaFinalizada')} 
                                disabled={sessaoAtual.isConclusaoRapida && !sessaoAtual.topico.id.startsWith('manual-')}
                                className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary disabled:opacity-70" 
                            /> 
                            Teoria finalizada
                        </label>
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('contabilizarPlanejamento')} className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary" /> Contabilizar no planejamento</label>
                    </div>
                </div>

                <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
                    <button type="button" onClick={descartarSessao} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
                    <button type="submit" className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
                        <SaveIcon className="w-4 h-4" /> Salvar estudo
                    </button>
                </footer>
            </form>
        </div>
        </>
    );
};

export default SalvarSessaoModal;
