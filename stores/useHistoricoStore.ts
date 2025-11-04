import { create } from 'zustand';
import { useEstudosStore } from './useEstudosStore';
import { useDisciplinasStore } from './useDisciplinasStore';
import { useStudyStore, Simulation } from './useStudyStore';
import { SessaoEstudo } from '../types';

// O item de histórico é uma sessão de estudo com detalhes adicionados
export type HistoricoItem = {
    id: string;
    type: 'estudo' | 'simulado';
    data: string; // ISO string date part
    duracao_minutos: number;
    // For 'estudo'
    disciplina?: string;
    topico?: string;
    origem?: 'manual' | 'timer' | 'ciclo_estudos';
    comentarios?: string;
    // For 'simulado'
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

export const useHistoricoStore = create<HistoricoState>((set, get) => ({
  historico: [],
  loading: false,
  fetchHistorico: async (editalId: string) => {
    set({ loading: true });
    
    // As stores dependentes já são sincronizadas pelo hook `useEditalDataSync` no App.tsx
    const sessoes = useEstudosStore.getState().sessoes;
    const { findTopicById } = useDisciplinasStore.getState();
    const simulados = useStudyStore.getState().simulations.filter(s => s.edital_id === editalId);

    const historicoEstudos: HistoricoItem[] = sessoes.map(sessao => {
      const topicoInfo = findTopicById(sessao.topico_id);

      let origem: HistoricoItem['origem'] = 'manual';
      if (sessao.id.startsWith('ses-manual')) origem = 'manual';
      if (sessao.topico_id.startsWith('ciclo-')) origem = 'ciclo_estudos';
      if (sessao.id.startsWith('ses-') && !sessao.id.startsWith('ses-manual')) {
        // Assume que sessões não manuais são do timer
        // Uma lógica mais robusta poderia ser implementada se necessário
        origem = 'timer'; 
      }

      return {
        id: sessao.id,
        type: 'estudo',
        data: sessao.data_estudo,
        duracao_minutos: Math.round(sessao.tempo_estudado / 60),
        disciplina: topicoInfo?.disciplina.nome || 'Disciplina Removida',
        topico: topicoInfo?.topico.titulo || 'Tópico Removido',
        origem: origem,
        comentarios: sessao.comentarios,
      };
    });

    const historicoSimulados: HistoricoItem[] = simulados.map(sim => {
        const total = sim.correct + sim.wrong + (sim.blank || 0);
        const precisao = total > 0 ? Math.round((sim.correct / total) * 100) : 0;
        return {
            id: sim.id,
            type: 'simulado' as const,
            data: sim.date.split('T')[0],
            duracao_minutos: sim.durationMinutes,
            nome: sim.name,
            acertos: sim.correct,
            erros: sim.wrong,
            brancos: sim.blank,
            precisao: precisao,
            comentarios: sim.notes,
        };
    });

    const historicoCompleto = [...historicoEstudos, ...historicoSimulados]
        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());


    set({ historico: historicoCompleto, loading: false });
  }
}));