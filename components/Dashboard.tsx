
import React, { useEffect, useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { startOfWeek, endOfWeek, isWithinInterval, eachDayOfInterval, format, isSameDay, startOfDay } from 'date-fns';
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
import { MiniGamificationCard } from './MiniGamificationCard';
import AcoesRecomendadas from './AcoesRecomendadas';
import { mensagensDiarias } from '../data/motivacoes';
import { useGamificationStore } from '../stores/useGamificationStore';
import { gerarMensagemMotivacionalIA } from '../services/geminiService';

// --- Chart Components ---

const WeeklyStudyChart: React.FC<{ data: { name: string; 'Tempo (min)': number }[] }> = ({ data }) => {
    return (
        <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                <Tooltip
                    cursor={{ fill: 'rgba(var(--color-primary-rgb), 0.1)' }}
                    contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--color-foreground)'
                    }}
                />
                <Bar dataKey="Tempo (min)" fill="url(#colorUv)" radius={[4, 4, 0, 0]} />
                 <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.8}/>
                    </linearGradient>
                </defs>
            </BarChart>
        </ResponsiveContainer>
    );
};

const DisciplineFocusChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
    const COLORS = ['#10b981', '#8b5cf6', '#f59e0b', '#0ea5e9', '#ec4899', '#3b82f6', '#ef4444'];
    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={90}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={5}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                     contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.7)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '0.75rem',
                        fontSize: '0.875rem',
                        color: 'var(--color-foreground)'
                    }}
                    formatter={(value) => `${value} min`}
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '0.875rem', color: 'var(--color-muted-foreground)'}}/>
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

const DAILY_GOAL_OPTIONS = [60, 90, 120, 150, 180, 210, 240, 300, 360]
const WEEKLY_GOAL_OPTIONS = [5, 10, 15, 20, 25, 30, 35, 40];

interface DashboardProps {
  setActiveView: (view: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveView }) => {
  const user = useAuthStore((state) => state.user);
  const editalAtivo = useEditalStore((state) => state.editalAtivo);
  const abrirModalEstudoManual = useEstudosStore((state) => state.abrirModalEstudoManual);
  const openEditalModal = useModalStore((state) => state.openEditalModal);
  
  const { goalMinutes, weeklyGoalHours, setGoalMinutes, setWeeklyGoalHours } = useDailyGoalStore();
  const gamificationStats = useGamificationStore((state) => state.stats);

  const [motivationalMessage, setMotivationalMessage] = useState<{ frase: string; autor: string | null }>({ frase: '', autor: null });
  const [isMessageLoading, setIsMessageLoading] = useState(true);

  const safeGoalMinutes = useMemo(() => (typeof goalMinutes === 'number' ? goalMinutes : 0), [goalMinutes]);
  const safeWeeklyGoalHours = useMemo(() => (typeof weeklyGoalHours === 'number' ? weeklyGoalHours : 20), [weeklyGoalHours]);

  // Edital-aware data from stores
  const sessoes = useEstudosStore((state) => state.sessoes);
  const disciplinas = useDisciplinasStore((state) => state.disciplinas);
  const revisoes = useRevisoesStore((state) => state.revisoes);
  const erros = useCadernoErrosStore((state) => state.erros);
  
  // Real-time calculations based on active edital data
  const { tempoTotalHoje, sessoesDeHoje } = useMemo(() => {
    const hojeISO = new Date().toISOString().split('T')[0];
    const sessoesDeHoje = sessoes.filter(s => s.data_estudo === hojeISO);
    const tempoTotalSegundos = sessoesDeHoje.reduce((acc, s) => acc + s.tempo_estudado, 0);
    return {
      tempoTotalHoje: Math.round(tempoTotalSegundos / 60), // in minutes
      sessoesDeHoje
    };
  }, [sessoes]);

  const { revisoesHoje, revisoesPendentes } = useMemo(() => {
    const hoje = startOfDay(new Date());
    const pendentes = revisoes.filter(r => r.status === 'pendente' && isSameDay(new Date(r.data_prevista), hoje));
    return {
      revisoesHoje: pendentes,
      revisoesPendentes: pendentes.length,
    }
  }, [revisoes]);
  
  const errosResolvidosHoje = useMemo(() => {
    return erros.filter(e => e.resolvido).length;
  }, [erros]);

  const {
      tempoSemanaAtual,
      progressoSemanal,
      dadosGraficoSemanal,
      dadosGraficoDisciplinas,
  } = useMemo(() => {
      const hoje = new Date();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 }); // Monday
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });

      const sessoesDaSemana = sessoes.filter(s => {
          const dataEstudo = new Date(s.data_estudo); // Uses local timezone
          return isWithinInterval(dataEstudo, { start: inicioSemana, end: fimSemana });
      });

      const tempoTotalSegundos = sessoesDaSemana.reduce((acc, s) => acc + s.tempo_estudado, 0);
      const tempoTotalSemanaMinutos = Math.round(tempoTotalSegundos / 60);
      
      const metaSemanal = Math.max(safeWeeklyGoalHours * 60, 1);
      const progressoSemanalPercent = metaSemanal > 0 ? Math.min(100, Math.round((tempoTotalSemanaMinutos / metaSemanal) * 100)) : 0;

      const diasDaSemana = eachDayOfInterval({ start: inicioSemana, end: fimSemana });
      const dadosGraficoSemanal = diasDaSemana.map(dia => {
          const sessoesDoDia = sessoesDaSemana.filter(s => {
              const dataEstudo = new Date(s.data_estudo);
              return isSameDay(dataEstudo, dia);
          });
          const tempoTotalMinutosDia = Math.round(sessoesDoDia.reduce((acc, s) => acc + s.tempo_estudado, 0) / 60);
          return {
              name: format(dia, 'eee'),
              'Tempo (min)': tempoTotalMinutosDia,
          };
      });

      const tempoPorDisciplina = sessoesDaSemana.reduce((acc: Record<string, number>, sessao) => {
          const topicoInfo = disciplinas
              .flatMap(d => d.topicos.map(t => ({...t, disciplinaNome: d.nome})))
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
  const metaPercentual = safeGoalMinutes > 0 ? Math.min(100, Math.round((tempoTotalHoje / safeGoalMinutes) * 100)) : 0;

  useEffect(() => {
    const fetchMotivationalMessage = async () => {
        if (!user || gamificationStats === null) {
            const fallbackIndex = Math.floor(Math.random() * mensagensDiarias.length);
            setMotivationalMessage(mensagensDiarias[fallbackIndex]);
            setIsMessageLoading(false);
            return;
        };
        
        setIsMessageLoading(true);
        try {
            // FIX: Explicitly convert potentially 'unknown' or 'any' types to 'number' to satisfy the function signature.
            // This prevents a TypeScript error where an argument is not assignable to the 'number' parameter.
            const message = await gerarMensagemMotivacionalIA(
                user.name.split(' ')[0],
                Number(tempoTotalHoje),
                Number(metaPercentual),
                Number(gamificationStats.current_streak_days || 0),
                Number(revisoesPendentes as any)
            );
            setMotivationalMessage({ frase: message, autor: null });
        } catch (error) {
             console.error("Failed to fetch motivational message", error);
             const fallbackIndex = Math.floor(Math.random() * mensagensDiarias.length);
             setMotivationalMessage(mensagensDiarias[fallbackIndex]);
        } finally {
            setIsMessageLoading(false);
        }
    };
    
    const timeoutId = setTimeout(fetchMotivationalMessage, 100);
    return () => clearTimeout(timeoutId);

  }, [user, gamificationStats, tempoTotalHoje, metaPercentual, revisoesPendentes]);
  
  const recentStudies = useMemo(() => sessoes
    .slice() // Create a copy to avoid mutating the original array
    .sort((a, b) => new Date(b.data_estudo).getTime() - new Date(a.data_estudo).getTime())
    .slice(0, 6)
    .map((study) => {
        const topicoInfo = disciplinas
            .flatMap(d => d.topicos.map(t => ({...t, disciplinaNome: d.nome})))
            .find(t => t.id === study.topico_id);
        return {
            id: study.id,
            disciplina: topicoInfo?.titulo || 'Estudo livre',
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
      label: 'Revisões pendentes',
      value: revisoesPendentes,
      icon: Target,
      helper: `${revisoesPendentes} revisões para hoje`,
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
  
  const goalOptions = [...new Set([...DAILY_GOAL_OPTIONS, safeGoalMinutes])].sort(
    (a, b) => a - b,
  );

  const formatWeeklyGoalDuration = (hours: number) => `${hours}h`;
  const weeklyGoalOptions = [...new Set([...WEEKLY_GOAL_OPTIONS, safeWeeklyGoalHours])].sort(
    (a, b) => a - b,
  );

  return (
    <div data-tutorial="dashboard-content" className="space-y-12">
      <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <Card className="glass-card overflow-hidden shadow-2xl shadow-black/20">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-background/0 to-background/0 p-8">
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkles className="h-4 w-4" />
              Painel inteligente
            </CardDescription>
            <CardTitle className="text-3xl mt-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground">
              Olá, {user?.name ? user.name.split(' ')[0] : 'bem-vindo de volta'}
            </CardTitle>
            <p className="text-base text-muted-foreground mt-2">
              Centralize seus ciclos, acompanhe revisões e mantenha o ritmo com objetivos claros.
            </p>
          </CardHeader>
          <CardContent className="grid gap-6 px-8 pb-8 pt-6 lg:grid-cols-[2fr_1fr] lg:items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                  Edital ativo
                </span>
                <div className="flex items-center gap-2">
                    <EditalSelector className="max-w-md flex-1" />
                    <Button variant="outline" onClick={openEditalModal} className="w-10 h-10 p-0 flex-shrink-0" aria-label="Gerenciar editais" data-tutorial="edital-manage-button">
                        <EditIcon className="h-4 w-4" />
                    </Button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                 <button onClick={abrirModalEstudoManual} className="h-10 px-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-emerald-400 to-violet-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/30 hover:opacity-90 transition-opacity">
                  Adicionar estudo &rarr;
                </button>
                <Button variant='outline' onClick={() => setActiveView('planejamento')}>
                  Ver planejamento
                </Button>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-white/10 bg-muted/30 p-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Edital ativo</span>
                <span className="font-medium text-foreground">{editalAtivo?.nome || 'Nenhum'}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Estudos realizados</span>
                <span className="font-medium text-foreground">{sessoes.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Disciplinas ativas</span>
                <span className="font-medium text-foreground">{disciplinas.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Tempo total hoje</span>
                <span className="font-medium text-foreground">
                  {formatStudyDuration(tempoTotalHoje)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-8">
            <MiniGamificationCard setActiveView={setActiveView} />
            <Card className="glass-card">
              <CardHeader>
                <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  <CalendarClockIcon className="h-4 w-4" />
                  Resumo rápido
                </CardDescription>
                <CardTitle className="text-2xl mt-1">Metas e Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Meta diária</span>
                      <select
                        value={safeGoalMinutes}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setGoalMinutes(Number(event.target.value))}
                        aria-label="Definir meta diaria"
                        className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {goalOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatStudyDuration(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="font-medium text-foreground">{metaPercentual}%</span>
                  </div>
                  <Progress value={metaPercentual} />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Meta semanal</span>
                      <select
                        value={safeWeeklyGoalHours}
                        onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setWeeklyGoalHours(Number(event.target.value))}
                        aria-label="Definir meta semanal"
                        className="rounded-md border border-border bg-background/50 px-2 py-1 text-xs font-semibold text-foreground shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {weeklyGoalOptions.map((option) => (
                          <option key={option} value={option}>
                            {formatWeeklyGoalDuration(option)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <span className="font-medium text-foreground">{progressoSemanal}%</span>
                  </div>
                  <Progress value={progressoSemanal} />
                </div>

                <div className="grid grid-cols-2 gap-4 text-center pt-2">
                  <div className="rounded-lg border border-border bg-background/30 p-3">
                    <p className="text-2xl font-bold text-primary">{revisoesPendentes}</p>
                    <p className="text-xs text-muted-foreground">Revisões</p>
                  </div>
                  <div className="rounded-lg border border-border bg-background/30 p-3">
                    <p className="text-2xl font-bold text-primary">{errosResolvidosHoje}</p>
                    <p className="text-xs text-muted-foreground">Erros resolvidos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
        </div>
      </section>

      <section>
        <Card className="p-6 text-center bg-gradient-to-r from-primary/10 via-background/0 to-secondary/10 rounded-2xl shadow-lg border-purple-500/20 min-h-[100px] flex flex-col justify-center">
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

      <section className="space-y-4">
          <SectionHeader
              title="Análise Semanal"
              description="Visualize seu desempenho e distribuição de estudos ao longo da semana."
          />
          <div className="grid gap-8 lg:grid-cols-2">
              <Card className="glass-card">
                  <CardHeader>
                      <CardTitle>Desempenho Diário</CardTitle>
                      <CardDescription className="text-sm">Minutos estudados nos últimos 7 dias.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <WeeklyStudyChart data={dadosGraficoSemanal} />
                  </CardContent>
              </Card>
              <Card className="glass-card">
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
          </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <Card className="glass-card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Sparkles className="h-4 w-4" />
              Estudos recentes
            </CardDescription>
            <CardTitle className="text-2xl mt-1">Seus últimos movimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentStudies.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                Nenhum estudo registrado ainda. Comece registrando sua próxima sessão!
              </div>
            ) : (
              recentStudies.map((study) => (
                <div
                  key={study.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/30 p-4 transition-all duration-300 hover:border-primary/50 hover:bg-primary/10"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{study.disciplina}</p>
                    <p className="text-xs text-muted-foreground">
                      {study.data ? new Date(study.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Data não disponível'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">{study.tempo}</p>
                    <p className="text-xs text-muted-foreground capitalize">{study.status}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              <Target className="h-4 w-4" />
              Disciplinas ativas
            </CardDescription>
            <CardTitle className="text-2xl mt-1">Foco do edital</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {disciplinas.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                Nenhuma disciplina cadastrada para este edital.
              </div>
            ) : (
              disciplinas.slice(0, 5).map((disciplina) => (
                <div
                  key={disciplina.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-background/30 p-3"
                >
                  <p className="font-medium text-foreground">{disciplina.nome}</p>
                  <span className="text-xs text-muted-foreground">
                    {disciplina.topicos?.length || 0} tópicos
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

export default Dashboard;
