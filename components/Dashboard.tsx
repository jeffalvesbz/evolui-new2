
import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, format, isSameDay, startOfDay, isBefore } from 'date-fns';
import { useIsMobile } from '../hooks/useIsMobile';
import {
  ClockIcon as Clock3,
  TargetIcon as Target,
  FlameIcon as Flame,
  SparklesIcon as Sparkles,
  BarChart3Icon as BarChart3,
  BookOpenIcon,
  PlayIcon as Play,
  BookOpenCheckIcon,
  CalendarClockIcon,
  ActivityIcon,
  RefreshCwIcon,
  WifiIcon,
  WifiOffIcon,
  EditIcon,
  PlusIcon,
} from './icons';

import EditalSelector from './EditalSelector';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button,
  Progress,
  SectionHeader,
} from '../lib/dashboardMocks';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useEditalStore } from '../stores/useEditalStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useDailyGoalStore } from '../stores/useDailyGoalStore';
import { useModalStore } from '../stores/useModalStore';
import { useAuthStore } from '../stores/useAuthStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import AcoesRecomendadas from './AcoesRecomendadas';
import { mensagensDiarias } from '../data/motivacoes';
import { gerarMensagemMotivacionalIA } from '../services/geminiService';
import { useUnifiedStreak } from '../utils/unifiedStreakCalculator';
import { subDays, differenceInDays } from 'date-fns';
import PremiumFeatureWrapper from './PremiumFeatureWrapper';
import { getYesterdayLocalDateISO } from '../utils/dateUtils';

// --- Chart Components ---

const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div
      className="recharts-custom-tooltip"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '0.75rem',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      }}
    >
      <p style={{
        color: '#ffffff',
        margin: '0 0 8px 0',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}>
        {label}
      </p>
      {payload.map((entry: any, index: number) => (
        <p key={index} style={{
          color: '#ffffff',
          margin: '4px 0',
          fontSize: '0.875rem',
        }}>
          {`${entry.dataKey}: ${entry.value} min`}
        </p>
      ))}
    </div>
  );
};

const CustomPieTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0];
  return (
    <div
      className="recharts-custom-tooltip"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.98)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '0.75rem',
        padding: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
      }}
    >
      <p style={{
        color: '#ffffff',
        margin: '0 0 8px 0',
        fontWeight: 600,
        fontSize: '0.875rem',
      }}>
        {data.name}
      </p>
      <p style={{
        color: '#ffffff',
        margin: '0',
        fontSize: '0.875rem',
      }}>
        {`${data.value} min`}
      </p>
    </div>
  );
};

const WeeklyStudyChart: React.FC<{ data: { name: string; 'Tempo (min)': number }[] }> = ({ data }) => {
  const isMobile = useIsMobile();
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
        <Tooltip
          cursor={{ fill: 'var(--color-highlight)' }}
          content={<CustomBarTooltip />}
        />
        <Bar dataKey="Tempo (min)" fill="url(#colorUv)" radius={[6, 6, 0, 0]} />
        <defs>
          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={1} />
            <stop offset="100%" stopColor="var(--color-secondary)" stopOpacity={0.8} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

const DisciplineFocusChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  const COLORS = ['#8B5CF6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#ef4444'];
  // Consider tablet as mobile for this chart layout to prevent legend clipping
  const isMobile = useIsMobile(1024);
  return (
    <ResponsiveContainer width="100%" height={isMobile ? 200 : 250}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy={isMobile ? "40%" : "50%"}
          labelLine={false}
          outerRadius={isMobile ? 70 : 90}
          innerRadius={isMobile ? 50 : 60}
          fill="#8884d8"
          dataKey="value"
          paddingAngle={5}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomPieTooltip />} />
        <Legend
          iconSize={10}
          layout={isMobile ? 'horizontal' : 'vertical'}
          verticalAlign={isMobile ? 'bottom' : 'middle'}
          align={isMobile ? 'center' : 'right'}
          wrapperStyle={{ fontSize: '0.875rem', color: 'var(--color-muted-foreground)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};


const formatStudyDuration = (minutes: number) => {
  const totalMinutes = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(totalMinutes / 60)
  const remaining = totalMinutes % 60
  if (hours <= 0) return `${remaining} min`
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}min`
}

const DAILY_GOAL_OPTIONS = [60, 90, 120, 150, 180, 210, 240, 300, 360, 420, 480, 540, 600, 660, 720]
const WEEKLY_GOAL_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40];

interface DashboardProps {
  setActiveView: (view: string) => void;
}

import { useEditalSync } from '../hooks/useEditalSync';

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  useEditalSync();
  const user = useAuthStore((state) => state.user);
  const editalAtivo = useEditalStore((state) => state.editalAtivo);
  const abrirModalEstudoManual = useEstudosStore((state) => state.abrirModalEstudoManual);
  const openRegisterEditalModal = useModalStore((state) => state.openRegisterEditalModal);
  const fetchErros = useCadernoErrosStore((state) => state.fetchErros); // Destructure fetchErros

  useEffect(() => {
    if (editalAtivo?.id) {
      // Carregar erros para o widget de estatísticas
      fetchErros(editalAtivo.id);
    }
  }, [editalAtivo?.id, fetchErros]);

  // Subscription check
  const { planType, hasActiveSubscription, isTrialActive } = useSubscriptionStore();
  const isActive = hasActiveSubscription() || isTrialActive();
  const isPremiumFeature = planType === 'free' || (!isActive && planType !== 'premium');

  const { goalMinutes, weeklyGoalHours, setGoalMinutes, setWeeklyGoalHours } = useDailyGoalStore();
  const { streak } = useUnifiedStreak();

  const [motivationalMessage, setMotivationalMessage] = useState<{ frase: string; autor: string | null }>({ frase: '', autor: null });
  const [isMessageLoading, setIsMessageLoading] = useState(true);

  const safeGoalMinutes = useMemo(() => (typeof goalMinutes === 'number' ? goalMinutes : 0), [goalMinutes]);
  // Calcular meta semanal proporcional à meta diária: (minutos diários * 7 dias) / 60 = horas semanais
  const safeWeeklyGoalHours = useMemo(() => Math.round((safeGoalMinutes * 7) / 60), [safeGoalMinutes]);

  // Edital-aware data from stores
  const sessoes = useEstudosStore((state) => state.sessoes);
  const disciplinas = useDisciplinasStore((state) => state.disciplinas);
  const revisoes = useRevisoesStore((state) => state.revisoes);
  const atualizarStatusAtrasadas = useRevisoesStore((state) => state.atualizarStatusAtrasadas);
  const erros = useCadernoErrosStore((state) => state.erros);

  // Real-time calculations based on active edital data
  const { tempoTotalHoje, sessoesDeHoje } = useMemo(() => {
    const hoje = startOfDay(new Date());
    const hojeISO = format(hoje, 'yyyy-MM-dd');

    // Filtrar sessões do dia de hoje usando comparação robusta
    const sessoesDeHoje = sessoes.filter(s => {
      if (!s.data_estudo) return false;
      // Normalizar a data da sessão (pode vir com ou sem hora)
      const dataSessaoStr = s.data_estudo.split('T')[0];
      return dataSessaoStr === hojeISO;
    });

    const tempoTotalSegundos = sessoesDeHoje.reduce((acc, s) => acc + (s.tempo_estudado || 0), 0);
    const tempoTotalMinutos = Math.round(tempoTotalSegundos / 60);

    // Debug: remover após verificar
    if (sessoes.length > 0 && tempoTotalMinutos === 0) {
      console.log('Debug meta diária:', {
        totalSessoes: sessoes.length,
        sessoesDeHoje: sessoesDeHoje.length,
        hojeISO,
        primeiraSessaoData: sessoes[0]?.data_estudo,
        tempoTotalSegundos,
        tempoTotalMinutos
      });
    }

    return {
      tempoTotalHoje: tempoTotalMinutos,
      sessoesDeHoje
    };
  }, [sessoes]);

  const { revisoesHoje, revisoesPendentes, revisoesAtrasadas, revisoesAtrasadasCount } = useMemo(() => {
    const hoje = startOfDay(new Date());
    const pendentes = revisoes.filter(r => r.status === 'pendente' && isSameDay(new Date(r.data_prevista), hoje));
    const atrasadas = revisoes.filter(r => {
      const dataPrevista = startOfDay(new Date(r.data_prevista));
      return (r.status === 'pendente' || r.status === 'atrasada') && isBefore(dataPrevista, hoje);
    });

    // Debug logging
    console.log('🔍 Dashboard - Revisões Debug:', {
      totalRevisoes: revisoes.length,
      revisoesData: revisoes.map(r => ({
        id: r.id,
        status: r.status,
        data_prevista: r.data_prevista,
        isPast: isBefore(startOfDay(new Date(r.data_prevista)), hoje)
      })),
      hoje: hoje.toISOString(),
      atrasadasCount: atrasadas.length,
      atrasadasData: atrasadas
    });

    return {
      revisoesHoje: pendentes,
      revisoesPendentes: pendentes.length,
      revisoesAtrasadas: atrasadas,
      revisoesAtrasadasCount: atrasadas.length,
    }
  }, [revisoes]);

  const errosResolvidosHoje = useMemo(() => {
    return erros.filter(e => e.resolvido).length;
  }, [erros]);

  // Estatísticas adicionais
  const estatisticasAdicionais = useMemo(() => {
    const totalMinutos = sessoes.reduce((acc, s) => acc + (s.tempo_estudado / 60), 0);
    const mediaSessao = sessoes.length > 0 ? totalMinutos / sessoes.length : 0;
    const totalTopicosEstudados = new Set(sessoes.map(s => s.topico_id)).size;

    // Tempo ontem
    const ontemISO = getYesterdayLocalDateISO();
    const sessoesOntem = sessoes.filter(s => s.data_estudo === ontemISO);
    const tempoOntem = Math.round(sessoesOntem.reduce((acc, s) => acc + s.tempo_estudado, 0) / 60);

    // Comparação com ontem
    const diferencaTempo = tempoTotalHoje - tempoOntem;
    const percentualVariacao = tempoOntem > 0 ? Math.round((diferencaTempo / tempoOntem) * 100) : 0;

    return {
      totalHoras: formatStudyDuration(totalMinutos),
      mediaSessao: `${Math.round(mediaSessao)} min`,
      totalTopicosEstudados,
      tempoOntem: formatStudyDuration(tempoOntem),
      diferencaTempo,
      percentualVariacao,
    };
  }, [sessoes, tempoTotalHoje]);

  // Próximas revisões
  const proximasRevisoes = useMemo(() => {
    const hoje = startOfDay(new Date());
    return revisoes
      .filter(r => r.status === 'pendente' && new Date(r.data_prevista) >= hoje)
      .sort((a, b) => new Date(a.data_prevista).getTime() - new Date(b.data_prevista).getTime())
      .slice(0, 5)
      .map(r => {
        const topicoInfo = disciplinas
          .flatMap(d => d.topicos.map(t => ({ ...t, disciplinaNome: d.nome })))
          .find(t => t.id === r.topico_id);
        return {
          ...r,
          topicoNome: topicoInfo?.titulo || 'Tópico removido',
          disciplinaNome: topicoInfo?.disciplinaNome || 'Disciplina removida',
        };
      });
  }, [revisoes, disciplinas]);

  // Tópicos mais estudados
  const topicosMaisEstudados = useMemo(() => {
    const tempoPorTopico = sessoes.reduce((acc: Record<string, number>, sessao) => {
      const topicoInfo = disciplinas
        .flatMap(d => d.topicos.map(t => ({ ...t, disciplinaNome: d.nome })))
        .find(t => t.id === sessao.topico_id);

      const topicoKey = topicoInfo ? `${topicoInfo.disciplinaNome} - ${topicoInfo.titulo}` : 'Estudo Livre';
      const tempoMinutos = sessao.tempo_estudado / 60;

      if (!acc[topicoKey]) {
        acc[topicoKey] = 0;
      }
      acc[topicoKey] += tempoMinutos;

      return acc;
    }, {});

    return Object.entries(tempoPorTopico)
      .map(([nome, tempo]) => ({
        nome,
        tempo: Math.round(tempo),
        tempoFormatado: formatStudyDuration(Math.round(tempo)),
      }))
      .sort((a, b) => b.tempo - a.tempo)
      .slice(0, 5);
  }, [sessoes, disciplinas]);

  const {
    tempoSemanaAtual,
    progressoSemanal,
    dadosGraficoSemanal,
    dadosGraficoDisciplinas,
  } = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Monday
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

    // Helper para formatar data como YYYY-MM-DD
    const formatDateString = (date: Date): string => {
      const ano = date.getFullYear();
      const mes = String(date.getMonth() + 1).padStart(2, '0');
      const dia = String(date.getDate()).padStart(2, '0');
      return `${ano}-${mes}-${dia}`;
    };

    const inicioSemanaStr = formatDateString(inicioSemana);
    const fimSemanaStr = formatDateString(fimSemana);

    const sessoesDaSemana = sessoes.filter(s => {
      // Comparar strings diretamente para evitar problemas de timezone
      return s.data_estudo >= inicioSemanaStr && s.data_estudo <= fimSemanaStr;
    });

    const tempoTotalSegundos = sessoesDaSemana.reduce((acc, s) => acc + s.tempo_estudado, 0);
    const tempoTotalSemanaMinutos = Math.round(tempoTotalSegundos / 60);

    const metaSemanal = Math.max(safeWeeklyGoalHours * 60, 1);
    const progressoSemanalPercent = metaSemanal > 0 ? Math.min(100, Math.round((tempoTotalSemanaMinutos / metaSemanal) * 100)) : 0;

    const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
    const dadosGraficoSemanal = diasDaSemana.map(dia => {
      const diaStr = formatDateString(dia);
      const sessoesDoDia = sessoesDaSemana.filter(s => {
        // Comparar strings diretamente
        return s.data_estudo === diaStr;
      });
      const tempoTotalMinutosDia = Math.round(sessoesDoDia.reduce((acc, s) => acc + s.tempo_estudado, 0) / 60);
      return {
        name: format(dia, 'eee'),
        'Tempo (min)': tempoTotalMinutosDia,
      };
    });

    const tempoPorDisciplina = sessoesDaSemana.reduce((acc: Record<string, number>, sessao) => {
      const topicoInfo = disciplinas
        .flatMap(d => d.topicos.map(t => ({ ...t, disciplinaNome: d.nome })))
        .find(t => t.id === sessao.topico_id);

      const nomeDisciplina = topicoInfo?.disciplinaNome || 'Estudo Livre';
      const tempoMinutos = sessao.tempo_estudado / 60;

      if (!acc[nomeDisciplina]) {
        acc[nomeDisciplina] = 0;
      }
      acc[nomeDisciplina] += tempoMinutos;

      return acc;
    }, {} as Record<string, number>);

    const dadosGraficoDisciplinas = Object.entries(tempoPorDisciplina)
      .map(([name, value]) => ({
        name,
        value: Math.round(value),
      }))
      .sort((a, b) => b.value - a.value);

    return {
      tempoSemanaAtual: tempoTotalSemanaMinutos,
      progressoSemanal: progressoSemanalPercent,
      dadosGraficoSemanal,
      dadosGraficoDisciplinas,
    };
  }, [sessoes, disciplinas, safeWeeklyGoalHours]);


  const formattedGoal = formatStudyDuration(safeGoalMinutes);
  // Calcular porcentagem da meta diária: tempo de hoje (em minutos) / meta (em minutos) * 100
  const metaPercentual = useMemo(() => {
    if (safeGoalMinutes <= 0) return 0;
    const percentual = (tempoTotalHoje / safeGoalMinutes) * 100;
    return Math.round(percentual); // Permite valores acima de 100%
  }, [tempoTotalHoje, safeGoalMinutes]);

  useEffect(() => {
    const fetchMotivationalMessage = () => {
      // IA desativada temporariamente - sempre usa frases aleatórias do array
      const randomIndex = Math.floor(Math.random() * mensagensDiarias.length);
      setMotivationalMessage(mensagensDiarias[randomIndex]);
      setIsMessageLoading(false);

      // Código da IA comentado temporariamente:
      // if (!user) {
      //     const fallbackIndex = Math.floor(Math.random() * mensagensDiarias.length);
      //     setMotivationalMessage(mensagensDiarias[fallbackIndex]);
      //     setIsMessageLoading(false);
      //     return;
      // };
      // 
      // setIsMessageLoading(true);
      // try {
      //     const message = await gerarMensagemMotivacionalIA(
      //         user.name.split(' ')[0],
      //         Number(tempoTotalHoje),
      //         Number(metaPercentual),
      //         0,
      //         Number(revisoesPendentes as any)
      //     );
      //     setMotivationalMessage({ frase: message, autor: null });
      // } catch (error) {
      //      console.error("Failed to fetch motivational message", error);
      //      const fallbackIndex = Math.floor(Math.random() * mensagensDiarias.length);
      //      setMotivationalMessage(mensagensDiarias[fallbackIndex]);
      // } finally {
      //     setIsMessageLoading(false);
      // }
    };

    const timeoutId = setTimeout(fetchMotivationalMessage, 100);
    return () => clearTimeout(timeoutId);

  }, [user, tempoTotalHoje, metaPercentual, revisoesPendentes]);



  const recentStudies = useMemo(() => sessoes
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => new Date(b.data_estudo).getTime() - new Date(a.data_estudo).getTime())
    .slice(0, 6)
    .map((study) => {
      const topicoInfo = disciplinas
        .flatMap(d => d.topicos.map(t => ({ ...t, disciplinaNome: d.nome })))
        .find(t => t.id === study.topico_id);
      return {
        id: study.id,
        disciplina: topicoInfo?.titulo || 'Estudo livre',
        disciplinaNome: topicoInfo?.disciplinaNome || null,
        tempo: formatStudyDuration((study.tempo_estudado ?? 0) / 60),
        data: study?.data_estudo,
        status: 'concluído',
      };
    }), [sessoes, disciplinas]);

  const ultimoEstudo = recentStudies[0];
  const podeContinuarEstudo = ultimoEstudo &&
    new Date(ultimoEstudo.data).toDateString() === new Date().toDateString() &&
    ultimoEstudo.status !== 'concluído';

  const metrics = [
    {
      label: 'Tempo de estudo hoje',
      value: formatStudyDuration(tempoTotalHoje),
      icon: Clock3,
      helper: `Meta diária de ${formattedGoal}`,
    },
    {
      label: 'Revisões atrasadas',
      value: revisoesAtrasadasCount,
      icon: Target,
      helper: revisoesAtrasadasCount > 0 ? `${revisoesAtrasadasCount} ${revisoesAtrasadasCount === 1 ? 'revisão atrasada' : 'revisões atrasadas'}` : 'Nenhuma revisão atrasada',
      isOverdue: revisoesAtrasadasCount > 0,
    },
    {
      label: 'Erros resolvidos',
      value: errosResolvidosHoje,
      icon: BookOpenCheckIcon,
      helper: `${erros.length} cadastrados`,
    },
    {
      label: 'Progresso diário',
      value: `${metaPercentual}%`,
      icon: Flame,
      progress: metaPercentual,
    },
  ];

  const goalOptions = [...new Set([...DAILY_GOAL_OPTIONS, safeGoalMinutes])]
    .filter(option => option <= 720) // Limitar a 12h máximo
    .sort((a, b) => a - b);

  const formatWeeklyGoalDuration = (hours: number) => `${hours}h`;
  const weeklyGoalOptions = [...new Set([...WEEKLY_GOAL_OPTIONS, safeWeeklyGoalHours])].sort(
    (a, b) => a - b,
  );

  return (
    <div data-tutorial="dashboard-content" className="space-y-8">
      {/* Seção Principal - Header e Controles */}
      <section className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-background/0 to-background/0 p-6">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkles className="h-4 w-4" />
              Painel inteligente
            </CardDescription>
            <CardTitle className="text-2xl mt-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
              Olá, {user?.name ? user.name.split(' ')[0] : 'bem-vindo de volta'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1.5">
              Centralize seus ciclos, acompanhe revisões e mantenha o ritmo com objetivos claros.
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2.5">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Edital ativo
              </span>
              <div className="flex items-center gap-3">
                <EditalSelector className="flex-1" />
                <Button
                  onClick={openRegisterEditalModal}
                  className="h-10 px-4 flex items-center gap-2 flex-shrink-0 bg-gradient-to-r from-primary to-secondary text-white font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-opacity border-0"
                  aria-label="Criar novo edital"
                  data-tutorial="edital-manage-button"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Novo edital</span>
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3">
              <button
                onClick={abrirModalEstudoManual}
                className="h-11 px-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-violet-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-opacity flex-1 min-w-[160px]"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Adicionar estudo
              </button>
              <Button
                variant='outline'
                onClick={() => setActiveView('planejamento')}
                className="h-11 px-6 flex-1 min-w-[160px]"
              >
                <BookOpenIcon className="h-4 w-4 mr-2" />
                Ver planejamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resumo do Edital Ativo */}
        <Card className="">
          <CardHeader className="p-6 pb-4">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <CalendarClockIcon className="h-4 w-4" />
              Resumo do edital
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-muted/30 p-4">
              {editalAtivo?.nome && (
                <div className="pb-2.5 mb-2 border-b border-white/10">
                  <h3 className="text-sm font-bold text-foreground leading-tight">
                    {editalAtivo.nome}
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">Estudos realizados</span>
                  <span className="text-lg font-bold text-foreground">{sessoes.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">Disciplinas ativas</span>
                  <span className="text-lg font-bold text-foreground">{disciplinas.length}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1">Tempo total hoje</span>
                  <span className="text-lg font-bold text-foreground">
                    {formatStudyDuration(tempoTotalHoje)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    Dias Seguidos
                  </span>
                  <span className="text-lg font-bold text-orange-500">
                    {streak} {streak === 1 ? 'dia' : 'dias'}
                  </span>
                </div>
              </div>

              {/* Progress bar for edital */}
              {editalAtivo?.data_alvo && (() => {
                const hoje = new Date();
                const dataAlvo = new Date(editalAtivo.data_alvo);
                // Usar 6 meses antes da data alvo como data de início estimada
                const dataCriacao = subDays(dataAlvo, 180);

                const diasTotais = Math.max(1, differenceInDays(dataAlvo, dataCriacao));
                const diasDecorridos = Math.max(0, differenceInDays(hoje, dataCriacao));
                const diasRestantes = Math.max(0, differenceInDays(dataAlvo, hoje));
                const progressoPercentual = Math.min(100, Math.round((diasDecorridos / diasTotais) * 100));

                return (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="text-muted-foreground">Progresso até a prova</span>
                      <span className="text-muted-foreground">{diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'} restantes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={progressoPercentual} className="h-2 flex-1" />
                      <span className="font-semibold text-foreground text-sm w-12 text-right">{progressoPercentual}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Metas e Status */}
      <section>
        <Card className="">
          <CardHeader className="p-6">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Target className="h-4 w-4" />
              Metas e Status
            </CardDescription>
            <CardTitle className="text-xl mt-1">Acompanhamento de Progresso</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Meta diária</span>
                      <select
                        value={safeGoalMinutes}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setGoalMinutes(Number(event.target.value))}
                        aria-label="Definir meta diaria"
                        className="rounded-md border border-border bg-input px-2 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {goalOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatStudyDuration(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={metaPercentual} className="h-2 flex-1" />
                    <span className="font-semibold text-foreground text-sm w-12 text-right">{metaPercentual}%</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Meta semanal</span>
                      <span className="rounded-md border border-border bg-input px-2 py-1 text-xs font-semibold text-foreground">
                        {safeWeeklyGoalHours}h
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={progressoSemanal} className="h-2 flex-1" />
                    <span className="font-semibold text-foreground text-sm w-12 text-right">{progressoSemanal}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-lg border border-border bg-background/30 p-4 flex flex-col items-center justify-center">
                  <div className="flex items-center justify-center gap-1.5 mb-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <p className="text-2xl font-bold text-orange-500">{streak}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">Dias Seguidos</p>
                </div>
                <div className="rounded-lg border border-border bg-background/30 p-4 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-primary mb-2">{revisoesPendentes}</p>
                  <p className="text-xs text-muted-foreground font-medium">Revisões</p>
                </div>
                <div className="rounded-lg border border-border bg-background/30 p-4 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-primary mb-2">{errosResolvidosHoje}</p>
                  <p className="text-xs text-muted-foreground font-medium">Erros resolvidos</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="p-5 text-center min-h-[90px] flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10 opacity-50 group-hover:opacity-100 transition-opacity" />
          {isMessageLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-muted/50 rounded-full w-3/4 mx-auto"></div>
              <div className="h-4 bg-muted/50 rounded-full w-1/2 mx-auto"></div>
            </div>
          ) : (
            <>
              <p className="text-lg italic text-foreground/90 flex items-center justify-center gap-2">
                {motivationalMessage.autor === null && <Sparkles className="w-5 h-5 text-primary flex-shrink-0" />}
                <span>“{motivationalMessage.frase}”</span>
              </p>
              {motivationalMessage.autor && (
                <p className="text-sm text-primary mt-2">— {motivationalMessage.autor}</p>
              )}
            </>
          )}
        </Card>
      </section>

      <AcoesRecomendadas setActiveView={setActiveView} />

      {/* Seção de Métricas Adicionais */}
      <section className="space-y-4">
        <SectionHeader
          title="Estatísticas Gerais"
          description="Visão geral do seu desempenho e progresso nos estudos."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="">
            <CardContent className="p-6 min-h-[110px] flex items-center">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tempo Total</p>
                  <p className="text-3xl font-bold text-foreground">{estatisticasAdicionais.totalHoras}</p>
                </div>
                <Clock3 className="h-10 w-10 text-primary opacity-50" />
              </div >
            </CardContent >
          </Card >
          <Card className="">
            <CardContent className="p-6 min-h-[110px] flex items-center">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Média por Sessão</p>
                  <p className="text-3xl font-bold text-foreground">{estatisticasAdicionais.mediaSessao}</p>
                </div>
                <BarChart3 className="h-10 w-10 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="p-6 min-h-[110px] flex items-center">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tópicos Estudados</p>
                  <p className="text-3xl font-bold text-foreground">{estatisticasAdicionais.totalTopicosEstudados}</p>
                </div>
                <BookOpenIcon className="h-10 w-10 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="">
            <CardContent className="p-6 min-h-[110px] flex items-center">
              <div className="flex items-center justify-between w-full">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Tempo Ontem</p>
                  <p className="text-3xl font-bold text-foreground">{estatisticasAdicionais.tempoOntem}</p>
                  {estatisticasAdicionais.diferencaTempo !== 0 && (
                    <p className={`text-xs mt-1.5 ${estatisticasAdicionais.diferencaTempo > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {estatisticasAdicionais.diferencaTempo > 0 ? '+' : ''}{estatisticasAdicionais.percentualVariacao}%
                    </p>
                  )}
                </div>
                <ActivityIcon className="h-10 w-10 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div >
      </section >

      <section className="space-y-4">
        <SectionHeader
          title="Análise Semanal"
          description="Visualize seu desempenho e distribuição de estudos ao longo da semana."
        />
        <div className="grid gap-8 lg:grid-cols-2">
          <PremiumFeatureWrapper
            isLocked={isPremiumFeature}
            requiredPlan="pro"
            feature="Gráfico de Desempenho Diário"
            blurAmount="md"
          >
            <Card className="">
              <CardHeader>
                <CardTitle>Desempenho Diário</CardTitle>
                <CardDescription className="text-sm">Minutos estudados na semana atual (segunda a domingo).</CardDescription>
              </CardHeader>
              <CardContent>
                <WeeklyStudyChart data={dadosGraficoSemanal} />
              </CardContent>
            </Card>
          </PremiumFeatureWrapper>

          <PremiumFeatureWrapper
            isLocked={isPremiumFeature}
            requiredPlan="pro"
            feature="Gráfico de Foco por Disciplina"
            blurAmount="md"
          >
            <Card className="">
              <CardHeader>
                <CardTitle>Foco por Disciplina</CardTitle>
                <CardDescription className="text-sm">Distribuição do tempo de estudo por matéria.</CardDescription>
              </CardHeader>
              <CardContent>
                {dadosGraficoDisciplinas.length > 0 ? (
                  <DisciplineFocusChart data={dadosGraficoDisciplinas} />
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-center text-muted-foreground text-sm">
                    Nenhum estudo registrado esta semana para exibir o foco.
                  </div>
                )}
              </CardContent>
            </Card>
          </PremiumFeatureWrapper>
        </div>
      </section>

      {/* Seção de Tópicos Mais Estudados e Estudos Recentes */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Mais Estudados - Premium List Design */}
        <Card className="h-full border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">Mais Estudados</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setActiveView('estatisticas')}
              >
                Ver todos
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {topicosMaisEstudados.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4 ring-4 ring-muted/20">
                  <BookOpenIcon className="h-5 w-5 text-muted-foreground/60" />
                </div>
                <p className="text-sm font-medium text-foreground">Nenhum dado registrado</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Comece a estudar para ver seus tópicos principais aqui.</p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {topicosMaisEstudados.map((topico, index) => (
                  <div
                    key={index}
                    className="group flex items-center gap-4 px-4 py-3 rounded-lg hover:bg-muted/40 transition-all duration-200"
                  >
                    {/* Rank Indicator */}
                    <div className={`
                      flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold border
                      ${index === 0 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                        index === 1 ? 'bg-slate-300/10 text-slate-500 border-slate-300/20' :
                          index === 2 ? 'bg-orange-700/10 text-orange-600 border-orange-600/20' :
                            'bg-muted text-muted-foreground border-transparent'}
                    `}>
                      {index + 1}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium text-foreground truncate pr-4">
                          {topico.nome}
                        </p>
                        <span className="text-xs font-mono font-medium text-muted-foreground/80 whitespace-nowrap">
                          {topico.tempoFormatado}
                        </span>
                      </div>


                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estudos Recentes - Premium Timeline Design */}
        <Card className="h-full border border-border/60 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-secondary/10 text-secondary-foreground">
                  <ActivityIcon className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-semibold tracking-tight text-foreground">Atividade Recente</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setActiveView('historico')}
              >
                Ver histórico
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {recentStudies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-4 ring-4 ring-muted/20">
                  <Play className="h-5 w-5 text-muted-foreground/60 ml-0.5" />
                </div>
                <p className="text-sm font-medium text-foreground">Sem atividade recente</p>
                <p className="text-xs text-muted-foreground mt-1">Suas sessões de estudo aparecerão aqui.</p>
              </div>
            ) : (
              <div className="relative p-2">

                <div className="space-y-1">
                  {recentStudies.map((study, index) => {
                    const isToday = new Date(study.data).toDateString() === new Date().toDateString();

                    return (
                      <div
                        key={study.id}
                        className="group relative flex items-start gap-4 px-4 py-3 rounded-lg hover:bg-muted/40 transition-colors"
                      >
                        {/* Simple Dot Indicator */}
                        <div className={`
                          mt-2 h-2 w-2 rounded-full shrink-0 transition-colors
                          ${isToday ? 'bg-primary' : 'bg-muted-foreground/30'}
                        `} />

                        <div className="flex-1 min-w-0 grid gap-1">
                          <div className="flex items-center gap-2">
                            {study.disciplinaNome && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                {study.disciplinaNome}
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {study.data ? new Date(study.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>

                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {study.disciplina}
                          </p>
                        </div>

                        <div className="text-right flex flex-col items-end justify-center min-h-[40px]">
                          <span className="font-mono text-xs font-medium text-foreground whitespace-nowrap">
                            {study.tempo}
                          </span>
                          {/* Status as a small dot or refined badge */}
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`h-1.5 w-1.5 rounded-full ${study.status === 'concluído' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span className="text-[10px] text-muted-foreground capitalize">
                              {study.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div >
  )
}

export default Dashboard;
