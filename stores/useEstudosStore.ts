
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessaoEstudo } from '../types';
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';
import { getSessoes, createSessao, updateSessaoApi, deleteSessao, saveTrilhasPorSemana, getTrilhasPorSemana, gerarPlanejamentoSemanal } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { useCiclosStore } from './useCiclosStore';
import { useHistoricoStore } from './useHistoricoStore';
import { useDisciplinasStore } from './useDisciplinasStore';

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
  cicloSessaoId?: string | null;
  origemTrilha?: boolean;
}

interface SessaoOptions {
  cicloSessaoId?: string | null;
  origemTrilha?: boolean;
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
  trilhaConclusao: Record<string, boolean>; // Chave: "weekKey-diaId-topicId", valor: true se concluído
  semanaAtualKey: string; // Chave da semana atual
  lastTickTimestamp: number | null; // Timestamp do último tick para cálculo de delta

  fetchSessoes: (studyPlanId: string, limit?: number) => Promise<void>;

  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro', options?: SessaoOptions) => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }, options?: SessaoOptions) => void;
  iniciarSessaoInteligente: () => void;
  abrirModalEstudoManual: () => void;
  pausarSessao: () => void;
  retomarSessao: () => void;
  encerrarSessaoParaSalvar: () => void;
  salvarSessao: (detalhes: Omit<SessaoEstudo, 'id' | 'tempo_estudado' | 'data_estudo' | 'topico_id' | 'studyPlanId'> & { topico_id: string, data_estudo?: string }, tempoEmSegundos?: number) => Promise<void>;
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
  syncTimer: () => void;
  _tick: () => void;
  syncTimer: () => void;
  _tick: () => void;

  // AI Actions
  gerarTrilhaComIA: (opcoes: { horasPorDia: number, materias: string[], nivel: string, foco: string }) => Promise<void>;
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
      lastTickTimestamp: null,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchSessoes: async (studyPlanId: string, limit?: number) => {
        if (!studyPlanId || studyPlanId.trim() === '') {
          console.warn('fetchSessoes chamado sem um studyPlanId válido.');
          return;
        }

        set({ loading: true });
        try {
          // Passar o limite para o serviço. Se limit for undefined, busca tudo (comportamento padrão)
          // Mas recomendamos passar um limite (ex: 300) para otimizar o load inicial
          const sessoes = await getSessoes(studyPlanId, limit);
          set({ sessoes });
          useCiclosStore.getState().syncProgressoComSessoes(sessoes);
          // Atualizar histórico após carregar sessões
          // NOTA: useHistoricoStore vai usar apenas as sessoes que estão no store (limitadas)
          useHistoricoStore.getState().fetchHistorico(studyPlanId);
        } catch (error) {
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
            cicloSessaoId: options?.cicloSessaoId ?? null,
            origemTrilha: options?.origemTrilha ?? false,
          },
          timerInterval: interval,
          lastTickTimestamp: Date.now(),
        });
        useUiStore.getState().closeSaveModal();
      },

      iniciarSessaoParaConclusaoRapida: (topico, options) => {
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
            cicloSessaoId: options?.cicloSessaoId ?? null,
            origemTrilha: options?.origemTrilha ?? false
          },
          timerInterval: null,
          lastTickTimestamp: null,
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
          lastTickTimestamp: null,
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
              timerInterval: null,
              lastTickTimestamp: null
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
            timerInterval: interval,
            lastTickTimestamp: Date.now()
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
      },

      descartarSessao: () => {
        set(state => {
          if (state.timerInterval) clearInterval(state.timerInterval);
          return { sessaoAtual: null, timerInterval: null, lastTickTimestamp: null };
        });
        useUiStore.getState().closeSaveModal();
      },

      alternarModoTimer: () => {
        set(state => {
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
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Nenhum plano de estudo ativo selecionado.");

        try {
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
        }
      },
      updateSessao: async (id, updates) => {
        try {
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
          if (novaTrilha[dia] && Array.isArray(novaTrilha[dia])) {
            trilhaValidada[dia] = novaTrilha[dia];
          }
        }
        set(state => {
          // Verificar se a trilha realmente mudou para evitar atualizações desnecessárias
          const trilhaAtualSerializada = JSON.stringify(state.trilha);
          const trilhaNovaSerializada = JSON.stringify(trilhaValidada);

          if (trilhaAtualSerializada === trilhaNovaSerializada && state.semanaAtualKey) {
            // Se a trilha não mudou e já temos a semana atual, não precisa atualizar trilhasPorSemana
            return {};
          }

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

          return {
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
          set({
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

        const trilhasParaSalvar = state.trilhasPorSemana || {};
        const conclusaoParaSalvar = state.trilhaConclusao || {};

        console.log("Salvando trilhas no banco:", {
          studyPlanId,
          trilhasKeys: Object.keys(trilhasParaSalvar),
          conclusaoKeys: Object.keys(conclusaoParaSalvar).length
        });

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
      gerarTrilhaComIA: async (opcoes) => {
        const { horasPorDia, materias, nivel, foco } = opcoes;
        const state = get();
        const editalStore = useEditalStore.getState();
        const disciplinasStore = useDisciplinasStore.getState();
        const ciclosStore = useCiclosStore.getState();

        if (!editalStore.editalAtivo) {
          toast.error("Nenhum edital ativo para gerar o planejamento.");
          return;
        }

        set({ loading: true });
        try {
          // Coletar tópicos estudados nos últimos 30 dias
          const diasAtras = 30;
          const dataLimite = new Date();
          dataLimite.setDate(dataLimite.getDate() - diasAtras);

          const topicosEstudados = state.sessoes
            .filter(s => {
              try {
                const dataSessao = new Date(s.data_estudo);
                return dataSessao >= dataLimite && s.studyPlanId === editalStore.editalAtivo?.id;
              } catch {
                return false;
              }
            })
            .map(s => {
              // Encontrar informações do tópico
              const topico = disciplinasStore.disciplinas
                ?.flatMap(d => d.topicos || [])
                .find(t => t.id === s.topico_id);

              const disciplina = disciplinasStore.disciplinas?.find(d =>
                d.topicos?.some(t => t.id === s.topico_id)
              );

              return {
                titulo: topico?.titulo || 'Tópico não identificado',
                disciplina: disciplina?.nome || 'Disciplina não identificada',
                data: s.data_estudo,
                duracao: s.tempo_estudado
              };
            })
            .filter(t => t.titulo !== 'Tópico não identificado'); // Remover entradas sem identificação

          // Agrupar por tópico e contar frequência
          const contagemTopicos = topicosEstudados.reduce((acc, t) => {
            const key = `${t.disciplina}:${t.titulo}`;
            if (!acc[key]) {
              acc[key] = { ...t, vezes: 0 };
            }
            acc[key].vezes += 1;
            return acc;
          }, {} as Record<string, any>);

          // Coletar contexto enriquecido
          const contexto = {
            edital: disciplinasStore.disciplinas?.map(d => d.nome) || [],
            topicosEstudadosRecentemente: Object.values(contagemTopicos).slice(0, 50), // Top 50 mais recentes
            estatisticas: {
              totalSessoes: topicosEstudados.length,
              disciplinasMaisEstudadas: Object.entries(
                topicosEstudados.reduce((acc, t) => {
                  if (t.disciplina) {
                    acc[t.disciplina] = (acc[t.disciplina] || 0) + 1;
                  }
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([nome, count]) => ({ nome, sessoes: count }))
            },
            pontosFracos: [] // TODO: Integrar com caderno de erros no futuro
          };

          // Converter IDs de matérias para nomes
          const nomesMateriasSelecionadas = materias
            .map(id => disciplinasStore.disciplinas?.find(d => d.id === id)?.nome)
            .filter((nome): nome is string => !!nome); // Remove undefined

          const novaTrilha = await gerarPlanejamentoSemanal(
            horasPorDia,
            nomesMateriasSelecionadas,
            nivel,
            foco,
            contexto
          );

          // Validar retorno (básico)
          if (!novaTrilha || (!novaTrilha.seg && !novaTrilha.ter)) {
            throw new Error("A IA não retornou um planejamento válido.");
          }

          // Adicionar IDs únicos para os itens da IA para permitir drag and drop
          // A função setTrilhaCompleta espera TrilhaSemanalData (string[])
          // MAS a IA retorna objetos completos. 
          // O componente TrilhaSemanal mapeia IDs para objetos em `topicsByDay`?
          // NÃO. TrilhaSemanalData guarda IDs (strings).
          // O store guarda APENAS IDs na trilha. Os dados reais precisam estar em algum lugar?
          // Atualmente o `TrilhaSemanal.tsx` parece ter `topicsByDay` que monta objetos DraggableTopics.
          // Mas de onde vêm os dados originais? Do `useEstudosStore.sessoes`? Não, a trilha é independente?

          // Re-checando: `useEstudosStore.trilha` é `Record<string, string[]>`. Guarda apenas IDs ou nomes?
          // `TrilhaSemanal.tsx` cria DraggableTopic baseado em... onde?
          // Ah, `items` são strings na `TrilhaSemanalData`.
          // Se eu insiro strings COMPLEXAS da IA na trilha, eu quebro o tipo ou tenho que adaptar.
          //
          // PROBLEMA: O sistema atual usa IDs (strings) que possivelmente são IDs de tópicos do banco.
          // A IA gera "títulos de atividades" que não existem no banco necessariamente.
          //
          // SOLUÇÃO: A `TrilhaSemanalData` pode aceitar strings arbitrárias.
          // O `TopicCard` renderiza o que está nessa string?
          // Vamos ver `TrilhaSemanal.tsx` -> `topicsByDay`.
          // Ele faz um map: `topics.map((t, index) => ({ id: t.instanceId, ...t }))`
          // Onde `topics` vem de `trilha[dia.id]`.
          //
          // Se `trilha` guarda strings, como viram objetos com `disciplinaId`, `type`, etc?
          // Se o sistema atual só suporta strings simples, eu preciso serializar o objeto da IA em JSON string
          // para salvar no array de strings da trilha.
          // E o componente `TrilhaSemanal` deve ser capaz de fazer parse se for JSON.

          // Vou assumir que vou salvar o objeto serializado no array de strings por enquanto,
          // ou modificar a estrutura da `trilha` para suportar objetos.
          // O type `TrilhaSemanalData` diz `[key: string]: string[];`.
          // Vou serializar o objeto gerado pela IA (title, type, disciplina) em uma string JSON.
          // E garantir que o `TrilhaSemanal.tsx` faça o parse.

          const trilhaSerializada: any = {};
          ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'].forEach(dia => {
            const atividadesDia = novaTrilha[dia] || [];
            trilhaSerializada[dia] = atividadesDia.map((ativ: any) => {
              // Adiciona ID único
              const itemComId = {
                id: `ia-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                titulo: ativ.titulo,
                disciplinaId: ativ.disciplina, // Usando nome como ID por enquanto ou tentar achar ID real
                type: ativ.type,
                duracaoEstimada: ativ.duracaoEstimada,
                isAiGenerated: true
              };
              return JSON.stringify(itemComId);
            });
          });

          // Atualizar trilha
          get().setTrilhaCompleta(trilhaSerializada);

          toast.success("Planejamento gerado com sucesso! 🚀");
        } catch (error) {
          console.error("Erro ao gerar trilha:", error);
          toast.error("Erro ao criar planejamento. Tente novamente.");
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'eleva-estudos-store',
      storage: createJSONStorage(() => localStorage),
      // Persistir sessaoAtual e lastTickTimestamp para sobreviver a reloads
      partialize: (state) => ({
        trilhasPorSemana: state.trilhasPorSemana,
        trilhaConclusao: state.trilhaConclusao,
        semanaAtualKey: state.semanaAtualKey,
        sessaoAtual: state.sessaoAtual,
        lastTickTimestamp: state.lastTickTimestamp,
      }),
    }
  )
);
