
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SessaoEstudo } from '../types';
import { useUiStore } from './useUiStore';
import { toast } from '../components/Sonner';
import { getSessoes, createSessao, updateSessaoApi, deleteSessao, saveTrilhasPorSemana, getTrilhasPorSemana } from '../services/geminiService';
import { useEditalStore } from './useEditalStore';
import { useCiclosStore } from './useCiclosStore';
import { useHistoricoStore } from './useHistoricoStore';

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
  
  fetchSessoes: (studyPlanId: string) => Promise<void>;
  
  // Ações do cronômetro
  iniciarSessao: (topico: { id: string, nome: string, disciplinaId?: string }, mode?: 'cronometro' | 'pomodoro', options?: SessaoOptions) => void;
  iniciarSessaoParaConclusaoRapida: (topico: { id: string, nome: string, disciplinaId?: string }, options?: SessaoOptions) => void;
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
  loadTrilhaSemanal: (studyPlanId: string, weekKey?: string) => Promise<void>;
  saveTrilhasToDb: () => Promise<void>;
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
            // Obter data local no formato YYYY-MM-DD (não UTC)
            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');
            const dataLocal = `${ano}-${mes}-${dia}`;
            
            await addSessao({
              ...detalhesComCiclo,
              tempo_estudado: Math.round(tempoEstudado),
              data_estudo: dataLocal,
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
