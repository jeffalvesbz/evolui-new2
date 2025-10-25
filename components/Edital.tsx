import React, { useEffect, useMemo, useState } from 'react';
import { toast } from './Sonner';
import EditalVerticalizado from './EditalVerticalizado';
import PainelGerenciamento, {
  type PainelDisciplinaPayload,
  type PainelMode,
} from './PainelGerenciamento';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useEditalStore } from '../stores/useEditalStore';
import type { Disciplina, Topico } from '../types';
import { useModalStore } from '../stores/useModalStore';

const generateTopicId = () =>
  typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function'
    ? globalThis.crypto.randomUUID()
    : `topico-${Math.random().toString(36).slice(2, 10)}`;

const Edital = () => {
  const disciplinas = useDisciplinasStore((state) => state.disciplinas);
  const carregarDisciplinas = useDisciplinasStore((state) => state.setEditalAtivo);
  const addDisciplina = useDisciplinasStore((state) => state.addDisciplina);
  const updateDisciplina = useDisciplinasStore((state) => state.updateDisciplina);
  const removeDisciplina = useDisciplinasStore((state) => state.removeDisciplina);
  const getAverageProgress = useDisciplinasStore((state) => state.getAverageProgress);
  const resetDisciplinas = useDisciplinasStore((state) => state.resetDisciplinas);
  const editalAtivo = useEditalStore((state) => state.editalAtivo);
  const openAddTopicModal = useModalStore((state) => state.openAddTopicModal);

  const [mode, setMode] = useState<PainelMode>('default');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Disciplina | null>(null);

  const averageProgress = useMemo(() => getAverageProgress(), [getAverageProgress, disciplinas]);

  useEffect(() => {
    const id = editalAtivo?.id;
    if (id) {
      carregarDisciplinas(id);
    } else {
      resetDisciplinas();
    }
  }, [carregarDisciplinas, resetDisciplinas, editalAtivo?.id]);

  const handleCreateDisciplina = async (payload: PainelDisciplinaPayload) => {
    try {
      const disciplina = await addDisciplina({
        nome: payload.nome,
        anotacoes: payload.anotacoes,
        topicos: payload.topicos.map((topic) => ({
          id: '', // será gerado pelo store
          titulo: (topic.titulo || '').trim(),
          concluido: topic.concluido || false,
          nivelDificuldade: topic.nivelDificuldade || 'desconhecido',
          ultimaRevisao: topic.ultimaRevisao || null,
          proximaRevisao: topic.proximaRevisao || null,
        })),
      });
      
      toast.success(`Disciplina "${disciplina.nome}" adicionada ao edital!`);
      setMode('default');
      setSelectedDiscipline(null);
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      toast.error('Não foi possível criar a disciplina.');
    }
  };

  const handleUpdateDisciplina = async (payload: PainelDisciplinaPayload) => {
    if (!selectedDiscipline) return;

    try {
      const sanitizedTopicos: Topico[] = payload.topicos.map((topic) => ({
        id: topic.id ?? generateTopicId(),
        titulo: topic.titulo || '',
        concluido: topic.concluido ?? false,
        nivelDificuldade: topic.nivelDificuldade || 'desconhecido',
        ultimaRevisao: topic.ultimaRevisao ?? null,
        proximaRevisao: topic.proximaRevisao ?? null,
      }));

      await updateDisciplina(selectedDiscipline.id, {
        nome: payload.nome,
        anotacoes: payload.anotacoes,
        progresso: payload.progresso,
        topicos: sanitizedTopicos,
      });

      toast.success(`Disciplina "${payload.nome}" atualizada!`);
      setMode('default');
      setSelectedDiscipline(null);
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      toast.error('Não foi possível atualizar a disciplina.');
    }
  };

  const handleDeleteDisciplina = async (disciplinaId: string) => {
    const disciplina = disciplinas.find((item) => item.id === disciplinaId);
    
    try {
      await removeDisciplina(disciplinaId);
      toast.success(`Disciplina "${disciplina?.nome ?? ''}" removida.`);
      setMode('default');
      setSelectedDiscipline(null);
    } catch (error) {
      console.error('Erro ao deletar disciplina:', error);
      toast.error('Não foi possível remover a disciplina.');
    }
  };

  const handleStartCreate = () => {
    setMode('creating');
    setSelectedDiscipline(null);
  };

  const handleEditDisciplina = (disciplina: Disciplina) => {
    setSelectedDiscipline(disciplina);
    setMode('editing');
  };

  const handleAddTopic = (disciplinaId: string) => {
    openAddTopicModal(disciplinaId);
  };

  const handleCancel = () => {
    setMode('default');
    setSelectedDiscipline(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-2/3">
        <EditalVerticalizado
          onEditDisciplina={handleEditDisciplina}
          onAddTopic={handleAddTopic}
          onDeleteDisciplina={handleDeleteDisciplina}
        />
      </div>
      <div className="w-full lg:w-1/3">
        <PainelGerenciamento
          mode={mode}
          disciplinaSelecionada={selectedDiscipline}
          onStartCreate={handleStartCreate}
          onCreate={handleCreateDisciplina}
          onUpdate={handleUpdateDisciplina}
          onCancel={handleCancel}
          onDelete={handleDeleteDisciplina}
          averageProgress={averageProgress}
        />
      </div>
    </div>
  );
};

export default Edital;