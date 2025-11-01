import { useEffect, useMemo } from 'react'
import { useRevisoesStore } from '../stores/useRevisoesStore'
import { Revisao } from '../types'
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { isSameDay, isAfter, isBefore, startOfDay, addDays, subDays } from 'date-fns';


// Tipos para os dados processados
export interface RevisoesProcessadas {
  revisoes: Revisao[]
  pendentesHoje: Revisao[]
  programadas: Revisao[]
  atrasadas: Revisao[]
  concluidas: Revisao[]
  
  // Métricas
  totalPendentes: number
  totalProgramadas: number
  totalAtrasadas: number
  totalConcluidas: number
  
  // Estatísticas
  estatisticas: {
    porOrigem: Record<string, number>
    porDificuldade: Record<string, number>
    porStatus: Record<string, number>
    taxaConclusao: number
  }
  
  // Funções
  concluirRevisao: (id: string, resultado: 'acertou' | 'errou' | 'adiou', novaDificuldade?: 'facil' | 'medio' | 'dificil') => Promise<void>
  reagendarRevisao: (id: string, dias: number) => Promise<void>
  removeRevisao: (id: string) => Promise<void>
  atualizarStatusAtrasadas: () => Promise<void>
  
  // Estado
  loading: boolean
  error: string | null
}


// Hook principal
export const useRevisoes = (): RevisoesProcessadas => {
  const {
    revisoes,
    loading,
    error,
    concluirRevisao: concluirRevisaoStore,
    reagendarRevisao,
    removeRevisao,
    atualizarStatusAtrasadas,
  } = useRevisoesStore()

  // Carregar revisões na inicialização
  useEffect(() => {
    // Data fetching is now centralized in App.tsx via useEditalDataSync.
    // This avoids redundant or erroneous calls from this hook.
  }, [])

  // Atualizar status de atrasadas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      void atualizarStatusAtrasadas()
    }, 60000) // A cada minuto

    return () => clearInterval(interval)
  }, [atualizarStatusAtrasadas])

  // Processar dados das revisões
  const dadosProcessados = useMemo(() => {
    const hoje = startOfDay(new Date());

    const revisoesProcessadas = revisoes.filter(
      revisao => revisao.origem === 'teorica' || revisao.origem === 'manual'
    );

    // Filtrar revisões por status e data
    const pendentesHoje = revisoesProcessadas.filter(revisao => 
      isSameDay(new Date(revisao.data_prevista), hoje) && revisao.status === 'pendente'
    )

    const programadas = revisoesProcessadas.filter(revisao => 
      isAfter(new Date(revisao.data_prevista), hoje) && revisao.status === 'pendente'
    )

    const atrasadas = revisoesProcessadas.filter(revisao => revisao.status === 'atrasada');


    const concluidas = revisoesProcessadas.filter(revisao => 
      revisao.status === 'concluida'
    )

    // Calcular métricas
    const totalPendentes = pendentesHoje.length
    const totalProgramadas = programadas.length
    const totalAtrasadas = atrasadas.length
    const totalConcluidas = concluidas.length

    // Estatísticas por origem
    const porOrigem = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.origem] = (acc[revisao.origem] || 0) + 1
      return acc
    }, {})

    // Estatísticas por dificuldade
    const porDificuldade = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.dificuldade] = (acc[revisao.dificuldade] || 0) + 1
      return acc
    }, {})

    // Estatísticas por status
    const porStatus = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.status] = (acc[revisao.status] || 0) + 1
      return acc
    }, {})

    // Taxa de conclusão
    const taxaConclusao = revisoesProcessadas.length > 0 
      ? Math.round((totalConcluidas / revisoesProcessadas.length) * 100)
      : 0

    return {
      revisoes: revisoesProcessadas,
      pendentesHoje,
      programadas,
      atrasadas,
      concluidas,
      totalPendentes,
      totalProgramadas,
      totalAtrasadas,
      totalConcluidas,
      estatisticas: {
        porOrigem,
        porDificuldade,
        porStatus,
        taxaConclusao,
      },
    }
  }, [revisoes])

  // Função wrapper para concluir revisão
  const concluirRevisao = async (
    id: string, 
    resultado: 'acertou' | 'errou' | 'adiou',
    novaDificuldade?: 'facil' | 'medio' | 'dificil'
  ) => {
    try {
      await concluirRevisaoStore({ id, resultado, novaDificuldade })
    } catch (error) {
      console.error('❌ Erro ao concluir revisão via hook:', error)
      throw error
    }
  }

  return {
    ...dadosProcessados,
    concluirRevisao,
    reagendarRevisao,
    removeRevisao,
    atualizarStatusAtrasadas,
    loading,
    error,
  }
}

// Hook para revisões específicas por período
export const useRevisoesPorPeriodo = (periodo: 'hoje' | 'semana' | 'mes') => {
  const { revisoes, loading, error } = useRevisoesStore()

  const revisoesFiltradas = useMemo(() => {
    const agora = new Date();
    const hoje = startOfDay(agora);
    
    return revisoes.filter(revisao => {
      const dataPrevista = new Date(revisao.data_prevista);
      
      switch (periodo) {
        case 'hoje':
          return isSameDay(dataPrevista, hoje);
        case 'semana':
          const umaSemanaAtras = subDays(hoje, 7);
          return isAfter(dataPrevista, umaSemanaAtras) && isBefore(dataPrevista, addDays(hoje, 1));
        case 'mes':
            const umMesAtras = subDays(hoje, 30);
            return isAfter(dataPrevista, umMesAtras) && isBefore(dataPrevista, addDays(hoje, 1));
        default:
          return true
      }
    })
  }, [revisoes, periodo])

  return {
    revisoes: revisoesFiltradas,
    loading,
    error,
  }
}

// Hook para estatísticas avançadas
export const useEstatisticasRevisoes = () => {
  const { revisoes } = useRevisoesStore()

  const estatisticas = useMemo(() => {
    const hoje = new Date()
    const umaSemanaAtras = subDays(hoje, 7);
    const umMesAtras = subDays(hoje, 30);

    // Revisões da última semana
    const revisoesUltimaSemana = revisoes.filter(revisao => {
      const data = new Date(revisao.data_prevista)
      return data >= umaSemanaAtras && data <= hoje
    })

    // Revisões do último mês
    const revisoesUltimoMes = revisoes.filter(revisao => {
      const data = new Date(revisao.data_prevista)
      return data >= umMesAtras && data <= hoje
    })

    // Taxa de conclusão por período
    const taxaConclusaoSemana = revisoesUltimaSemana.length > 0
      ? Math.round((revisoesUltimaSemana.filter(r => r.status === 'concluida').length / revisoesUltimaSemana.length) * 100)
      : 0

    const taxaConclusaoMes = revisoesUltimoMes.length > 0
      ? Math.round((revisoesUltimoMes.filter(r => r.status === 'concluida').length / revisoesUltimoMes.length) * 100)
      : 0

    // Distribuição por dificuldade
    const distribuicaoDificuldade = revisoes.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.dificuldade] = (acc[revisao.dificuldade] || 0) + 1
      return acc
    }, {})

    // Performance por origem
    // FIX: Add type assertion to the initial value of reduce to ensure correct type inference for `performancePorOrigem`.
    const performancePorOrigem = revisoes.reduce((acc, revisao) => {
      if (!acc[revisao.origem]) {
        acc[revisao.origem] = { total: 0, concluidas: 0 }
      }
      acc[revisao.origem].total++
      if (revisao.status === 'concluida') {
        acc[revisao.origem].concluidas++
      }
      return acc
    }, {} as Record<string, { total: number; concluidas: number }>)

    // Calcular taxa de conclusão por origem
    const taxaPorOrigem = Object.entries(performancePorOrigem).reduce((acc: Record<string, number>, [origem, dados]) => {
      acc[origem] = dados.total > 0 ? Math.round((dados.concluidas / dados.total) * 100) : 0
      return acc
    }, {})

    return {
      revisoesUltimaSemana: revisoesUltimaSemana.length,
      revisoesUltimoMes: revisoesUltimoMes.length,
      taxaConclusaoSemana,
      taxaConclusaoMes,
      distribuicaoDificuldade,
      taxaPorOrigem,
      totalRevisoes: revisoes.length,
    }
  }, [revisoes])

  return estatisticas
}

export default useRevisoes