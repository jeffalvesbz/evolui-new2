import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEstudosStore, TrilhaSemanalData } from '../stores/useEstudosStore';
import { gerarPlanoDeEstudosIA } from '../services/geminiService';
import { DisciplinaParaIA } from '../types';
import { toast } from './Sonner';
import { XIcon, SparklesIcon } from './icons';

type PlanoFormData = {
  objetivo: string;
  horasSemanais: number;
  dificuldades: Record<string, 'facil' | 'medio' | 'dificil'>;
};

const GeradorPlanoModal: React.FC = () => {
  const { isGeradorPlanoModalOpen, closeGeradorPlanoModal } = useModalStore();
  const { disciplinas } = useDisciplinasStore();
  const { setTrilhaCompleta } = useEstudosStore();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<PlanoFormData>({
    defaultValues: {
      objetivo: '',
      horasSemanais: 20,
      dificuldades: {},
    },
  });

  useEffect(() => {
    if (isGeradorPlanoModalOpen) {
      const initialDificuldades: Record<string, 'facil' | 'medio' | 'dificil'> = {};
      disciplinas.forEach(d => {
        initialDificuldades[d.id] = 'medio';
      });
      reset({
        objetivo: '',
        horasSemanais: 20,
        dificuldades: initialDificuldades,
      });
    }
  }, [isGeradorPlanoModalOpen, disciplinas, reset]);

  const onSubmit = async (data: PlanoFormData) => {
    setIsLoading(true);
    try {
      const disciplinasParaIA: DisciplinaParaIA[] = disciplinas.map(d => ({
        id: d.id,
        nome: d.nome,
        dificuldade: data.dificuldades[d.id] || 'medio',
        topicos: d.topicos.map(t => ({ id: t.id, titulo: t.titulo })),
      }));

      const planoGerado: TrilhaSemanalData = await gerarPlanoDeEstudosIA(data.objetivo, data.horasSemanais, disciplinasParaIA);
      
      setTrilhaCompleta(planoGerado);
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={closeGeradorPlanoModal}>
      <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <header className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-6 h-6 text-primary" />
              <h2 className="text-lg font-bold">Gerador de Plano de Estudos IA</h2>
            </div>
            <button type="button" onClick={closeGeradorPlanoModal} className="p-1.5 rounded-full hover:bg-muted"><XIcon className="w-5 h-5"/></button>
          </header>

          <main className="p-6 max-h-[70vh] overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-96 text-center">
                <SparklesIcon className="w-12 h-12 text-primary animate-pulse mb-4" />
                <h3 className="font-semibold text-lg text-foreground">Criando seu plano...</h3>
                <p className="text-muted-foreground mt-1">Aguarde, a IA está organizando seus estudos.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Qual seu objetivo principal? *</label>
                  <input {...register('objetivo', { required: 'O objetivo é obrigatório.' })} placeholder="Ex: Passar no ENEM 2024" className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                  {errors.objetivo && <p className="text-xs text-red-500 mt-1">{errors.objetivo.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Quantas horas por semana você pode estudar?</label>
                  <input type="number" {...register('horasSemanais', { min: 1 })} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Qual a sua dificuldade em cada matéria?</label>
                  <div className="space-y-3">
                    <Controller
                      name="dificuldades"
                      control={control}
                      render={({ field }) => (
                        <>
                          {disciplinas.map(d => (
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
              </div>
            )}
          </main>
          
          {!isLoading && (
            <footer className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
              <button type="button" onClick={closeGeradorPlanoModal} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              <button type="submit" className="h-10 px-6 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2">
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