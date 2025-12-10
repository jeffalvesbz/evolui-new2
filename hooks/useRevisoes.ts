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
  programadasAmanha: Revisao[]
  programadasProximaSemana: Revisao[]
  programadasFuturas: Revisao[]
  atrasadas: Revisao[]
  concluidas: Revisao[]
  concluidasHoje: Revisao[]

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
    const amanha = addDays(hoje, 1);
    const proximos7dias = addDays(hoje, 8); // isBefore is exclusive, so add 8 to include up to day 7

    const revisoesProcessadas = revisoes.filter(
      revisao => revisao.origem === 'teorica' || revisao.origem === 'manual'
    );

    // Filtrar revisões por status e data
    const pendentesHoje = revisoesProcessadas.filter(revisao =>
      isSameDay(new Date(revisao.data_prevista), hoje) && revisao.status === 'pendente'
    )

    const programadas = revisoesProcessadas.filter(revisao =>
      isAfter(startOfDay(new Date(revisao.data_prevista)), hoje) && revisao.status === 'pendente'
    )

    // Novas categorias de programadas
    const programadasAmanha = programadas.filter(r => isSameDay(new Date(r.data_prevista), amanha));
    const programadasProximaSemana = programadas.filter(r => {
      const data = startOfDay(new Date(r.data_prevista));
      // isAfter(data, amanha) -> to exclude tomorrow which is already categorized
      // isBefore(data, proximos7dias) -> up to day 7
      return isAfter(data, amanha) && isBefore(data, proximos7dias);
    });
    const programadasFuturas = programadas.filter(r => {
      const data = startOfDay(new Date(r.data_prevista));
      // Not before 8 days from today, meaning day 8 and onwards
      return !isBefore(data, proximos7dias);
    });


    const atrasadas = revisoesProcessadas.filter(revisao =>
      revisao.status === 'atrasada' ||
      (revisao.status === 'pendente' && isBefore(startOfDay(new Date(revisao.data_prevista)), hoje))
    );


    const concluidas = revisoesProcessadas.filter(revisao =>
      revisao.status === 'concluida'
    )

    // Revisões concluídas HOJE (para a barra de progresso diário)
    const concluidasHoje = revisoesProcessadas.filter(revisao =>
      revisao.status === 'concluida' &&
      revisao.data_conclusao &&
      isSameDay(new Date(revisao.data_conclusao), hoje)
    )

    // Calcular métricas
    const totalPendentes = pendentesHoje.length
    const totalProgramadas = programadas.length
    const totalAtrasadas = atrasadas.length
    const totalConcluidas = concluidas.length

    // Estatísticas por origem
    // Fix: Add explicit type and initial value to accumulator to ensure correct type inference.
    const porOrigem = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.origem] = (acc[revisao.origem] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estatísticas por dificuldade
    // Fix: Add explicit type and initial value to accumulator to ensure correct type inference.
    const porDificuldade = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.dificuldade] = (acc[revisao.dificuldade] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Estatísticas por status
    // Fix: Add explicit type and initial value to accumulator to ensure correct type inference.
    const porStatus = revisoesProcessadas.reduce((acc: Record<string, number>, revisao) => {
      acc[revisao.status] = (acc[revisao.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Taxa de conclusão
    const taxaConclusao = revisoesProcessadas.length > 0
      ? Math.round((totalConcluidas / revisoesProcessadas.length) * 100)
      : 0

    return {
      revisoes: revisoesProcessadas,
      pendentesHoje,
      programadas,
      programadasAmanha,
      programadasProximaSemana,
      programadasFuturas,
      atrasadas,
      concluidas,
      concluidasHoje,
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
    }, {} as Record<string, number>)

    // Performance por origem
    // Fix: Provide initial value and type for the accumulator in reduce to prevent type errors.
    const performancePorOrigem = revisoes.reduce((acc: Record<string, { total: number; concluidas: number }>, revisao) => {
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
    // Fix: Add explicit type and initial value to accumulator to ensure correct type inference.
    const taxaPorOrigem = (Object.entries(performancePorOrigem) as [string, { total: number; concluidas: number }][]).reduce((acc: Record<string, number>, [origem, dados]) => {
      acc[origem] = dados.total > 0 ? Math.round((dados.concluidas / dados.total) * 100) : 0
      return acc
    }, {} as Record<string, number>)

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