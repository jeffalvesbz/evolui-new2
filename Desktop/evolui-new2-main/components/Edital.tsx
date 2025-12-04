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
  const { 
    disciplinas, 
    addDisciplina, 
    updateDisciplina, 
    removeDisciplina, 
    getAverageProgress,
    addTopico,
    updateTopico,
    removeTopico,
  } = useDisciplinasStore();
  
  const openAddTopicModal = useModalStore((state) => state.openAddTopicModal);
  const openAddTopicModalBatch = useModalStore((state) => state.openAddTopicModalBatch);

  const [mode, setMode] = useState<PainelMode>('default');
  const [selectedDiscipline, setSelectedDiscipline] = useState<Disciplina | null>(null);

  const averageProgress = useMemo(() => {
    if (disciplinas.length === 0) return 0;
    const totalProgress = disciplinas.reduce((acc, d) => acc + d.progresso, 0);
    return totalProgress / disciplinas.length;
  }, [disciplinas]);

  // FIX: Reworked logic to create disciplina first, then add topics to fix type error and ensure UI updates correctly.
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

  const handleCreateDisciplina = async (payload: PainelDisciplinaPayload) => {
    try {
      // Step 1: Create the disciplina with an empty topics array.
      const disciplina = await addDisciplina({
        nome: formatarTitleCase(payload.nome),
        anotacoes: payload.anotacoes,
        topicos: [],
      });
      
      // Step 2: Add topics to the newly created disciplina.
      // Adiciona os tópicos sequencialmente para preservar a ordem de inserção
      const topicosFiltrados = payload.topicos.filter(topic => topic.titulo && topic.titulo.trim());
      for (const topic of topicosFiltrados) {
        const newTopic: Omit<Topico, 'id'> = {
          titulo: (topic.titulo || '').trim(),
          concluido: topic.concluido || false,
          nivelDificuldade: topic.nivelDificuldade || 'desconhecido',
          ultimaRevisao: null,
          proximaRevisao: null,
        };
        await addTopico(disciplina.id, newTopic);
      }
      
      const topicosMsg = payload.topicos.length > 0 
        ? `${payload.topicos.length} tópico(s) adicionado(s). Defina seus tópicos ou comece a estudar.`
        : 'Adicione tópicos para começar a organizar seus estudos.';
      toast.success(`Disciplina "${disciplina.nome}" adicionada! ${topicosMsg}`);
      setMode('default');
      setSelectedDiscipline(null);
    } catch (error) {
      console.error('Erro ao criar disciplina:', error);
      toast.error('Não foi possível criar a disciplina. Verifique sua conexão e tente novamente.');
    }
  };

  const handleUpdateDisciplina = async (payload: PainelDisciplinaPayload) => {
    if (!selectedDiscipline) return;

    try {
      // Step 1: Update disciplina's own fields (if changed)
      if (selectedDiscipline.nome !== payload.nome || selectedDiscipline.anotacoes !== payload.anotacoes) {
        await updateDisciplina(selectedDiscipline.id, {
          nome: payload.nome,
          anotacoes: payload.anotacoes,
        });
      }

      // Step 2: Diff and update topics
      const originalTopicos = selectedDiscipline.topicos;
      const newTopicos = payload.topicos;

      const originalTopicIds = new Set(originalTopicos.map(t => t.id));
      const newTopicIds = new Set(newTopicos.filter(t => t.id).map(t => t.id as string));

      // Topics to delete
      const topicsToDelete = originalTopicos.filter(t => !newTopicIds.has(t.id));
      for (const topic of topicsToDelete) {
        await removeTopico(selectedDiscipline.id, topic.id);
      }

      // Topics to add or update
      for (const newTopic of newTopicos) {
        if (newTopic.id) { // Existing topic, check for updates
          const originalTopic = originalTopicos.find(t => t.id === newTopic.id);
          // Check if any property has changed
          const hasChanged = originalTopic && (
            originalTopic.titulo !== newTopic.titulo ||
            originalTopic.concluido !== newTopic.concluido ||
            originalTopic.nivelDificuldade !== newTopic.nivelDificuldade
          );
          if (hasChanged) {
            await updateTopico(selectedDiscipline.id, newTopic.id, newTopic);
          }
        } else { // New topic
          if(newTopic.titulo?.trim()) { // Only add if it has a title
            await addTopico(selectedDiscipline.id, {
              titulo: newTopic.titulo.trim(),
              concluido: newTopic.concluido || false,
              nivelDificuldade: newTopic.nivelDificuldade || 'desconhecido',
              ultimaRevisao: null,
              proximaRevisao: null,
            });
          }
        }
      }

      toast.success(`Disciplina "${payload.nome}" atualizada com sucesso!`);
      setMode('default');
      setSelectedDiscipline(null);
    } catch (error) {
      console.error('Erro ao atualizar disciplina:', error);
      toast.error('Não foi possível atualizar a disciplina. Verifique sua conexão e tente novamente.');
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
      toast.error('Não foi possível remover a disciplina. Verifique sua conexão e tente novamente.');
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

  const handleAddTopicBatch = (disciplinaId: string) => {
    openAddTopicModalBatch(disciplinaId);
  };

  const handleCancel = () => {
    setMode('default');
    setSelectedDiscipline(null);
  };

  return (
    <div data-tutorial="edital-content" className="mx-auto flex w-full max-w-7xl flex-col gap-6 lg:flex-row">
      <div className="flex w-full flex-col gap-4 lg:w-2/3">
        <EditalVerticalizado
          onEditDisciplina={handleEditDisciplina}
          onAddTopic={handleAddTopic}
          onAddTopicBatch={handleAddTopicBatch}
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