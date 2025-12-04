import { create } from 'zustand';
import { useEditalStore } from './useEditalStore';
import { useDisciplinasStore } from './useDisciplinasStore';
import { useDailyGoalStore } from './useDailyGoalStore';
import { useEstudosStore } from './useEstudosStore';

interface FirstStepsState {
  // Etapas do checklist
  hasCreatedEdital: () => boolean;
  hasAddedDisciplinas: () => boolean;
  hasSetDailyGoal: () => boolean;
  hasDoneFirstStudy: () => boolean;
  
  // Progresso calculado
  getProgress: () => {
    completed: number;
    total: number;
    percentage: number;
    steps: {
      id: string;
      label: string;
      completed: boolean;
    }[];
  };
  
  // Verificar se todas as etapas foram completadas
  isComplete: () => boolean;
}

export const useFirstStepsStore = create<FirstStepsState>((set, get) => ({
  hasCreatedEdital: () => {
    const { editais } = useEditalStore.getState();
    return editais.length > 0;
  },

  hasAddedDisciplinas: () => {
    const { disciplinas } = useDisciplinasStore.getState();
    return disciplinas.length > 0;
  },

  hasSetDailyGoal: () => {
    const { goalMinutes } = useDailyGoalStore.getState();
    // Considera que a meta foi definida se for diferente do padrão (240 min = 4h)
    // Ou se o usuário explicitamente definiu uma meta
    return goalMinutes > 0;
  },

  hasDoneFirstStudy: () => {
    const { sessoes } = useEstudosStore.getState();
    return sessoes.length > 0;
  },

  getProgress: () => {
    const state = get();
    const steps = [
      {
        id: 'create-edital',
        label: 'Criar plano de estudos',
        completed: state.hasCreatedEdital(),
      },
      {
        id: 'add-disciplines',
        label: 'Adicionar disciplinas',
        completed: state.hasAddedDisciplinas(),
      },
      {
        id: 'set-goal',
        label: 'Definir meta diária',
        completed: state.hasSetDailyGoal(),
      },
      {
        id: 'first-study',
        label: 'Fazer primeiro estudo',
        completed: state.hasDoneFirstStudy(),
      },
    ];

    const completed = steps.filter(s => s.completed).length;
    const total = steps.length;
    const percentage = Math.round((completed / total) * 100);

    return {
      completed,
      total,
      percentage,
      steps,
    };
  },

  isComplete: () => {
    const state = get();
    return (
      state.hasCreatedEdital() &&
      state.hasAddedDisciplinas() &&
      state.hasSetDailyGoal() &&
      state.hasDoneFirstStudy()
    );
  },
}));


