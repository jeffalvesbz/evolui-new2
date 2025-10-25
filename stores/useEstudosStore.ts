import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessaoEstudo } from '../types';
import { mockSessoesPorEdital } from '../data/mockData';
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';

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
  sessoesPorEdital: Record<string, SessaoEstudo[]>;
  trilha: TrilhaSemanalData;
  trilhaPorEdital: Record<string, TrilhaSemanalData>;
  editalAtivoId: string | null;
  sessaoAtual: SessaoAtual | null;
  timerInterval: number | null;
  pomodoroSettings: PomodoroSettings;
  _hasHydrated: boolean;
  
  setEditalAtivo: (editalId: string) => void;
  
  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro') => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }) => void;
  iniciarSessaoInteligente: () => void;
  abrirModalEstudoManual: () => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  encerrarSessaoParaSalvar: () => void;
  salvarSessao: (detalhes: Omit<SessaoEstudo, 'id' | 'tempo_estudado' | 'data_estudo' | 'topico_id'> & { topico_id: string }, tempoEmSegundos?: number) => Promise<void>;
  descartarSessao: () => void;
  alternarModoTimer: () => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  skipBreak: () => void;


  addSessao: (sessao: SessaoEstudo) => Promise<void>;
  updateSessao: (id: string, updates: Partial<Omit<SessaoEstudo, 'id'>>) => Promise<void>;
  removeSessao: (id: string) => Promise<void>;
  moveTopicoNaTrilha: (topicoId: string, fromDia: string, toDia: string, fromIndex: number, toIndex: number) => void;
  removeDataForEdital: (editalId: string) => void;
  initializeDataForEdital: (editalId: string) => void;
  _tick: () => void;
}

const emptyTrilha: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };

export const useEstudosStore = create<EstudosStore>()(
  persist(
    (set, get) => ({
      sessoes: [],
      sessoesPorEdital: {},
      trilha: emptyTrilha,
      trilhaPorEdital: {},
      editalAtivoId: null,
      sessaoAtual: null,
      timerInterval: null,
      pomodoroSettings: {
        work: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        cyclesBeforeLongBreak: 4,
      },
      _hasHydrated: false,

      setEditalAtivo: (editalId) => {
        set(state => {
          let sessoesDoEdital = state.sessoesPorEdital[editalId];
          let trilhaDoEdital = state.trilhaPorEdital[editalId];
          const newSessoesState = { ...state.sessoesPorEdital };
          const newTrilhaState = { ...state.trilhaPorEdital };

          if (sessoesDoEdital === undefined) {
            sessoesDoEdital = mockSessoesPorEdital[editalId] ?? [];
            newSessoesState[editalId] = sessoesDoEdital;
          }
          if (trilhaDoEdital === undefined) {
            trilhaDoEdital = emptyTrilha;
            newTrilhaState[editalId] = trilhaDoEdital;
          }

          return {
            editalAtivoId: editalId,
            sessoes: sessoesDoEdital,
            trilha: trilhaDoEdital,
            sessoesPorEdital: newSessoesState,
            trilhaPorEdital: newTrilhaState,
          };
        });
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
          id: `ses-${sessaoAtual.topico.id.startsWith('manual-') ? 'manual-' : ''}${Date.now()}`,
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
        const { editalAtivoId } = get();
        if (!editalAtivoId) {
          console.error("Não é possível adicionar sessão, nenhum edital ativo.");
          throw new Error("Nenhum edital ativo selecionado.");
        }
        set(state => {
          const sessoesAtuais = state.sessoesPorEdital[editalAtivoId] || [];
          const novasSessoes = [...sessoesAtuais, sessao];
          return {
            sessoes: novasSessoes,
            sessoesPorEdital: { ...state.sessoesPorEdital, [editalAtivoId]: novasSessoes },
          };
        });
      },
      updateSessao: async (id, updates) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;
    
        set(state => {
            const novasSessoes = state.sessoes.map(s =>
                s.id === id ? { ...s, ...updates } : s
            );
            return {
                sessoes: novasSessoes,
                sessoesPorEdital: {
                    ...state.sessoesPorEdital,
                    [editalAtivoId]: novasSessoes,
                },
            };
        });
      },
      removeSessao: async (id) => {
          const { editalAtivoId } = get();
          if (!editalAtivoId) return;
      
          set(state => {
              const novasSessoes = state.sessoes.filter(s => s.id !== id);
              return {
                  sessoes: novasSessoes,
                  sessoesPorEdital: {
                      ...state.sessoesPorEdital,
                      [editalAtivoId]: novasSessoes,
                  },
              };
          });
      },
      moveTopicoNaTrilha: (topicoId, fromDia, toDia, fromIndex, toIndex) => {
        const { editalAtivoId } = get();
        if (!editalAtivoId) return;

        set(state => {
          const newTrilha = JSON.parse(JSON.stringify(state.trilha));
    
          let itemToMove = topicoId;
    
          if (fromDia !== 'backlog') {
            const sourceColumn = newTrilha[fromDia];
            [itemToMove] = sourceColumn.splice(fromIndex, 1);
          }
    
          const destinationColumn = newTrilha[toDia];
          destinationColumn.splice(toIndex, 0, itemToMove);
    
          return { 
              trilha: newTrilha,
              trilhaPorEdital: { ...state.trilhaPorEdital, [editalAtivoId]: newTrilha },
          };
        });
      },
      removeDataForEdital: (editalId) => {
          set(state => {
              const { [editalId]: _, ...sessoesRest } = state.sessoesPorEdital;
              const { [editalId]: __, ...trilhaRest } = state.trilhaPorEdital;
              return { 
                  sessoesPorEdital: sessoesRest,
                  trilhaPorEdital: trilhaRest 
              };
          });
      },
      initializeDataForEdital: (editalId) => {
        set(state => {
            if (state.sessoesPorEdital[editalId] === undefined) {
                return {
                    sessoesPorEdital: { ...state.sessoesPorEdital, [editalId]: [] },
                    trilhaPorEdital: { ...state.trilhaPorEdital, [editalId]: emptyTrilha },
                };
            }
            return state;
        });
      },
    }),
    {
      name: 'evolui-study-sessions', 
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        sessoesPorEdital: state.sessoesPorEdital, 
        trilhaPorEdital: state.trilhaPorEdital,
        pomodoroSettings: state.pomodoroSettings,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state._hasHydrated = true;
      },
    }
  )
);