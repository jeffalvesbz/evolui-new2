import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { Disciplina } from '../types';
import { useEstudosStore, TrilhaSemanalData } from '../stores/useEstudosStore';
import { toast } from './Sonner';
import { XIcon, SparklesIcon, PlusIcon } from './icons';
import { startOfWeek, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PlanoFormData = {
  disciplinasSelecionadas: string[];
  horasSemanais: number;
  dificuldades: Record<string, 'facil' | 'medio' | 'dificil'>;
  diasSemana: string[];
};

const GeradorPlanoModal: React.FC = () => {
  const { isGeradorPlanoModalOpen, closeGeradorPlanoModal } = useModalStore();
  const { disciplinas, addDisciplina } = useDisciplinasStore();
  const { setTrilhaCompleta } = useEstudosStore();
  const [isLoading, setIsLoading] = useState(false);
  const [customMateria, setCustomMateria] = useState('');

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm<PlanoFormData>({
    defaultValues: {
      disciplinasSelecionadas: [],
      horasSemanais: 20,
      dificuldades: {},
      diasSemana: ['seg', 'ter', 'qua', 'qui', 'sex'],
    },
  });

  const disciplinasSelecionadas = watch('disciplinasSelecionadas', []);
  const selectedDisciplinaIds = useMemo(() => new Set(disciplinasSelecionadas), [disciplinasSelecionadas]);
  
  const disciplinasSelecionadasObjetos = useMemo(() => {
    return disciplinas.filter(d => selectedDisciplinaIds.has(d.id));
  }, [disciplinas, selectedDisciplinaIds]);

  const handleSelectDisciplina = (disciplina: Disciplina) => {
    if (!selectedDisciplinaIds.has(disciplina.id)) {
      const novas = [...disciplinasSelecionadas, disciplina.id];
      setValue('disciplinasSelecionadas', novas);
      // Adicionar dificuldade padrão
      const currentDificuldades = watch('dificuldades');
      setValue('dificuldades', { ...currentDificuldades, [disciplina.id]: 'medio' });
    }
  };

  const handleRemoveDisciplina = (id: string) => {
    const novas = disciplinasSelecionadas.filter(dId => dId !== id);
    setValue('disciplinasSelecionadas', novas);
    const currentDificuldades = watch('dificuldades');
    const { [id]: _, ...restDificuldades } = currentDificuldades;
    setValue('dificuldades', restDificuldades);
  };

  const handleAddCustomMateria = async () => {
    if (customMateria.trim() && !disciplinas.some(d => d.nome.toLowerCase() === customMateria.trim().toLowerCase())) {
      try {
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

        const novaDisciplina = await addDisciplina({ nome: formatarTitleCase(customMateria.trim()), anotacoes: '', topicos: [] });
        handleSelectDisciplina(novaDisciplina);
        setCustomMateria('');
        toast.success(`Matéria "${novaDisciplina.nome}" adicionada ao edital.`);
      } catch (error) {
        toast.error("Não foi possível adicionar a matéria personalizada.");
      }
    }
  };

  const diasSemanaOptions = [
    { id: 'seg', nome: 'Segunda' },
    { id: 'ter', nome: 'Terça' },
    { id: 'qua', nome: 'Quarta' },
    { id: 'qui', nome: 'Quinta' },
    { id: 'sex', nome: 'Sexta' },
    { id: 'sab', nome: 'Sábado' },
    { id: 'dom', nome: 'Domingo' },
  ];

  const diasSelecionados = watch('diasSemana', ['seg', 'ter', 'qua', 'qui', 'sex']);

  const toggleDiaSemana = (diaId: string) => {
    const current = watch('diasSemana');
    if (current.includes(diaId)) {
      if (current.length > 1) {
        setValue('diasSemana', current.filter(d => d !== diaId));
      } else {
        toast.error('Selecione pelo menos um dia da semana.');
      }
    } else {
      setValue('diasSemana', [...current, diaId]);
    }
  };

  useEffect(() => {
    if (isGeradorPlanoModalOpen) {
      reset({
        disciplinasSelecionadas: [],
        horasSemanais: 20,
        dificuldades: {},
        diasSemana: ['seg', 'ter', 'qua', 'qui', 'sex'],
      });
      setCustomMateria('');
    }
  }, [isGeradorPlanoModalOpen, reset]);

  const onSubmit = async (data: PlanoFormData) => {
    if (data.disciplinasSelecionadas.length === 0) {
      toast.error('Selecione pelo menos uma matéria para gerar o plano.');
      return;
    }
    
    if (data.diasSemana.length === 0) {
      toast.error('Selecione pelo menos um dia da semana.');
      return;
    }

    setIsLoading(true);
    try {
      // Geração simples sem IA: distribui tópicos igualmente entre os dias selecionados
      const allTopicIds = disciplinasSelecionadasObjetos.flatMap(d => d.topicos.map(t => t.id));
      const planoGerado: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
      const dias = data.diasSemana.length > 0 ? data.diasSemana : ['seg', 'ter', 'qua', 'qui', 'sex'];
      const MAX_TOPICOS_POR_DIA = 4;
      
      // Embaralhar os tópicos
      const topicosEmbaralhados = allTopicIds.sort(() => 0.5 - Math.random());
      
      // Distribuir os tópicos limitando a 4 por dia apenas nos dias selecionados
      let diaIndex = 0;
      for (const topicId of topicosEmbaralhados) {
        // Encontrar o próximo dia selecionado que ainda não atingiu o limite
        let tentativas = 0;
        while (planoGerado[dias[diaIndex]] && planoGerado[dias[diaIndex]].length >= MAX_TOPICOS_POR_DIA && tentativas < dias.length) {
          diaIndex = (diaIndex + 1) % dias.length;
          tentativas++;
        }
        
        // Se todos os dias selecionados estão cheios, parar (usuário pode adicionar mais manualmente)
        if (!planoGerado[dias[diaIndex]] || planoGerado[dias[diaIndex]].length >= MAX_TOPICOS_POR_DIA) {
          break;
        }
        
        planoGerado[dias[diaIndex]].push(topicId);
        diaIndex = (diaIndex + 1) % dias.length;
      }
      
      // Simular um pequeno delay para feedback visual
      await new Promise(res => setTimeout(res, 500));
      
      // Definir semana atual antes de salvar
      const { setSemanaAtualKey, setTrilhaCompleta, saveTrilhasToDb } = useEstudosStore.getState();
      const weekKey = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      setSemanaAtualKey(weekKey);
      
      setTrilhaCompleta(planoGerado);
      
      // Garantir que salva imediatamente após gerar
      await saveTrilhasToDb();
      
      toast.success('Plano de estudos gerado e aplicado com sucesso!');
      closeGeradorPlanoModal();

    } catch (error) {
      toast.error('Ocorreu um erro ao gerar o plano de estudos.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isGeradorPlanoModalOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/[0.999] backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4 overflow-y-auto" onClick={closeGeradorPlanoModal}>
      <div className="bg-card rounded-xl border border-white/10 shadow-2xl w-full max-w-3xl my-auto max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <header className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold">Gerador de Plano de Estudos</h2>
            </div>
            <button type="button" onClick={closeGeradorPlanoModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
          </header>

          <main className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0 overflow-x-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <SparklesIcon className="w-12 h-12 text-primary animate-pulse mb-4" />
                <h3 className="font-semibold text-lg text-foreground">Criando seu plano...</h3>
                <p className="text-muted-foreground mt-1">Aguarde, organizando seus estudos.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Matérias Selecionadas ({disciplinasSelecionadas.length}) *</label>
                  <div className="p-3 bg-muted/30 rounded-lg min-h-[4rem] flex flex-wrap gap-2 border border-border">
                    {disciplinasSelecionadas.length === 0 && <p className="text-sm text-muted-foreground">Selecione as matérias abaixo.</p>}
                    {disciplinasSelecionadasObjetos.map(disciplina => (
                      <span key={disciplina.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-tr from-primary to-secondary text-black text-sm font-bold">
                        {disciplina.nome}
                        <button type="button" onClick={() => handleRemoveDisciplina(disciplina.id)} className="p-0.5 rounded-full hover:bg-muted/50">
                          <XIcon className="w-3.5 h-3.5"/>
                        </button>
                      </span>
                    ))}
                  </div>
                  {errors.disciplinasSelecionadas && <p className="text-xs text-red-500 mt-1">{errors.disciplinasSelecionadas.message as string}</p>}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Suas Disciplinas</h4>
                    <div className="flex flex-wrap gap-2">
                      {disciplinas.filter(d => !selectedDisciplinaIds.has(d.id)).map(d => (
                        <button 
                          type="button" 
                          key={d.id} 
                          onClick={() => handleSelectDisciplina(d)} 
                          className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-muted"
                        >
                          {d.nome}
                        </button>
                      ))}
                      {disciplinas.filter(d => !selectedDisciplinaIds.has(d.id)).length === 0 && (
                        <p className="text-sm text-muted-foreground">Todas as disciplinas foram selecionadas.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Adicionar Matéria Personalizada</h4>
                    <div className="flex gap-2">
                      <input 
                        value={customMateria} 
                        onChange={e => {
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
                            setCustomMateria(valorFormatado);
                        }} 
                        placeholder="Digite o nome da matéria" 
                        className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddCustomMateria} 
                        className="h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30"
                      >
                        <PlusIcon className="w-4 h-4"/> Adicionar
                      </button>
                    </div>
                  </div>
                </div>

                {disciplinasSelecionadas.length > 0 && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Em quais dias da semana você quer estudar? *</label>
                      <div className="flex flex-wrap gap-2">
                        {diasSemanaOptions.map(dia => {
                          const isSelected = diasSelecionados.includes(dia.id);
                          return (
                            <button
                              key={dia.id}
                              type="button"
                              onClick={() => toggleDiaSemana(dia.id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              }`}
                            >
                              {dia.nome}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Quantas horas por semana você pode estudar?</label>
                      <input type="number" {...register('horasSemanais', { min: 1 })} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-2 block">Qual a sua dificuldade em cada matéria selecionada?</label>
                      <div className="space-y-3">
                        <Controller
                          name="dificuldades"
                          control={control}
                          render={({ field }) => (
                            <>
                              {disciplinasSelecionadasObjetos.map(d => (
                                <div key={d.id} className="p-3 bg-muted/30 rounded-lg flex items-center justify-between">
                                  <span className="font-semibold">{d.nome}</span>
                                  <div className="flex items-center gap-2">
                                    {(['facil', 'medio', 'dificil'] as const).map(level => (
                                      <button
                                        key={level}
                                        type="button"
                                        onClick={() => field.onChange({ ...field.value, [d.id]: level })}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${field.value[d.id] === level ? 'bg-primary text-black' : 'bg-background/50 hover:bg-background'}`}
                                      >
                                        {level.charAt(0).toUpperCase() + level.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </main>
          
          {!isLoading && (
            <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={closeGeradorPlanoModal} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              <button 
                type="submit" 
                disabled={disciplinasSelecionadas.length === 0}
                className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" /> Gerar Plano
              </button>
            </footer>
          )}
        </form>
      </div>
    </div>
  );
};

export default GeradorPlanoModal;