import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from './Sonner';
import { useUiStore } from '../stores/useUiStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { suggestTopics } from '../services/geminiService';
import { scheduleAutoRevisoes } from '../hooks/useAutoRevisoes';
import { BookOpenIcon, XIcon, ClockIcon, SaveIcon, SparklesIcon } from './icons';

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
    const { sessaoAtual, salvarSessao, descartarSessao } = useEstudosStore();
    const { disciplinas, updateTopico } = useDisciplinasStore();

    const [editableHours, setEditableHours] = useState(0);
    const [editableMinutes, setEditableMinutes] = useState(0);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    
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

    const topicosDaDisciplina = useMemo(() => {
        if (!disciplinaIdSelecionada) return [];
        const disciplina = disciplinas.find(d => d.id === disciplinaIdSelecionada);
        return disciplina?.topicos || [];
    }, [disciplinaIdSelecionada, disciplinas]);
    
    useEffect(() => {
        if (isSaveModalOpen && sessaoAtual) {
            reset({
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
            });
            setSuggestedTopics([]);

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
            
            if(sessaoAtual.topico.disciplinaId) {
                setValue('disciplinaId', sessaoAtual.topico.disciplinaId);
                // Pré-seleciona o tópico apenas se não for um estudo manual genérico
                if (!sessaoAtual.topico.id.startsWith('manual-')) {
                     setValue('topico', sessaoAtual.topico.nome);
                }
            }
             if (sessaoAtual.isConclusaoRapida && !sessaoAtual.topico.id.startsWith('manual-')) {
                setValue('teoriaFinalizada', true);
            }
        }
    }, [isSaveModalOpen, reset, sessaoAtual, setValue, disciplinas]);


    const handleSuggestTopics = async () => {
        if (!comentariosValue.trim()) {
          toast.error('Escreva um comentário sobre o estudo para gerar sugestões.');
          return;
        }
        setIsLoadingSuggestions(true);
        try {
          const topics = await suggestTopics(comentariosValue);
          setSuggestedTopics(topics);
          toast.success('Sugestões geradas com IA!');
        } catch (error) {
          toast.error('Falha ao gerar sugestões.');
        } finally {
          setIsLoadingSuggestions(false);
        }
    };
    
    const handleTopicClick = (topic: string) => {
        const currentTopic = watch('topico');
        const newTopic = currentTopic ? `${currentTopic}, ${topic}` : topic;
        setValue('topico', newTopic.split(', ').filter((v, i, a) => a.indexOf(v) === i).join(', '));
    };

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

        const tempoParaSalvar = (editableHours * 3600) + (editableMinutes * 60);

        await salvarSessao({
          topico_id: targetTopic.id,
          comentarios: data.comentarios,
        }, tempoParaSalvar);
        
        if (data.teoriaFinalizada) {
            await updateTopico(disciplina.id, targetTopic.id, { concluido: true });
        }

        if (data.gerarRevisoes) {
            await scheduleAutoRevisoes({
                disciplinaId: disciplina.id,
                disciplinaNome: disciplina.nome,
                topicoId: targetTopic.id,
                topicoNome: targetTopic.titulo,
            });
        }

        toast.success("Estudo salvo com sucesso!");
    };

    if (!isSaveModalOpen || !sessaoAtual) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={descartarSessao}>
            <form onSubmit={handleSubmit(onSubmit)} className="bg-card backdrop-blur-lg rounded-xl border border-border shadow-2xl w-full max-w-2xl my-auto max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="w-6 h-6 text-primary" />
                        <h2 className="text-lg font-bold">Salvar e Encerrar Estudo</h2>
                    </div>
                    <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-lg">
                        <ClockIcon className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="number"
                            aria-label="Horas"
                            value={editableHours}
                             onChange={(e) => {
                                const hours = parseInt(e.target.value, 10);
                                setEditableHours(isNaN(hours) || hours < 0 ? 0 : hours);
                            }}
                            className="w-12 bg-background/50 border border-transparent focus:border-primary focus:ring-0 text-center font-mono font-semibold rounded-md p-1 text-foreground"
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
                           className="w-12 bg-background/50 border border-transparent focus:border-primary focus:ring-0 text-center font-mono font-semibold rounded-md p-1 text-foreground"
                            min="0" max="59"
                        />
                    </div>
                </header>

                <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
                    {sessaoAtual.isConclusaoRapida && (
                        <div className="p-3 bg-primary/10 rounded-lg text-primary text-xs flex items-center gap-2">
                            <SparklesIcon className="w-4 h-4 flex-shrink-0" />
                            <span><b>Dica:</b> Ative o cronômetro em seu próximo estudo para ganhar mais XP e contar para seu streak!</span>
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
                            <select {...register('topico', { required: true })} disabled={!disciplinaIdSelecionada} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary disabled:opacity-50">
                                <option value="">Selecione o tópico</option>
                                {topicosDaDisciplina.map(t => <option key={t.id} value={t.titulo}>{t.titulo}</option>)}
                            </select>
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
                        <div className="md:col-span-2 space-y-2">
                             <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground">Comentários</label>
                                <button type="button" onClick={handleSuggestTopics} disabled={isLoadingSuggestions} className="px-2 py-1 flex items-center gap-1 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 disabled:opacity-50">
                                    <SparklesIcon className="w-3 h-3" /> {isLoadingSuggestions ? 'Analisando...' : 'Sugerir Tópicos com IA'}
                                </button>
                            </div>
                            <textarea {...register('comentarios')} rows={4} placeholder="Observações sobre o estudo, pontos de dúvida, etc." className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground"></textarea>
                            {suggestedTopics.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold text-muted-foreground">Tópicos Sugeridos:</p>
                                    <div className="flex flex-wrap gap-1.5">{suggestedTopics.map(topic => (
                                        <button key={topic} type="button" onClick={() => handleTopicClick(topic)} className="px-2 py-1 rounded bg-accent text-accent-foreground text-xs hover:bg-accent/80">{topic}</button>
                                    ))}</div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-border">
                        <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...register('gerarRevisoes')} className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary" /> Gerar revisões automáticas (24h, 7d, 15d e 30d)</label>
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
    );
};

export default SalvarSessaoModal;