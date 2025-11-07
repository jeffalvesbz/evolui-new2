
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessaoEstudo, XpLogEvent } from '../types';
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';
import { getSessoes, createSessao, updateSessaoApi, deleteSessao, saveTrilhasPorSemana, getTrilhasPorSemana } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { useGamificationStore } from './useGamificationStore';
import { checkAndAwardBadges } from '../services/badgeService';
import { useCiclosStore } from './useCiclosStore';
import { startOfWeek, format } from 'date-fns';

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
  
  fetchSessoes: (studyPlanId: string) => Promise<void>;
  
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
  setTrilhaCompleta: (novaTrilha: TrilhaSemanalData) => void;
  trilhasPorSemana: Record<string, TrilhaSemanalData>;
  setTrilhaSemana: (weekKey: string, trilha: TrilhaSemanalData) => void;
  getTrilhaSemana: (weekKey: string) => TrilhaSemanalData;
  setSemanaAtualKey: (weekKey: string) => void;
  toggleTopicoConcluidoNaTrilha: (weekKey: string, diaId: string, topicId: string) => void;
  isTopicoConcluidoNaTrilha: (weekKey: string, diaId: string, topicId: string) => boolean;
  fetchTrilhas: (studyPlanId: string) => Promise<void>;
  saveTrilhasToDb: () => Promise<void>;
  loadTrilhaSemanal: (studyPlanId: string, semanaRef?: string) => Promise<void>;
  saveTrilhaSemanal: (studyPlanId: string, semanaRef?: string) => Promise<void>;
  getHistoricoSemanas: () => Array<{ semanaRef: string; dataInicio: string }>;
  _tick: () => void;
}

const emptyTrilha: TrilhaSemanalData = { seg: [], ter: [], qua: [], qui: [], sex: [], sab: [], dom: [] };

// Helper para obter a referência da semana (data de início da semana no formato YYYY-MM-DD)
const getSemanaRef = (date: Date = new Date()): string => {
  const inicioSemana = startOfWeek(date, { weekStartsOn: 1 });
  return format(inicioSemana, 'yyyy-MM-dd');
};

// Variável para armazenar o timeout do debounce
let saveTrilhaDebounceTimeout: NodeJS.Timeout | null = null;

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

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchSessoes: async (studyPlanId: string) => {
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
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) throw new Error("Nenhum plano de estudo ativo selecionado.");

        try {
            const novaSessao = await createSessao(studyPlanId, sessao);
            set(state => ({ sessoes: [...state.sessoes, novaSessao] }));
            toast.success("Sessão adicionada com sucesso!");
            
            // Atualizar streak e verificar conquistas após adicionar sessão
            const { updateStreak } = useGamificationStore.getState();
            await updateStreak();
            // Aguardar um pouco para garantir que os dados estão atualizados
            setTimeout(() => {
              checkAndAwardBadges();
            }, 100);
        } catch (error: any) {
            console.error("Failed to add session:", error);
            const errorMessage = error?.message || "Falha ao adicionar sessão de estudo.";
            toast.error(errorMessage);
            throw error; // Re-throw para que o erro seja propagado
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
          
          // Usar semanaAtualKey do estado (semana que está sendo visualizada) ou calcular a semana atual
          const semanaRef = state.semanaAtualKey || getSemanaRef();
          const novasTrilhas = { ...state.trilhasPorSemana };
          
          // Verificar se mudou de semana
          if (state.semanaAtualKey && state.semanaAtualKey !== semanaRef) {
            // Nova semana detectada - criar novo slot automaticamente
            console.log(`Nova semana detectada: ${semanaRef} (anterior: ${state.semanaAtualKey})`);
          }
          
          const trilhaSemanaAtualSerializada = JSON.stringify(novasTrilhas[semanaRef] || {});
          // Só atualiza se for diferente
          if (trilhaSemanaAtualSerializada !== trilhaNovaSerializada) {
            // Atualizar apenas a semana específica (semanaRef), preservando outras semanas
            novasTrilhas[semanaRef] = trilhaValidada;
            
            // Salvar no banco de dados com debounce de 1 segundo
            const studyPlanId = useEditalStore.getState().editalAtivo?.id;
            if (studyPlanId) {
              // Limpar timeout anterior se existir
              if (saveTrilhaDebounceTimeout) {
                clearTimeout(saveTrilhaDebounceTimeout);
              }
              
              // Criar novo timeout - passar semanaRef para garantir que salve a semana correta
              saveTrilhaDebounceTimeout = setTimeout(() => {
                get().saveTrilhaSemanal(studyPlanId, semanaRef).catch(err => {
                  console.error("Erro ao salvar trilha semanal:", err);
                });
                saveTrilhaDebounceTimeout = null;
              }, 1000);
            }
          }
          
          return { 
            trilha: trilhaValidada,
            trilhasPorSemana: novasTrilhas,
            semanaAtualKey: semanaRef
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
            // Atualizar apenas a semana específica (weekKey), preservando outras semanas
            novasTrilhas[weekKey] = trilha;
            
            // Salvar no banco de dados com debounce de 1 segundo
            const studyPlanId = useEditalStore.getState().editalAtivo?.id;
            if (studyPlanId) {
              // Limpar timeout anterior se existir
              if (saveTrilhaDebounceTimeout) {
                clearTimeout(saveTrilhaDebounceTimeout);
              }
              
              // Criar novo timeout - passar weekKey para garantir que salve a semana correta
              saveTrilhaDebounceTimeout = setTimeout(() => {
                get().saveTrilhaSemanal(studyPlanId, weekKey).catch(err => {
                  console.error("Erro ao salvar trilha semanal:", err);
                });
                saveTrilhaDebounceTimeout = null;
              }, 1000);
            }
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
          
          // Salvar no banco de dados com debounce de 1 segundo
          const studyPlanId = useEditalStore.getState().editalAtivo?.id;
          if (studyPlanId) {
            // Limpar timeout anterior se existir
            if (saveTrilhaDebounceTimeout) {
              clearTimeout(saveTrilhaDebounceTimeout);
            }
            
            // Criar novo timeout - passar weekKey para garantir que salve a semana correta
            saveTrilhaDebounceTimeout = setTimeout(() => {
              get().saveTrilhaSemanal(studyPlanId, weekKey).catch(err => {
                console.error("Erro ao salvar trilha semanal:", err);
              });
              saveTrilhaDebounceTimeout = null;
            }, 1000);
          }
          
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
      loadTrilhaSemanal: async (studyPlanId: string, semanaRefParam?: string) => {
        try {
          // Usar semanaRef passada como parâmetro, ou semanaAtualKey do estado, ou calcular semana atual
          const state = get();
          const semanaRef = semanaRefParam || state.semanaAtualKey || getSemanaRef();
          
          const { trilhasPorSemana, trilhaConclusao } = await getTrilhasPorSemana(studyPlanId);
          
          // Atualizar estado com dados do banco (preservando semanas existentes)
          const trilhasMerged = { ...state.trilhasPorSemana, ...(trilhasPorSemana || {}) };
          
          set({ 
            trilhasPorSemana: trilhasMerged,
            trilhaConclusao: { ...state.trilhaConclusao, ...(trilhaConclusao || {}) }
          });
          
          const stateAtualizado = get();
          const trilhaSemanaAtual = stateAtualizado.trilhasPorSemana[semanaRef];
          
          if (trilhaSemanaAtual) {
            // Se existe trilha para a semana específica, restaura no estado
            set({ 
              trilha: trilhaSemanaAtual,
              semanaAtualKey: semanaRef
            });
          } else {
            // Se não existe, cria objeto vazio e salva
            const novaTrilha = { ...emptyTrilha };
            const novasTrilhas = { ...stateAtualizado.trilhasPorSemana, [semanaRef]: novaTrilha };
            
            set({ 
              trilha: novaTrilha,
              trilhasPorSemana: novasTrilhas,
              semanaAtualKey: semanaRef
            });
            
            // Salva automaticamente a nova semana
            await get().saveTrilhaSemanal(studyPlanId, semanaRef);
          }
        } catch (error) {
          console.error("Failed to load trilha semanal:", error);
          // Não mostra erro para o usuário, apenas usa estado vazio
        }
      },
      saveTrilhaSemanal: async (studyPlanId: string, semanaRefParam?: string) => {
        const state = get();
        // Usar semanaRef passada como parâmetro, ou semanaAtualKey do estado, ou calcular semana atual
        const semanaRef = semanaRefParam || state.semanaAtualKey || getSemanaRef();
        
        if (!semanaRef) {
          console.warn("Não foi possível determinar a semana atual");
          return;
        }
        
        // Obter dados existentes do banco para preservar outras semanas
        let existingData: Record<string, TrilhaSemanalData> = {};
        try {
          const { trilhasPorSemana } = await getTrilhasPorSemana(studyPlanId);
          existingData = trilhasPorSemana || {};
        } catch (error) {
          console.error("Erro ao buscar dados existentes:", error);
          // Continua com dados locais se falhar
          existingData = state.trilhasPorSemana || {};
        }
        
        // Obter dados da semana específica (semanaRef) do estado local
        // Prioridade: trilhasPorSemana[semanaRef] > trilha (se semanaAtualKey === semanaRef) > emptyTrilha
        const currentWeekData = state.trilhasPorSemana[semanaRef] || 
          (state.semanaAtualKey === semanaRef ? state.trilha : null) || 
          emptyTrilha;
        
        // Atualizar apenas a semana específica, preservando todas as outras semanas
        const trilhasParaSalvar = { 
          ...existingData,  // Preserva semanas existentes no banco
          [semanaRef]: currentWeekData  // Atualiza apenas a semana específica
        };
        
        // Filtrar conclusões apenas da semana específica e anteriores
        const conclusoesParaSalvar = Object.keys(state.trilhaConclusao || {})
          .filter(key => {
            // Manter conclusões da semana específica e anteriores
            const keySemanaRef = key.split('-')[0];
            return keySemanaRef <= semanaRef;
          })
          .reduce((acc, key) => {
            acc[key] = state.trilhaConclusao[key];
            return acc;
          }, {} as Record<string, boolean>);
        
        try {
          await saveTrilhasPorSemana(
            studyPlanId,
            trilhasParaSalvar,
            conclusoesParaSalvar
          );
          console.log(`✅ Trilha da semana ${semanaRef} salva com sucesso`);
          toast.success('Trilha salva automaticamente!');
        } catch (error: any) {
          console.error("❌ Failed to save trilha semanal:", error);
          if (error?.message?.includes('column') || error?.code === '42703') {
            console.warn("⚠️ Colunas trilhas_por_semana ou trilha_conclusao podem não existir no banco.");
          }
          // Não mostra toast de erro para não incomodar o usuário com salvamentos automáticos
        }
      },
      getHistoricoSemanas: () => {
        const state = get();
        const semanas = Object.keys(state.trilhasPorSemana || {})
          .sort()
          .reverse()
          .slice(0, 4)
          .map(semanaRef => ({
            semanaRef,
            dataInicio: semanaRef
          }));
        return semanas;
      },
    }),
    {
      name: 'evolui-estudos-store',
      storage: createJSONStorage(() => localStorage),
      // Persistir apenas trilhasPorSemana e trilhaConclusao no localStorage como fallback
      // O banco de dados é a fonte principal
      partialize: (state) => ({
        trilhasPorSemana: state.trilhasPorSemana,
        trilhaConclusao: state.trilhaConclusao,
        semanaAtualKey: state.semanaAtualKey,
      }),
    }
  )
);
