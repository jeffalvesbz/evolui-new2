import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useModalStore } from '../stores/useModalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useFlashcardsStore } from '../stores/useFlashcardStore';
import { toast } from './Sonner';
import { Modal } from './ui/BaseModal';
import { LayersIcon, SaveIcon, SparklesIcon } from './icons';
import { FlashcardGenerator } from './FlashcardGenerator';

interface FormData {
  disciplinaId: string;
  topicoId: string;
  pergunta: string;
  resposta: string;
}

const CriarFlashcardModal: React.FC = () => {
  const { isCriarFlashcardModalOpen, closeCriarFlashcardModal, flashcardToEdit, flashcardModalMode } = useModalStore();
  const { disciplinas } = useDisciplinasStore();
  const { addFlashcard, updateFlashcard } = useFlashcardsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addAnother, setAddAnother] = useState(true);
  // Use the mode from the store, defaulting to 'manual' if not set
  const [mode, setMode] = useState<'manual' | 'ai'>(flashcardModalMode || 'manual');

  // Update local mode state when store mode changes (e.g. when opening modal)
  useEffect(() => {
    if (isCriarFlashcardModalOpen) {
      setMode(flashcardModalMode);
    }
  }, [isCriarFlashcardModalOpen, flashcardModalMode]);

  const { register, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<FormData>();
  const selectedDisciplinaId = watch('disciplinaId');

  const isEditMode = !!flashcardToEdit;

  const topicosFiltrados = useMemo(() => {
    if (!selectedDisciplinaId) return [];
    const disciplina = disciplinas.find(d => d.id === selectedDisciplinaId);
    return disciplina?.topicos || [];
  }, [selectedDisciplinaId, disciplinas]);

  useEffect(() => {
    if (isCriarFlashcardModalOpen) {
      if (isEditMode) {
        const disciplina = disciplinas.find(d => d.topicos.some(t => t.id === flashcardToEdit.topico_id));
        reset({
          disciplinaId: disciplina?.id || '',
          topicoId: flashcardToEdit.topico_id,
          pergunta: flashcardToEdit.pergunta,
          resposta: flashcardToEdit.resposta,
        });
      } else {
        if (!addAnother || !watch('disciplinaId')) {
          reset({ disciplinaId: '', topicoId: '', pergunta: '', resposta: '' });
        } else {
          reset({ pergunta: '', resposta: '' }); // Keep disciplina and topic
        }
      }
    }
  }, [isCriarFlashcardModalOpen, isEditMode, flashcardToEdit, reset, disciplinas, addAnother, watch]);

  // Limpa o tópico se a disciplina mudar
  useEffect(() => {
    if (!isEditMode) {
      setValue('topicoId', '');
    }
  }, [selectedDisciplinaId, setValue, isEditMode]);

  const onSubmit = async (data: FormData) => {
    console.log('[CriarFlashcardModal] onSubmit chamado com data:', data);

    // Validação explícita do tópico
    if (!data.topicoId || data.topicoId.trim() === '') {
      toast.error('Por favor, selecione um tópico antes de salvar o flashcard.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        await updateFlashcard(flashcardToEdit.id, {
          pergunta: data.pergunta,
          resposta: data.resposta,
        });
        toast.success('Flashcard atualizado com sucesso!');
        closeCriarFlashcardModal();
      } else {
        console.log('[CriarFlashcardModal] Criando flashcard com topicoId:', data.topicoId);
        await addFlashcard({
          pergunta: data.pergunta,
          resposta: data.resposta,
          topico_id: data.topicoId,
        }, data.topicoId);
        toast.success('Flashcard criado com sucesso!');
        if (addAnother) {
          reset({ ...data, pergunta: '', resposta: '' });
        } else {
          closeCriarFlashcardModal();
        }
      }
    } catch (error: any) {
      console.error('[CriarFlashcardModal] Erro:', error);
      toast.error(`Não foi possível ${isEditMode ? 'atualizar' : 'criar'} o flashcard.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCriarFlashcardModalOpen}
      onClose={closeCriarFlashcardModal}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col max-h-[95vh]">
        <Modal.Header onClose={closeCriarFlashcardModal} className="flex-shrink-0">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-6 h-6 text-primary" />
            <h2 className="text-lg font-bold">{isEditMode ? 'Editar Flashcard' : 'Criar Flashcard'}</h2>
          </div>

          {!isEditMode && (
            <div className="flex bg-muted/50 p-1 rounded-lg ml-auto mr-2">
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mode === 'manual'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setMode('ai')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${mode === 'ai'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-purple-400'
                  }`}
              >
                <SparklesIcon className="w-3 h-3" />
                IA
              </button>
            </div>
          )}
        </Modal.Header>

        <Modal.Body className="space-y-4 overflow-x-hidden">
          {mode === 'ai' && !isEditMode ? (
            <FlashcardGenerator
              disciplinaId={watch('disciplinaId') || undefined}
              topicoId={watch('topicoId') || undefined}
              onSave={() => {
                closeCriarFlashcardModal();
              }}
              onCancel={() => setMode('manual')}
            />
          ) : (
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
              `}</style>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Disciplina *</label>
                  <select {...register('disciplinaId', { required: true })} disabled={isEditMode} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                    <option value="">Selecione...</option>
                    {disciplinas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Tópico *</label>
                  <div className="relative group w-full overflow-hidden">
                    <select
                      {...register('topicoId', { required: true })}
                      disabled={isEditMode}
                      className="w-full bg-input border border-border rounded-md px-3 py-2 pr-8 text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed appearance-none truncate"
                      style={{
                        textOverflow: 'ellipsis',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Selecione...</option>
                      {topicosFiltrados.map(t => (
                        <option key={t.id} value={t.id} title={t.titulo}>
                          {t.titulo.length > 80 ? `${t.titulo.substring(0, 80)}...` : t.titulo}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Pergunta *</label>
                <textarea {...register('pergunta', { required: true })} rows={3} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1 block">Resposta *</label>
                <textarea {...register('resposta', { required: true })} rows={4} className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground" />
              </div>
            </>
          )}
        </Modal.Body>

        {mode === 'manual' && (
          <Modal.Footer className="justify-between">
            {!isEditMode ? (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={addAnother} onChange={e => setAddAnother(e.target.checked)} className="w-4 h-4 rounded text-primary bg-background border-muted-foreground focus:ring-primary" />
                Adicionar outro
              </label>
            ) : <div />}
            <div className="flex gap-2">
              <button type="button" onClick={closeCriarFlashcardModal} className="h-10 px-4 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50">
                <SaveIcon className="w-4 h-4" /> {isSubmitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </Modal.Footer>
        )}
      </form>
    </Modal>
  );
};

export default CriarFlashcardModal;