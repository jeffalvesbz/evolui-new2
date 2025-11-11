import { create } from 'zustand';
import { useEstudosStore } from './useEstudosStore';
import { useDisciplinasStore } from './useDisciplinasStore';
import { useStudyStore } from './useStudyStore';
import { useEditalStore } from './useEditalStore';
import { useCiclosStore } from './useCiclosStore';
import { extractCicloSessaoId } from '../utils/cicloSessions';

// Um item do historico agrega sessoes de estudo e simulados em um formato unico
export type HistoricoItem = {
  id: string;
  type: 'estudo' | 'simulado';
  data: string; // ISO string date part
  duracao_minutos: number;
  // Campos exclusivos de estudo
  disciplina?: string;
  topico?: string;
  origem?: 'manual' | 'timer' | 'ciclo_estudos' | 'trilha';
  comentarios?: string;
  // Campos exclusivos de simulado
  nome?: string;
  acertos?: number;
  erros?: number;
  brancos?: number;
  precisao?: number;
};

interface HistoricoState {
  historico: HistoricoItem[];
  loading: boolean;
  fetchHistorico: (editalId: string) => Promise<void>;
}

const buildHistoricoFromStores = (editalId: string): HistoricoItem[] => {
  if (!editalId) return [];

  const sessoes = useEstudosStore
    .getState()
    .sessoes
    .filter(s => s.studyPlanId === editalId);

  const disciplinasStore = useDisciplinasStore.getState();
  const { findTopicById } = disciplinasStore;
  const disciplinaById = new Map(disciplinasStore.disciplinas.map(d => [d.id, d]));

  const ciclos = useCiclosStore
    .getState()
    .ciclos
    .filter(c => c.studyPlanId === editalId);

  const cicloSessaoLookup = new Map<string, { disciplinaNome: string; cicloNome: string }>();
  ciclos.forEach(ciclo => {
    (ciclo.sessoes || []).forEach(sessao => {
      const disciplina = disciplinaById.get(sessao.disciplina_id);
      cicloSessaoLookup.set(sessao.id, {
        disciplinaNome: disciplina?.nome || 'Disciplina do Ciclo',
        cicloNome: ciclo.nome,
      });
    });
  });

  const historicoEstudos: HistoricoItem[] = sessoes.map(sessao => {
    const topicoInfo = sessao.topico_id ? findTopicById(sessao.topico_id) : null;
    const cicloSessaoId = extractCicloSessaoId(sessao);

    let origem: HistoricoItem['origem'] = 'manual';
    if (cicloSessaoId) {
      origem = 'ciclo_estudos';
    } else if (sessao.comentarios?.includes('ORIGEM_TRILHA:true')) {
      origem = 'trilha';
    } else if (sessao.id.startsWith('ses-manual')) {
      origem = 'manual';
    } else if (sessao.id.startsWith('ses-')) {
      origem = 'timer';
    }

    let disciplinaNome = topicoInfo?.disciplina.nome || 'Disciplina Removida';
    let topicoTitulo = topicoInfo?.topico.titulo || 'Topico Removido';

    if (!topicoInfo && cicloSessaoId) {
      const cicloInfo = cicloSessaoLookup.get(cicloSessaoId);
      if (cicloInfo) {
        disciplinaNome = cicloInfo.disciplinaNome;
        topicoTitulo = cicloInfo.cicloNome;
      } else {
        disciplinaNome = 'Disciplina do Ciclo';
        topicoTitulo = 'Ciclo de Estudos';
      }
    }

    return {
      id: sessao.id,
      type: 'estudo',
      data: sessao.data_estudo,
      duracao_minutos: Math.round(sessao.tempo_estudado / 60),
      disciplina: disciplinaNome,
      topico: topicoTitulo,
      origem,
      comentarios: sessao.comentarios,
    };
  });

  const simulados = useStudyStore
    .getState()
    .simulations
    .filter(s => s.studyPlanId === editalId);

  const historicoSimulados: HistoricoItem[] = simulados.map(sim => {
    const total = sim.correct + sim.wrong + (sim.blank || 0);
    const precisao = total > 0 ? Math.round((sim.correct / total) * 100) : 0;

    return {
      id: sim.id,
      type: 'simulado',
      data: sim.date.split('T')[0],
      duracao_minutos: sim.duration_minutes,
      nome: sim.name,
      acertos: sim.correct,
      erros: sim.wrong,
      brancos: sim.blank,
      precisao,
      comentarios: sim.notes,
    };
  });

  return [...historicoEstudos, ...historicoSimulados]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
};

export const useHistoricoStore = create<HistoricoState>((set) => ({
  historico: [],
  loading: false,
  fetchHistorico: async (editalId: string) => {
    set({ loading: true });
    const historicoCompleto = buildHistoricoFromStores(editalId);
    set({ historico: historicoCompleto, loading: false });
  }
}));

// Inicializar subscriptions de forma lazy para evitar dependência circular
let subscriptionsInitialized = false;

const initializeSubscriptionsLazy = () => {
  if (subscriptionsInitialized) return;
  subscriptionsInitialized = true;

  // Usar setTimeout para garantir que todos os stores estejam inicializados
  setTimeout(() => {
    initializeHistoricoSubscriptions();
    updateHistoricoFromStores();
  }, 0);
};

// Hook wrapper para inicializar subscriptions na primeira utilização
export const useHistoricoStoreWithSubscriptions = () => {
  const store = useHistoricoStore();
  initializeSubscriptionsLazy();
  return store;
};

const updateHistoricoFromStores = () => {
  const editalId = useEditalStore.getState().editalAtivo?.id;

  if (!editalId) {
    useHistoricoStore.setState({ historico: [], loading: false });
    return;
  }

  const historicoAtualizado = buildHistoricoFromStores(editalId);
  useHistoricoStore.setState({ historico: historicoAtualizado, loading: false });
};

const initializeHistoricoSubscriptions = () => {
  if (subscriptionsInitialized) return;
  subscriptionsInitialized = true;

  useEstudosStore.subscribe((state, prevState) => {
    if (state.sessoes !== prevState.sessoes) {
      updateHistoricoFromStores();
    }
  });

  useStudyStore.subscribe((state, prevState) => {
    if (state.simulations !== prevState.simulations) {
      updateHistoricoFromStores();
    }
  });

  useEditalStore.subscribe((state, prevState) => {
    const currentId = state.editalAtivo?.id;
    const previousId = prevState.editalAtivo?.id;

    if (currentId === previousId) return;

    if (currentId) {
      useHistoricoStore.getState().fetchHistorico(currentId);
    } else {
      useHistoricoStore.setState({ historico: [], loading: false });
    }
  });
};

// Removido: inicialização imediata que causava dependência circular
// As inicializações serão feitas dentro do hook quando necessário
