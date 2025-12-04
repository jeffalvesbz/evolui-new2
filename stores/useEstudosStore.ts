
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
<<<<<<< HEAD
import { SessaoEstudo } from '../types';
=======
import { SessaoEstudo, XpLogEvent } from '../types';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';
import { getSessoes, createSessao, updateSessaoApi, deleteSessao, saveTrilhasPorSemana, getTrilhasPorSemana } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
<<<<<<< HEAD
import { useCiclosStore } from './useCiclosStore';
import { useHistoricoStore } from './useHistoricoStore';
=======
import { useGamificationStore } from './useGamificationStore';
import { checkAndAwardBadges } from '../services/badgeService';
import { useCiclosStore } from './useCiclosStore';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

export interface SessaoAtual {
  topico: {
    id: string; // Pode ser um topicoId real ou um id sintético como 'ciclo-sessaoId'
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
<<<<<<< HEAD
  cicloSessaoId?: string | null;
  origemTrilha?: boolean;
}

interface SessaoOptions {
  cicloSessaoId?: string | null;
  origemTrilha?: boolean;
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}

export type TrilhaSemanalData = {
  [key: string]: string[];
  seg: string[];
  ter: string[];
  qua: string[];
  qui: string[];
  sex: string[];
  sab: string[];
  dom: string[];
};

interface PomodoroSettings {
<<<<<<< HEAD
  work: number; // in seconds
  shortBreak: number;
  longBreak: number;
  cyclesBeforeLongBreak: number;
=======
    work: number; // in seconds
    shortBreak: number;
    longBreak: number;
    cyclesBeforeLongBreak: number;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
}

interface EstudosStore {
  sessoes: SessaoEstudo[];
  trilha: TrilhaSemanalData;
  loading: boolean;
  sessaoAtual: SessaoAtual | null;
  timerInterval: number | null;
  pomodoroSettings: PomodoroSettings;
  trilhaConclusao: Record<string, boolean>; // Chave: "weekKey-diaId-topicId", valor: true se concluído
  semanaAtualKey: string; // Chave da semana atual
<<<<<<< HEAD
  lastTickTimestamp: number | null; // Timestamp do último tick para cálculo de delta

  fetchSessoes: (studyPlanId: string) => Promise<void>;

  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro', options?: SessaoOptions) => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }, options?: SessaoOptions) => void;
=======
  
  fetchSessoes: (studyPlanId: string) => Promise<void>;
  
  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro') => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }) => void;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  iniciarSessaoInteligente: () => void;
  abrirModalEstudoManual: () => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  encerrarSessaoParaSalvar: () => void;
<<<<<<< HEAD
  salvarSessao: (detalhes: Omit<SessaoEstudo, 'id' | 'tempo_estudado' | 'data_estudo' | 'topico_id' | 'studyPlanId'> & { topico_id: string, data_estudo?: string }, tempoEmSegundos?: number) => Promise<void>;
=======
  salvarSessao: (detalhes: Omit<SessaoEstudo, 'id' | 'tempo_estudado' | 'data_estudo' | 'topico_id' | 'studyPlanId'> & { topico_id: string }, tempoEmSegundos?: number) => Promise<void>;
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  descartarSessao: () => void;
  alternarModoTimer: () => void;
  updatePomodoroSettings: (settings: Partial<PomodoroSettings>) => void;
  skipBreak: () => void;

  addSessao: (sessao: Omit<SessaoEstudo, 'id' | 'studyPlanId'>) => Promise<void>;
  updateSessao: (id: string, updates: Partial<Omit<SessaoEstudo, 'id'>>) => Promise<void>;
  removeSessao: (id: string) => Promise<void>;
  moveTopicoNaTrilha: (topicoId: string, fromDia: string, toDia: string, fromIndex: number, toIndex: number) => void;
  setTrilhaCompleta: (novaTrilha: TrilhaSemanalData) => void;
  trilhasPorSemana: Record<string, TrilhaSemanalData>;
  setTrilhaSemana: (weekKey: string, trilha: TrilhaSemanalData) => void;
  getTrilhaSemana: (weekKey: string) => TrilhaSemanalData;
  setSemanaAtualKey: (weekKey: string) => void;
  toggleTopicoConcluidoNaTrilha: (weekKey: string, diaId: string, topicId: string) => void;
  isTopicoConcluidoNaTrilha: (weekKey: string, diaId: string, topicId: string) => boolean;
  fetchTrilhas: (studyPlanId: string) => Promise<void>;
  loadTrilhaSemanal: (studyPlanId: string, weekKey?: string) => Promise<void>;
  saveTrilhasToDb: () => Promise<void>;
<<<<<<< HEAD
  syncTimer: () => void;
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  _tick: () => void;
}

const emptyTrilha: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };

export const useEstudosStore = create<EstudosStore>()(
  persist(
    (set, get) => ({
      sessoes: [],
      trilha: emptyTrilha,
      trilhasPorSemana: {},
      trilhaConclusao: {},
      semanaAtualKey: '',
      loading: false,
      sessaoAtual: null,
      timerInterval: null,
      pomodoroSettings: {
        work: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
        cyclesBeforeLongBreak: 4,
      },
<<<<<<< HEAD
      lastTickTimestamp: null,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchSessoes: async (studyPlanId: string) => {
        if (!studyPlanId || studyPlanId.trim() === '') {
          console.warn('fetchSessoes chamado sem um studyPlanId válido.');
          return;
        }

        set({ loading: true });
        try {
          const sessoes = await getSessoes(studyPlanId);
          set({ sessoes });
          useCiclosStore.getState().syncProgressoComSessoes(sessoes);
          // Atualizar histórico após carregar sessões
          useHistoricoStore.getState().fetchHistorico(studyPlanId);
        } catch (error) {
          console.error("Failed to fetch study sessions:", error);
          toast.error("Não foi possível carregar as sessões de estudo.");
        } finally {
          set({ loading: false });
        }
=======

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchSessoes: async (studyPlanId: string) => {
          if (!studyPlanId || studyPlanId.trim() === '') {
              console.warn('fetchSessoes chamado sem um studyPlanId válido.');
              return;
          }

          set({ loading: true });
          try {
              const sessoes = await getSessoes(studyPlanId);
              set({ sessoes });
          } catch(error) {
              console.error("Failed to fetch study sessions:", error);
              toast.error("Não foi possível carregar as sessões de estudo.");
          } finally {
              set({ loading: false });
          }
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      },

      _tick: () => {
        set(state => {
          if (!state.sessaoAtual || state.sessaoAtual.status !== 'running') {
            return {};
          }
<<<<<<< HEAD

          const now = Date.now();
          // Se não houver lastTickTimestamp (primeiro tick ou recuperação), usa o momento atual
          // Isso evita saltos gigantes se o timer estava "parado" mas o intervalo rodou
          const lastTick = state.lastTickTimestamp || now;

          // Calcula o delta em segundos
          const deltaSeconds = (now - lastTick) / 1000;

          // Se o delta for muito grande (ex: > 1 dia) ou negativo, algo está errado, ignora
          if (deltaSeconds < 0 || deltaSeconds > 86400) {
            return { lastTickTimestamp: now };
          }

          // Adiciona o delta ao tempo decorrido
          // Usamos Math.round para evitar problemas de precisão flutuante acumulada na exibição,
          // mas mantemos a precisão no cálculo se quiséssemos. 
          // Como o elapsedSeconds original era int, vamos manter a lógica de inteiros somando 1, 
          // mas agora somamos o delta arredondado ou acumulamos frações se necessário.
          // Para simplificar e manter compatibilidade: vamos somar o delta e arredondar o total.
          // Mas espere, se somarmos delta (float) em elapsedSeconds (int), pode quebrar tipos se não for number.
          // O tipo é number. Vamos somar o delta exato e arredondar apenas na exibição se precisar, 
          // ou arredondar o delta agora.
          // Melhor abordagem: Acumular o delta real.

          // IMPORTANTE: O setInterval pode rodar mais rápido ou devagar. 
          // Se rodar rápido (ex: 4ms), delta é 0.004.
          // Se rodar devagar (background), delta é 10.

          const newElapsed = state.sessaoAtual.elapsedSeconds + deltaSeconds;

          if (state.sessaoAtual.mode === 'pomodoro') {
            const { pomodoroSettings, sessaoAtual } = state;
            const currentStageDuration = pomodoroSettings[{ 'work': 'work', 'short_break': 'shortBreak', 'long_break': 'longBreak' }[sessaoAtual.pomodoroStage]];

            if (newElapsed >= currentStageDuration) {
              // Stage finished
              let { pomodoroStage, pomodoroCycle, workSecondsAccumulated } = sessaoAtual;

              if (pomodoroStage === 'work') {
                // Adiciona o tempo total do estágio, não apenas o delta
=======
      
          const newElapsed = state.sessaoAtual.elapsedSeconds + 1;
      
          if (state.sessaoAtual.mode === 'pomodoro') {
            const { pomodoroSettings, sessaoAtual } = state;
            const currentStageDuration = pomodoroSettings[{'work': 'work', 'short_break': 'shortBreak', 'long_break': 'longBreak'}[sessaoAtual.pomodoroStage]];
            
            if (newElapsed >= currentStageDuration) {
              // Stage finished
              let { pomodoroStage, pomodoroCycle, workSecondsAccumulated } = sessaoAtual;
              
              if (pomodoroStage === 'work') {
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
                workSecondsAccumulated += currentStageDuration;
                pomodoroCycle++;
                pomodoroStage = pomodoroCycle % pomodoroSettings.cyclesBeforeLongBreak === 0 ? 'long_break' : 'short_break';
              } else { // It was a break
                pomodoroStage = 'work';
              }
<<<<<<< HEAD

=======
              
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
              return {
                sessaoAtual: {
                  ...sessaoAtual,
                  elapsedSeconds: 0, // Reset for new stage
                  pomodoroStage,
                  pomodoroCycle,
                  workSecondsAccumulated,
<<<<<<< HEAD
                },
                lastTickTimestamp: now
              };
            }
          }

          return {
            sessaoAtual: { ...state.sessaoAtual, elapsedSeconds: newElapsed },
            lastTickTimestamp: now
          };
        });
      },


      iniciarSessao: (topico, mode = 'cronometro', options) => {
        get().descartarSessao();

=======
                }
              };
            }
          }
          
          return { sessaoAtual: { ...state.sessaoAtual, elapsedSeconds: newElapsed } };
        });
      },
      
      iniciarSessao: (topico, mode = 'cronometro') => {
        get().descartarSessao();
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
<<<<<<< HEAD
            cicloSessaoId: options?.cicloSessaoId ?? null,
            origemTrilha: options?.origemTrilha ?? false,
          },
          timerInterval: interval,
          lastTickTimestamp: Date.now(),
=======
          },
          timerInterval: interval,
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        });
        useUiStore.getState().closeSaveModal();
      },

<<<<<<< HEAD
      iniciarSessaoParaConclusaoRapida: (topico, options) => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa

=======
      iniciarSessaoParaConclusaoRapida: (topico) => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
<<<<<<< HEAD
            cicloSessaoId: options?.cicloSessaoId ?? null,
            origemTrilha: options?.origemTrilha ?? false
          },
          timerInterval: null,
          lastTickTimestamp: null,
        });

=======
          },
          timerInterval: null,
        });
        
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        // Aciona imediatamente o modal de salvamento
        get().encerrarSessaoParaSalvar();
      },

      iniciarSessaoInteligente: () => {
        get().iniciarSessao({ id: `livre-${Date.now()}`, nome: 'Estudo Inteligente' });
      },
<<<<<<< HEAD

      abrirModalEstudoManual: () => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa

=======
      
      abrirModalEstudoManual: () => {
        get().descartarSessao(); // Garante que nenhuma outra sessão esteja ativa
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
<<<<<<< HEAD
          lastTickTimestamp: null,
        });

=======
        });
        
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        // Aciona imediatamente o modal de salvamento
        get().encerrarSessaoParaSalvar();
      },

      pausarSessao: () => {
        set(state => {
          if (state.timerInterval) clearInterval(state.timerInterval);
          if (state.sessaoAtual) {
            return {
              sessaoAtual: { ...state.sessaoAtual, status: 'paused' },
<<<<<<< HEAD
              timerInterval: null,
              lastTickTimestamp: null
=======
              timerInterval: null
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
            };
          }
          return {};
        });
      },
<<<<<<< HEAD

      retomarSessao: () => {
        const { sessaoAtual, _tick } = get();
        if (sessaoAtual?.status === 'paused') {
          const interval = window.setInterval(_tick, 1000);
          set({
            sessaoAtual: { ...sessaoAtual, status: 'running' },
            timerInterval: interval,
            lastTickTimestamp: Date.now()
          });
        }
      },

=======
      
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
      
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
<<<<<<< HEAD

        if (tempoEstudado < 1) {
          descartarSessao();
          useUiStore.getState().closeSaveModal();
          return;
        };

        // Rastreamento de progresso do ciclo
        const cicloStore = useCiclosStore.getState();
        const cicloAtivoId = cicloStore.cicloAtivoId;
        let cicloSessaoId: string | null = null;
        if (sessaoAtual.topico.id.startsWith('ciclo-')) {
          cicloSessaoId = sessaoAtual.topico.id.replace('ciclo-', '');
        } else if (sessaoAtual.cicloSessaoId) {
          cicloSessaoId = sessaoAtual.cicloSessaoId;
        }
        if (cicloAtivoId && cicloSessaoId) {
          cicloStore.setUltimaSessaoConcluida(cicloAtivoId, cicloSessaoId);
        }

        const studyPlanId = useEditalStore.getState().editalAtivo?.id;

        if (!studyPlanId) {
          toast.error("Nenhum plano de estudo ativo. Selecione um edital antes de salvar.");
          return;
        }

        const detalhesComCiclo = { ...detalhes };
        if (cicloSessaoId) {
          const marker = `CICLO_SESSAO_ID:${cicloSessaoId}`;
          if (detalhesComCiclo.comentarios) {
            if (!detalhesComCiclo.comentarios.includes(marker)) {
              detalhesComCiclo.comentarios = `${detalhesComCiclo.comentarios} | ${marker}`;
            }
          } else {
            detalhesComCiclo.comentarios = marker;
          }
        }

        // Rastreamento de origem da trilha
        if (sessaoAtual.origemTrilha) {
          const trilhaMarker = `ORIGEM_TRILHA:true`;
          if (detalhesComCiclo.comentarios) {
            if (!detalhesComCiclo.comentarios.includes(trilhaMarker)) {
              detalhesComCiclo.comentarios = `${detalhesComCiclo.comentarios} | ${trilhaMarker}`;
            }
          } else {
            detalhesComCiclo.comentarios = trilhaMarker;
          }
        }

        try {
          // Se a data foi fornecida, usa ela. Caso contrário, usa a data atual local.
          let dataFinal = detalhes.data_estudo;

          if (!dataFinal) {
            // Obter data local no formato YYYY-MM-DD (não UTC)
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            dataFinal = `${ano}-${mes}-${dia}`;
          }

          await addSessao({
            ...detalhesComCiclo,
            tempo_estudado: Math.round(tempoEstudado),
            data_estudo: dataFinal,
          });

          // Recarregar sessões para atualizar o progresso do ciclo e histórico
          await get().fetchSessoes(studyPlanId);

          descartarSessao();
          useUiStore.getState().closeSaveModal();
        } catch (error: any) {
          // O erro já foi tratado e mostrado no toast pelo addSessao
          // Apenas garantir que o modal não feche em caso de erro
          console.error("Erro ao salvar sessão:", error);
          throw error;
        }
=======
        
        if (tempoEstudado < 1) {
            descartarSessao();
            useUiStore.getState().closeSaveModal();
            return;
        };

        // Rastreamento de progresso do ciclo
        if (sessaoAtual.topico.id.startsWith('ciclo-')) {
            const cicloStore = useCiclosStore.getState();
            const cicloAtivoId = cicloStore.cicloAtivoId;
            const sessaoCicloId = sessaoAtual.topico.id.replace('ciclo-', '');
            if (cicloAtivoId) {
                cicloStore.setUltimaSessaoConcluida(cicloAtivoId, sessaoCicloId);
            }
        }
        
        await addSessao({
          ...detalhes,
          tempo_estudado: Math.round(tempoEstudado),
          data_estudo: new Date().toISOString().split('T')[0],
        });
        
        const eventType: XpLogEvent = (sessaoAtual.isConclusaoRapida || sessaoAtual.topico.id.startsWith('manual-')) ? 'estudo_manual' : 'cronometro_finalizado';
        
        await useGamificationStore.getState().logXpEvent(
            eventType,
            { // meta
                topicoId: detalhes.topico_id,
                tempoEstudadoSeg: Math.round(tempoEstudado),
            },
            { // context
                durationMinutes: Math.round(tempoEstudado / 60)
            }
        );

        descartarSessao();
        useUiStore.getState().closeSaveModal();
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      },

      descartarSessao: () => {
        set(state => {
          if (state.timerInterval) clearInterval(state.timerInterval);
<<<<<<< HEAD
          return { sessaoAtual: null, timerInterval: null, lastTickTimestamp: null };
=======
          return { sessaoAtual: null, timerInterval: null };
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        });
        useUiStore.getState().closeSaveModal();
      },

      alternarModoTimer: () => {
        set(state => {
<<<<<<< HEAD
          if (state.sessaoAtual) {
            const newMode = state.sessaoAtual.mode === 'cronometro' ? 'pomodoro' : 'cronometro';
            // Reset timer when switching modes, keep it running
            return {
              sessaoAtual: {
                ...state.sessaoAtual,
                elapsedSeconds: 0,
                mode: newMode,
                pomodoroStage: 'work',
                pomodoroCycle: 0,
                workSecondsAccumulated: 0,
              },
            }
          }
          return state;
=======
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
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        });
      },

      updatePomodoroSettings: (settings) => {
        set(state => ({
<<<<<<< HEAD
          pomodoroSettings: { ...state.pomodoroSettings, ...settings }
=======
            pomodoroSettings: { ...state.pomodoroSettings, ...settings }
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        }));
      },

      skipBreak: () => {
        set(state => {
<<<<<<< HEAD
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
=======
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
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        });
      },

      addSessao: async (sessao) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Nenhum plano de estudo ativo selecionado.");

        try {
<<<<<<< HEAD
          const novaSessao = await createSessao(studyPlanId, sessao);
          set(state => {
            const atualizadas = [...state.sessoes, novaSessao];
            useCiclosStore.getState().syncProgressoComSessoes(atualizadas);
            return { sessoes: atualizadas };
          });
          // Atualizar histórico imediatamente após adicionar sessão
          useHistoricoStore.getState().fetchHistorico(studyPlanId);
        } catch (error: any) {
          console.error("Failed to add session:", error);
          // Mostrar mensagem de erro mais específica
          const errorMessage = error?.message || "Falha ao adicionar sessão de estudo.";
          toast.error(errorMessage);
          throw error;
=======
            const novaSessao = await createSessao(studyPlanId, sessao);
            set(state => ({ sessoes: [...state.sessoes, novaSessao] }));
        } catch (error) {
            console.error("Failed to add session:", error);
            toast.error("Falha ao adicionar sessão de estudo.");
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        }
      },
      updateSessao: async (id, updates) => {
        try {
<<<<<<< HEAD
          const sessaoAtualizada = await updateSessaoApi(id, updates);
          set(state => {
            const atualizadas = state.sessoes.map(s => s.id === id ? sessaoAtualizada : s);
            useCiclosStore.getState().syncProgressoComSessoes(atualizadas);
            return { sessoes: atualizadas };
          });
          // Atualizar histórico após atualizar sessão
          const studyPlanId = useEditalStore.getState().editalAtivo?.id;
          if (studyPlanId) {
            useHistoricoStore.getState().fetchHistorico(studyPlanId);
          }
        } catch (error) {
          console.error("Failed to update session:", error);
          toast.error("Falha ao atualizar sessão de estudo.");
        }
      },
      removeSessao: async (id) => {
        try {
          await deleteSessao(id);
          set(state => {
            const atualizadas = state.sessoes.filter(s => s.id !== id);
            useCiclosStore.getState().syncProgressoComSessoes(atualizadas);
            return { sessoes: atualizadas };
          });
          // Atualizar histórico após remover sessão
          const studyPlanId = useEditalStore.getState().editalAtivo?.id;
          if (studyPlanId) {
            useHistoricoStore.getState().fetchHistorico(studyPlanId);
          }
        } catch (error) {
          console.error("Failed to delete session:", error);
          toast.error("Falha ao remover sessão de estudo.");
        }
=======
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
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
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
      setTrilhaCompleta: (novaTrilha) => {
        const dias = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
        const trilhaValidada: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };
        for (const dia of dias) {
<<<<<<< HEAD
          if (novaTrilha[dia] && Array.isArray(novaTrilha[dia])) {
            trilhaValidada[dia] = novaTrilha[dia];
          }
=======
            if (novaTrilha[dia] && Array.isArray(novaTrilha[dia])) {
                trilhaValidada[dia] = novaTrilha[dia];
            }
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        }
        set(state => {
          // Verificar se a trilha realmente mudou para evitar atualizações desnecessárias
          const trilhaAtualSerializada = JSON.stringify(state.trilha);
          const trilhaNovaSerializada = JSON.stringify(trilhaValidada);
<<<<<<< HEAD

=======
          
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
          if (trilhaAtualSerializada === trilhaNovaSerializada && state.semanaAtualKey) {
            // Se a trilha não mudou e já temos a semana atual, não precisa atualizar trilhasPorSemana
            return {};
          }
<<<<<<< HEAD

=======
          
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
          // Atualizar também a trilha da semana atual
          const weekKey = state.semanaAtualKey;
          const novasTrilhas = { ...state.trilhasPorSemana };
          if (weekKey) {
            const trilhaSemanaAtualSerializada = JSON.stringify(novasTrilhas[weekKey] || {});
            // Só atualiza se for diferente
            if (trilhaSemanaAtualSerializada !== trilhaNovaSerializada) {
              novasTrilhas[weekKey] = trilhaValidada;
              // Salvar no banco de dados em segundo plano (com debounce)
              const saveFunction = get().saveTrilhasToDb;
              setTimeout(() => {
                saveFunction().catch(err => {
                  console.error("Erro ao salvar trilhas no banco:", err);
                });
              }, 500);
            }
          }
<<<<<<< HEAD

          return {
=======
          
          return { 
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
            trilha: trilhaValidada,
            trilhasPorSemana: novasTrilhas
          };
        });
      },
      setTrilhaSemana: (weekKey, trilha) => {
        set(state => {
          const novasTrilhas = { ...state.trilhasPorSemana };
          const trilhaAnterior = novasTrilhas[weekKey] || {};
          const trilhaAnteriorSerializada = JSON.stringify(trilhaAnterior);
          const trilhaNovaSerializada = JSON.stringify(trilha);
<<<<<<< HEAD

=======
          
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
          // Só atualiza se for diferente
          if (trilhaAnteriorSerializada !== trilhaNovaSerializada) {
            novasTrilhas[weekKey] = trilha;
            // Salvar no banco de dados em segundo plano (com debounce)
            const saveFunction = get().saveTrilhasToDb;
            // Usar setTimeout para fazer debounce e evitar muitas chamadas
            setTimeout(() => {
              saveFunction().catch(err => {
                console.error("Erro ao salvar trilhas no banco:", err);
              });
            }, 500);
          }
<<<<<<< HEAD

=======
          
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
          return { trilhasPorSemana: novasTrilhas };
        });
      },
      getTrilhaSemana: (weekKey) => {
        const state = get();
        return state.trilhasPorSemana[weekKey] || emptyTrilha;
      },
      setSemanaAtualKey: (weekKey) => {
        set({ semanaAtualKey: weekKey });
      },
      toggleTopicoConcluidoNaTrilha: (weekKey, diaId, topicId) => {
        set(state => {
          const key = `${weekKey}-${diaId}-${topicId}`;
          const novasConclusoes = { ...state.trilhaConclusao };
          if (novasConclusoes[key]) {
            delete novasConclusoes[key];
          } else {
            novasConclusoes[key] = true;
          }
          // Salvar no banco de dados em segundo plano (com debounce)
          const saveFunction = get().saveTrilhasToDb;
          setTimeout(() => {
            saveFunction().catch(err => {
              console.error("Erro ao salvar trilhas no banco:", err);
            });
          }, 500);
          return { trilhaConclusao: novasConclusoes };
        });
      },
      isTopicoConcluidoNaTrilha: (weekKey, diaId, topicId) => {
        const state = get();
        const key = `${weekKey}-${diaId}-${topicId}`;
        return !!state.trilhaConclusao[key];
      },
      fetchTrilhas: async (studyPlanId: string) => {
        try {
          const { trilhasPorSemana, trilhaConclusao } = await getTrilhasPorSemana(studyPlanId);
<<<<<<< HEAD
          set({
=======
          set({ 
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
            trilhasPorSemana: trilhasPorSemana || {},
            trilhaConclusao: trilhaConclusao || {}
          });
        } catch (error) {
          console.error("Failed to fetch trilhas:", error);
          // Não mostra erro para o usuário, apenas usa estado vazio
        }
      },
      loadTrilhaSemanal: async (studyPlanId: string, weekKey?: string) => {
        // Alias para fetchTrilhas para manter compatibilidade
        // O parâmetro weekKey é ignorado pois fetchTrilhas carrega todas as semanas
        await get().fetchTrilhas(studyPlanId);
      },
      saveTrilhasToDb: async () => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        const state = get();
        if (!studyPlanId) {
          console.warn("Não há plano de estudo ativo para salvar trilhas");
          return;
        }
<<<<<<< HEAD

        const trilhasParaSalvar = state.trilhasPorSemana || {};
        const conclusaoParaSalvar = state.trilhaConclusao || {};

=======
        
        const trilhasParaSalvar = state.trilhasPorSemana || {};
        const conclusaoParaSalvar = state.trilhaConclusao || {};
        
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        console.log("Salvando trilhas no banco:", {
          studyPlanId,
          trilhasKeys: Object.keys(trilhasParaSalvar),
          conclusaoKeys: Object.keys(conclusaoParaSalvar).length
        });
<<<<<<< HEAD

=======
        
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
        try {
          await saveTrilhasPorSemana(
            studyPlanId,
            trilhasParaSalvar,
            conclusaoParaSalvar
          );
          console.log("✅ Trilhas salvas no banco com sucesso");
        } catch (error: any) {
          console.error("❌ Failed to save trilhas to database:", error);
          // Se for erro de coluna não existente, vamos tentar usar a coluna antiga
          if (error?.message?.includes('column') || error?.code === '42703') {
            console.warn("⚠️ Colunas trilhas_por_semana ou trilha_conclusao podem não existir no banco. Execute o script de migração.");
            toast.error("Erro ao salvar trilha. Verifique se as colunas existem no banco de dados.");
          } else {
            toast.error("Erro ao salvar trilha no banco de dados.");
          }
        }
      },
<<<<<<< HEAD
      syncTimer: () => {
        const state = get();
        if (state.sessaoAtual?.status === 'running') {
          const now = Date.now();
          // Se não tiver intervalo rodando (ex: reload de página ou retorno de background), inicia
          if (!state.timerInterval) {
            const interval = window.setInterval(state._tick, 1000);
            set({ timerInterval: interval });
            // Força um tick imediato para atualizar o tempo
            state._tick();
          } else {
            // Se já estiver rodando, força um tick para garantir atualização visual imediata
            state._tick();
          }
        }
      },
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    }),
    {
      name: 'evolui-estudos-store',
      storage: createJSONStorage(() => localStorage),
<<<<<<< HEAD
      // Persistir sessaoAtual e lastTickTimestamp para sobreviver a reloads
=======
      // Persistir apenas trilhasPorSemana e trilhaConclusao no localStorage como fallback
      // O banco de dados é a fonte principal
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      partialize: (state) => ({
        trilhasPorSemana: state.trilhasPorSemana,
        trilhaConclusao: state.trilhaConclusao,
        semanaAtualKey: state.semanaAtualKey,
<<<<<<< HEAD
        sessaoAtual: state.sessaoAtual,
        lastTickTimestamp: state.lastTickTimestamp,
=======
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      }),
    }
  )
);
