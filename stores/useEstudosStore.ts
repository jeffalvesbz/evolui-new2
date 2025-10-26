import { create } from 'zustand';
import { SessaoEstudo } from '../types';
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';
import { getSessoes, createSessao, updateSessaoApi, deleteSessao } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';

export interface SessaoAtual {
  topico: {
    id: string;
    nome: string;
    disciplinaId?: string; // Opcional, para pré-selecionar no modal
  };
  elapsedSeconds: number; // Sempre conta pra cima, representa o tempo no estágio atual
  workSecondsAccumulated: number; // Acumula apenas o tempo de foco (work)
  status: 'running' | 'paused';
  mode: 'cronometro' | 'pomodoro';
  pomodoroStage: 'work' | 'short_break' | 'long_break';
  pomodoroCycle: number;
  isConclusaoRapida?: boolean;
}

export type TrilhaSemanalData = {
  [key: string]: string[];
  seg: string[];
  ter: string[];
  qua: string[];
  sex: string[];
  sab: string[];
  dom: string[];
};

interface PomodoroSettings {
    work: number; // in seconds
    shortBreak: number;
    longBreak: number;
    cyclesBeforeLongBreak: number;
}

interface EstudosStore {
  sessoes: SessaoEstudo[];
  trilha: TrilhaSemanalData;
  loading: boolean;
  sessaoAtual: SessaoAtual | null;
  timerInterval: number | null;
  pomodoroSettings: PomodoroSettings;
  
  fetchSessoes: (editalId: string) => Promise<void>;
  
  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro') => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }) => void;
  iniciarSessaoInteligente: () => void;
  abrirModalEstudoManual: () => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  encerrarSessaoParaSalvar: () => void;
  salvarSessao: (detalhes: Omit<SessaoEstudo, 'id' | 'tempo_estudado' | 'data_estudo' | 'topico_id' | 'studyPlanId'> & { topico_id: string }, tempoEmSegundos?: number) => Promise<void>;
  descartarSessao: () => void;
  alternarModoTimer: () => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  skipBreak: () => void;

  addSessao: (sessao: Omit<SessaoEstudo, 'id' | 'studyPlanId'>) => Promise<void>;
  updateSessao: (id: string, updates: Partial<Omit<SessaoEstudo, 'id'>>) => Promise<void>;
  removeSessao: (id: string) => Promise<void>;
  moveTopicoNaTrilha: (topicoId: string, fromDia: string, toDia: string, fromIndex: number, toIndex: number) => void;
  _tick: () => void;
}

const emptyTrilha: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };

export const useEstudosStore = create<EstudosStore>((set, get) => ({
      sessoes: [],
      trilha: emptyTrilha,
      loading: false,
      sessaoAtual: null,
      timerInterval: null,
      pomodoroSettings: {
        work: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        cyclesBeforeLongBreak: 4,
      },

      fetchSessoes: async (editalId: string) => {
          set({ loading: true });
          try {
              const sessoes = await getSessoes(editalId);
              set({ sessoes });
          } catch(error) {
              console.error("Failed to fetch study sessions:", error);
              toast.error("Não foi possível carregar as sessões de estudo.");
          } finally {
              set({ loading: false });
          }
      },

      _tick: () => {
        set(state => {
          if (!state.sessaoAtual || state.sessaoAtual.status !== 'running') {
            return {};
          }
      
          const newElapsed = state.sessaoAtual.elapsedSeconds + 1;
      
          if (state.sessaoAtual.mode === 'pomodoro') {
            const { pomodoroSettings, sessaoAtual } = state;
            const currentStageDuration = pomodoroSettings[{'work': 'work', 'short_break': 'shortBreak', 'long_break': 'longBreak'}[sessaoAtual.pomodoroStage]];
            
            if (newElapsed >= currentStageDuration) {
              // Stage finished
              let { pomodoroStage, pomodoroCycle, workSecondsAccumulated } = sessaoAtual;
              
              if (pomodoroStage === 'work') {
                workSecondsAccumulated += currentStageDuration;
                pomodoroCycle++;
                pomodoroStage = pomodoroCycle % pomodoroSettings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
              } else { // It was a break
                pomodoroStage = 'work';
              }
              
              return {
                sessaoAtual: {
                  ...sessaoAtual,
                  elapsedSeconds: 0, // Reset for new stage
                  pomodoroStage,
                  pomodoroCycle,
                  workSecondsAccumulated,
                }
              };
            }
          }
          
          return { sessaoAtual: { ...state.sessaoAtual, elapsedSeconds: newElapsed } };
        });
      },
      
      iniciarSessao: (topico, mode = 'cronometro') => {
        get().descartarSessao();
    
        const interval = window.setInterval(get()._tick, 1000);
        set({
          sessaoAtual: {
            topico: topico,
            elapsedSeconds: 0,
            status: 'running',
            mode: mode,
            pomodoroStage: 'work',
            pomodoroCycle: 0,
            workSecondsAccumulated: 0,
            isConclusaoRapida: false,
          },
          timerInterval: interval,
        });
        useUiStore.getState().closeSaveModal();
      },

      iniciarSessaoParaConclusaoRapida: (topico) => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa
    
        set({
          sessaoAtual: {
            topico: topico,
            elapsedSeconds: 3600, // Padrão de 1 hora, o usuário pode editar
            status: 'paused',
            mode: 'cronometro',
            pomodoroStage: 'work',
            pomodoroCycle: 0,
            workSecondsAccumulated: 0,
            isConclusaoRapida: true, // Marca a sessão como conclusão rápida
          },
          timerInterval: null,
        });
        
        // Aciona imediatamente o modal de salvamento
        get().encerrarSessaoParaSalvar();
      },

      iniciarSessaoInteligente: () => {
        get().iniciarSessao({ id: `livre-${Date.now()}`, nome: 'Estudo Inteligente' });
      },
      
      abrirModalEstudoManual: () => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa
    
        set({
          sessaoAtual: {
            topico: { id: `manual-${Date.now()}`, nome: 'Estudo Manual' },
            elapsedSeconds: 60 * 60, // Padrão de 1 hora
            status: 'paused',
            mode: 'cronometro',
            pomodoroStage: 'work',
            pomodoroCycle: 0,
            workSecondsAccumulated: 0,
            isConclusaoRapida: true, // Marca a sessão como manual
          },
          timerInterval: null,
        });
        
        // Aciona imediatamente o modal de salvamento
        get().encerrarSessaoParaSalvar();
      },

      pausarSessao: () => {
        set(state => {
          if (state.timerInterval) clearInterval(state.timerInterval);
          if (state.sessaoAtual) {
            return {
              sessaoAtual: { ...state.sessaoAtual, status: 'paused' },
              timerInterval: null
            };
          }
          return {};
        });
      },
      
      retomarSessao: () => {
          const { sessaoAtual, _tick } = get();
          if (sessaoAtual?.status === 'paused') {
              const interval = window.setInterval(_tick, 1000);
              set({
                  sessaoAtual: { ...sessaoAtual, status: 'running' },
                  timerInterval: interval
              });
          }
      },
      
      encerrarSessaoParaSalvar: () => {
        get().pausarSessao();
        useUiStore.getState().openSaveModal();
      },

      salvarSessao: async (detalhes, tempoEmSegundos) => {
        const { sessaoAtual, addSessao, descartarSessao } = get();
        if (!sessaoAtual) return;

        let tempoEstudado = 0;
        if (tempoEmSegundos !== undefined) {
          tempoEstudado = tempoEmSegundos;
        } else if (sessaoAtual.mode === 'cronometro') {
          tempoEstudado = sessaoAtual.elapsedSeconds;
        } else { // Pomodoro
          tempoEstudado = sessaoAtual.workSecondsAccumulated;
          if (sessaoAtual.pomodoroStage === 'work') {
            tempoEstudado += sessaoAtual.elapsedSeconds;
          }
        }
        
        if (tempoEstudado < 1) {
            descartarSessao();
            useUiStore.getState().closeSaveModal();
            return;
        };
        
        await addSessao({
          ...detalhes,
          tempo_estudado: Math.round(tempoEstudado),
          data_estudo: new Date().toISOString().split('T')[0],
        });
        
        descartarSessao();
        useUiStore.getState().closeSaveModal();
      },

      descartarSessao: () => {
        set(state => {
          if (state.timerInterval) clearInterval(state.timerInterval);
          return { sessaoAtual: null, timerInterval: null };
        });
        useUiStore.getState().closeSaveModal();
      },

      alternarModoTimer: () => {
        set(state => {
            if(state.sessaoAtual) {
                const newMode = state.sessaoAtual.mode === 'cronometro' ? 'pomodoro' : 'cronometro';
                // Reset timer when switching modes, keep it running
                return {
                    sessaoAtual: { ...state.sessaoAtual, 
                        elapsedSeconds: 0, 
                        mode: newMode,
                        pomodoroStage: 'work',
                        pomodoroCycle: 0,
                        workSecondsAccumulated: 0,
                    },
                }
            }
            return state;
        });
      },

      updatePomodoroSettings: (settings) => {
        set(state => ({
            pomodoroSettings: { ...state.pomodoroSettings, ...settings }
        }));
      },

      skipBreak: () => {
        set(state => {
            if (state.sessaoAtual && state.sessaoAtual.mode === 'pomodoro' && state.sessaoAtual.pomodoroStage !== 'work') {
                return {
                    sessaoAtual: {
                        ...state.sessaoAtual,
                        elapsedSeconds: 0,
                        pomodoroStage: 'work',
                    }
                }
            }
            return state;
        });
      },

      addSessao: async (sessao) => {
        const editalAtivoId = useEditalStore.getState().editalAtivo?.id;
        if (!editalAtivoId) throw new Error("Nenhum edital ativo selecionado.");

        try {
            const novaSessao = await createSessao(editalAtivoId, sessao);
            set(state => ({ sessoes: [...state.sessoes, novaSessao] }));
        } catch (error) {
            console.error("Failed to add session:", error);
            toast.error("Falha ao adicionar sessão de estudo.");
        }
      },
      updateSessao: async (id, updates) => {
        try {
            const sessaoAtualizada = await updateSessaoApi(id, updates);
            set(state => ({
                sessoes: state.sessoes.map(s => s.id === id ? sessaoAtualizada : s),
            }));
        } catch (error) {
            console.error("Failed to update session:", error);
            toast.error("Falha ao atualizar sessão de estudo.");
        }
      },
      removeSessao: async (id) => {
          try {
              await deleteSessao(id);
              set(state => ({
                  sessoes: state.sessoes.filter(s => s.id !== id),
              }));
          } catch (error) {
              console.error("Failed to delete session:", error);
              toast.error("Falha ao remover sessão de estudo.");
          }
      },
      moveTopicoNaTrilha: (topicoId, fromDia, toDia, fromIndex, toIndex) => {
        // Esta lógica permanece no frontend por enquanto, mas poderia ser movida para o backend
        set(state => {
          const newTrilha = JSON.parse(JSON.stringify(state.trilha));
          let itemToMove = topicoId;
          if (fromDia !== 'backlog') {
            const sourceColumn = newTrilha[fromDia];
            [itemToMove] = sourceColumn.splice(fromIndex, 1);
          }
          const destinationColumn = newTrilha[toDia];
          destinationColumn.splice(toIndex, 0, itemToMove);
          return { trilha: newTrilha };
        });
      },
    })
);