import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Disciplina, Topico, NivelDificuldade } from '../types';
import { BookOpenIcon, PlusIcon, XIcon, Trash2Icon, SaveIcon } from './icons';
import { toast } from './Sonner';
import { EditIcon } from './icons';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useEditalStore } from '../stores/useEditalStore';

export type PainelMode = 'default' | 'creating' | 'editing';

export interface PainelDisciplinaPayload {
  nome: string;
  anotacoes: string;
  progresso: number;
  topicos: Partial<Topico>[];
}

interface PainelGerenciamentoProps {
  mode: PainelMode;
  disciplinaSelecionada: Disciplina | null;
  averageProgress: number;
  onStartCreate: () => void;
  onCreate: (payload: PainelDisciplinaPayload) => void;
  onUpdate: (payload: PainelDisciplinaPayload) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
}

const NIVEIS_DIFICULDADE: NivelDificuldade[] = ['fácil', 'médio', 'difícil', 'desconhecido'];

const PainelGerenciamento: React.FC<PainelGerenciamentoProps> = ({
  mode,
  disciplinaSelecionada,
  averageProgress,
  onStartCreate,
  onCreate,
  onUpdate,
  onCancel,
  onDelete,
}) => {
  const { register, control, handleSubmit, reset, watch, setValue } = useForm<PainelDisciplinaPayload>({
    defaultValues: {
      nome: '',
      anotacoes: '',
      topicos: [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'topicos' });
  const topicos = watch('topicos');

  const { planType, canCreateEdital, getMaxEditais } = useSubscriptionStore();
  const { editais } = useEditalStore();

  const maxEditais = getMaxEditais();
  const editaisCriados = editais.length;
  const podeCriarEdital = canCreateEdital();

  useEffect(() => {
    if (mode === 'editing' && disciplinaSelecionada) {
      reset(disciplinaSelecionada);
    } else if (mode === 'creating') {
      reset({ nome: '', anotacoes: '', topicos: [{ titulo: '', concluido: false, nivelDificuldade: 'desconhecido' }] });
    } else {
      reset();
    }
  }, [mode, disciplinaSelecionada, reset]);

  const calculatedProgress = useMemo(() => {
    if (topicos.length === 0) return 0;
    const completed = topicos.filter(t => t.concluido).length;
    return (completed / topicos.length) * 100;
  }, [topicos]);

  useEffect(() => {
    setValue('progresso', calculatedProgress);
  }, [calculatedProgress, setValue]);

  const onSubmit = (data: PainelDisciplinaPayload) => {
    if (mode === 'creating') {
      onCreate(data);
    } else if (mode === 'editing') {
      onUpdate(data);
    }
  };

  const renderDefaultView = () => (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-24 h-24 flex items-center justify-center rounded-full bg-muted/50 mb-4">
          <span className="text-4xl font-bold text-primary">{averageProgress.toFixed(0)}%</span>
        </div>
        <h3 className="text-xl font-bold text-foreground">Progresso Médio</h3>
        <p className="text-muted-foreground mb-2">Este é o seu avanço geral no edital. Continue focado!</p>
        <p className="text-xs text-muted-foreground font-medium">
          {editaisCriados}/{maxEditais === Infinity ? '∞' : maxEditais} editais criados
        </p>
      </div>
      <button
        onClick={() => {
          if (!podeCriarEdital) {
            toast.error(`Limite de ${maxEditais} ${maxEditais === 1 ? 'edital atingido' : 'editais atingido'}. Faça upgrade para criar mais!`);
            return;
          }
          onStartCreate();
        }}
        disabled={!podeCriarEdital}
        className={`w-full h-11 px-4 flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors ${podeCriarEdital
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
          }`}
        data-tutorial="adicionar-disciplina-button"
      >
        <PlusIcon className="w-5 h-5" />
        {podeCriarEdital ? 'Adicionar Disciplina' : `Limite Atingido (${planType.toUpperCase()})`}
      </button>
    </div>
  );

  const renderFormView = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-card rounded-xl border border-border">
      <div className="p-6 border-b border-border">
        <h3 className="text-xl font-bold text-foreground">
          {mode === 'creating' ? 'Nova Disciplina' : 'Editando Disciplina'}
        </h3>
        <p className="text-muted-foreground text-sm">
          {mode === 'creating' ? 'Preencha os dados da nova disciplina.' : 'Altere os dados e salve.'}
        </p>
      </div>
      <div className="p-6 space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-muted-foreground mb-1">Nome da Disciplina</label>
          <input
            {...register('nome', { required: true })}
            id="nome"
            className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary"
            onChange={(e) => {
              const { onChange } = register('nome', { required: true });
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
              e.target.value = valorFormatado;
              onChange(e);
            }}
          />
        </div>
        <div>
          <label htmlFor="anotacoes" className="block text-sm font-medium text-muted-foreground mb-1">Anotações</label>
          <textarea {...register('anotacoes')} id="anotacoes" rows={3} className="w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-foreground focus:ring-primary focus:border-primary" />
        </div>

        <h4 className="text-lg font-semibold pt-4 border-t border-border">Tópicos</h4>
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div key={field.id} className="p-3 bg-muted/50 rounded-lg border border-border space-y-2">
              <div className="flex items-center gap-2">
                <input {...register(`topicos.${index}.titulo`, { required: true })} placeholder={`Tópico ${index + 1}`} className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-sm text-foreground" />
                <button type="button" onClick={() => remove(index)} className="p-1.5 text-muted-foreground hover:text-red-500"><Trash2Icon className="w-4 h-4" /></button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Controller
                    name={`topicos.${index}.concluido`}
                    control={control}
                    render={({ field: { onChange, value, ref } }) => (
                      <input
                        type="checkbox"
                        ref={ref}
                        checked={!!value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary"
                      />
                    )}
                  />
                  <label className="text-xs text-muted-foreground">Concluído</label>
                </div>
                <Controller
                  name={`topicos.${index}.nivelDificuldade`}
                  control={control}
                  defaultValue="desconhecido"
                  render={({ field }) => (
                    <select {...field} className="text-xs bg-background border border-border rounded-md px-2 py-1 text-foreground">
                      {NIVEIS_DIFICULDADE.map(nivel => <option key={nivel} value={nivel}>{nivel.charAt(0).toUpperCase() + nivel.slice(1)}</option>)}
                    </select>
                  )}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => append({ titulo: '', concluido: false, nivelDificuldade: 'desconhecido' })} className="w-full text-sm text-primary font-medium flex items-center justify-center gap-1 py-2 rounded-md hover:bg-primary/10">
          <PlusIcon className="w-4 h-4" /> Adicionar Tópico
        </button>
      </div>
      <div className="p-6 border-t border-border flex flex-col sm:flex-row gap-2">
        <button type="button" onClick={onCancel} className="flex-1 h-10 px-4 flex items-center justify-center rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
        <button type="submit" className="flex-1 h-10 px-4 flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
          <SaveIcon className="w-4 h-4" /> Salvar
        </button>
      </div>
    </form>
  );

  return (
    <div className="sticky top-24">
      {mode === 'default' && renderDefaultView()}
      {(mode === 'creating' || mode === 'editing') && renderFormView()}
    </div>
  );
};

export default PainelGerenciamento;