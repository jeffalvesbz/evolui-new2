import { create } from 'zustand';
<<<<<<< HEAD
import { RedacaoCorrigida, CorrecaoCompleta, NotasPesosEntrada } from '../types';
import { getRedacoes, createRedacao, corrigirRedacao, deleteRedacao } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

interface CorrecaoEmAndamento {
  id: string;
  redacao: string;
  banca: string;
  notaMaxima: number;
  tema?: string;
  notasPesos?: NotasPesosEntrada;
  dataInicio: string;
}

interface RedacaoStore {
  historico: RedacaoCorrigida[];
  loading: boolean;
  correcaoEmAndamento: CorrecaoEmAndamento | null;
  fetchRedacoes: (studyPlanId: string) => Promise<void>;
  addCorrecao: (data: Omit<RedacaoCorrigida, 'id' | 'data' | 'studyPlanId'>) => Promise<void>;
  iniciarCorrecao: (redacao: string, banca: string, notaMaxima: number, tema?: string, notasPesos?: NotasPesosEntrada) => Promise<void>;
  cancelarCorrecao: () => void;
  removeRedacao: (redacaoId: string) => Promise<void>;
  getRedacoesDoMesAtual: () => number;
}

export const useRedacaoStore = create<RedacaoStore>((set, get) => ({
  historico: [],
  loading: false,
  correcaoEmAndamento: null,

  // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
  fetchRedacoes: async (studyPlanId: string) => {
    set({ loading: true });
    try {
      const historico = await getRedacoes(studyPlanId);
      set({ historico });
    } catch (error) {
      console.error("Failed to fetch redacoes:", error);
      toast.error("Não foi possível carregar o histórico de redações.");
    } finally {
      set({ loading: false });
    }
  },

  addCorrecao: async (data) => {
    const studyPlanId = useEditalStore.getState().editalAtivo?.id;
    if (!studyPlanId) {
      toast.error("Nenhum plano de estudo ativo para salvar a redação.");
      return;
    }
    try {
      // ✅ Corrigido: Adicionada a propriedade `data` obrigatória na chamada `createRedacao`.
      const novaRedacaoCorrigida = await createRedacao(studyPlanId, { ...data, data: new Date().toISOString() });
      set(state => ({
        historico: [novaRedacaoCorrigida, ...state.historico],
      }));
    } catch (error) {
      toast.error("Falha ao salvar a redação no histórico.");
      console.error(error);
    }
  },

  iniciarCorrecao: async (redacao: string, banca: string, notaMaxima: number, tema?: string, notasPesos?: NotasPesosEntrada) => {
    // Verificar se já há uma correção em andamento
    if (get().correcaoEmAndamento) {
      toast.warning("Já existe uma correção em andamento. Aguarde a conclusão.");
      return;
    }

    const correcaoId = `correcao-${Date.now()}`;
    const bancaNormalizada = (banca === 'CESPE' || banca === 'Cebraspe') ? 'Cebraspe' : banca;

    set({
      correcaoEmAndamento: {
        id: correcaoId,
        redacao,
        banca: bancaNormalizada,
        notaMaxima,
        tema,
        notasPesos,
        dataInicio: new Date().toISOString()
      }
    });

    toast.info("Correção iniciada. Você pode navegar pela aplicação enquanto processamos.");

    // Função helper para timeout
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout: A correção demorou mais de ${timeoutMs / 1000} segundos`)), timeoutMs)
        )
      ]);
    };

    // Verificar se a API key está configurada antes de iniciar
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env?.GEMINI_API_KEY;
    if (!apiKey) {
      toast.error("API Key do Gemini não configurada. Configure VITE_GEMINI_API_KEY no arquivo .env");
      set({ correcaoEmAndamento: null });
      return;
    }

    // Executar correção em background com timeout de 5 minutos
    try {
      console.log('🚀 Iniciando correção de redação...', { banca: bancaNormalizada, tamanhoTexto: redacao.length });

      const resultado = await withTimeout(
        corrigirRedacao(redacao, bancaNormalizada, notaMaxima, tema, notasPesos),
        300000 // 5 minutos de timeout
      );

      console.log('✅ Correção concluída com sucesso', { notaFinal: resultado.notaFinal });

      const studyPlanId = useEditalStore.getState().editalAtivo?.id;
      if (!studyPlanId) {
        toast.error("Nenhum plano de estudo ativo para salvar a redação.");
        set({ correcaoEmAndamento: null });
        return;
      }

      try {
        console.log('💾 Salvando redação no histórico...');
        const novaRedacaoCorrigida = await createRedacao(studyPlanId, {
          texto: redacao,
          banca: bancaNormalizada,
          notaMaxima,
          correcao: resultado,
          tema,
          data: new Date().toISOString()
        });

        set(state => ({
          historico: [novaRedacaoCorrigida, ...state.historico],
          correcaoEmAndamento: null
        }));

        // Notificação de sucesso
        toast.success(`Redação corrigida com sucesso! Nota: ${resultado.notaFinal.toFixed(1)}/${notaMaxima}`);
        console.log('✅ Redação salva com sucesso no histórico');
      } catch (error) {
        console.error("❌ Erro ao salvar redação:", error);
        toast.error("Correção concluída, mas houve erro ao salvar no histórico. Verifique o console para mais detalhes.");
        set({ correcaoEmAndamento: null });
      }
    } catch (error: any) {
      console.error("❌ Erro na correção:", error);

      // Mensagens de erro mais específicas
      let mensagemErro = "Ocorreu um erro ao processar a correção.";
      if (error?.message?.includes('Timeout')) {
        mensagemErro = "A correção está demorando muito. Tente novamente ou verifique sua conexão.";
      } else if (error?.message?.includes('API key')) {
        mensagemErro = "Erro na configuração da API. Verifique as credenciais do Gemini.";
      } else if (error?.message) {
        mensagemErro = `Erro: ${error.message}`;
      }

      toast.error(mensagemErro);
      set({ correcaoEmAndamento: null });
    }
  },

  cancelarCorrecao: () => {
    set({ correcaoEmAndamento: null });
    toast.info("Correção cancelada.");
  },

  removeRedacao: async (redacaoId: string) => {
    try {
      await deleteRedacao(redacaoId);
      set(state => ({
        historico: state.historico.filter(r => r.id !== redacaoId)
      }));
      toast.success("Redação excluída com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir redação:", error);
      toast.error("Não foi possível excluir a redação.");
    }
  },

  getRedacoesDoMesAtual: () => {
    const now = new Date();
    const mesAtual = now.getMonth();
    const anoAtual = now.getFullYear();

    return get().historico.filter(redacao => {
      if (!redacao.data) return false;
      const dataRedacao = new Date(redacao.data);
      return dataRedacao.getMonth() === mesAtual && dataRedacao.getFullYear() === anoAtual;
    }).length;
  },
})
=======
import { RedacaoCorrigida } from '../types';
import { getRedacoes, createRedacao } from '../services/geminiService';
import { toast } from '../components/Sonner';
import { useEditalStore } from './useEditalStore';

interface RedacaoStore {
  historico: RedacaoCorrigida[];
  loading: boolean;
  fetchRedacoes: (studyPlanId: string) => Promise<void>;
  addCorrecao: (data: Omit<RedacaoCorrigida, 'id' | 'data' | 'studyPlanId'>) => Promise<void>;
}

export const useRedacaoStore = create<RedacaoStore>((set, get) => ({
      historico: [],
      loading: false,

      // ✅ Corrigido: Parâmetro renomeado para `studyPlanId` para consistência com o serviço.
      fetchRedacoes: async (studyPlanId: string) => {
          set({ loading: true });
          try {
              const historico = await getRedacoes(studyPlanId);
              set({ historico });
          } catch (error) {
              console.error("Failed to fetch redacoes:", error);
              toast.error("Não foi possível carregar o histórico de redações.");
          } finally {
              set({ loading: false });
          }
      },

      addCorrecao: async (data) => {
        const studyPlanId = useEditalStore.getState().editalAtivo?.id;
        if (!studyPlanId) {
            toast.error("Nenhum plano de estudo ativo para salvar a redação.");
            return;
        }
        try {
            // ✅ Corrigido: Adicionada a propriedade `data` obrigatória na chamada `createRedacao`.
            const novaRedacaoCorrigida = await createRedacao(studyPlanId, { ...data, data: new Date().toISOString() });
            set(state => ({
              historico: [novaRedacaoCorrigida, ...state.historico],
            }));
        } catch (error) {
            toast.error("Falha ao salvar a redação no histórico.");
            console.error(error);
        }
      },
    })
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
);