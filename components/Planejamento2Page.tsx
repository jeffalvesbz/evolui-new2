import React, { useMemo } from 'react';
import {
  SparklesIcon,
  TargetIcon,
  CalendarDaysIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  FlameIcon,
  ClipboardListIcon,
} from './icons';
import { usePlanejamento } from '../stores/usePlanejamento';

interface DailyTask {
  id: string;
  title: string;
  durationHours: number;
  category: string;
  status: 'completed' | 'in-progress' | 'pending';
  highlight?: string;
}

interface WeeklyDayPlan {
  id: string;
  dayLabel: string;
  dateLabel: string;
  focusArea: string;
  status: 'on-track' | 'catch-up' | 'rest';
  tasks: DailyTask[];
  reflection?: string;
}

const weeklyPlan: WeeklyDayPlan[] = [
  {
    id: 'monday',
    dayLabel: 'Segunda-feira',
    dateLabel: '27 de Maio',
    focusArea: 'Direito Constitucional',
    status: 'on-track',
    reflection: 'Ênfase na revisão de controle de constitucionalidade e jurisprudência recente.',
    tasks: [
      {
        id: 'monday-1',
        title: 'Revisar jurisprudência sobre controle concentrado',
        durationHours: 1.5,
        category: 'Revisão guiada',
        status: 'completed',
        highlight: 'Utilizar mapas mentais',
      },
      {
        id: 'monday-2',
        title: 'Questões CESPE 2022-2024 (30 itens)',
        durationHours: 1,
        category: 'Resolução de questões',
        status: 'in-progress',
      },
      {
        id: 'monday-3',
        title: 'Flashcards sobre princípios fundamentais',
        durationHours: 0.75,
        category: 'Memorização ativa',
        status: 'pending',
      },
    ],
  },
  {
    id: 'tuesday',
    dayLabel: 'Terça-feira',
    dateLabel: '28 de Maio',
    focusArea: 'Direito Administrativo',
    status: 'catch-up',
    reflection: 'Recuperar tópicos pendentes de atos administrativos antes de avançar.',
    tasks: [
      {
        id: 'tuesday-1',
        title: 'Resumo estruturado de atos administrativos',
        durationHours: 1.25,
        category: 'Teoria aplicada',
        status: 'completed',
      },
      {
        id: 'tuesday-2',
        title: 'Questões inéditas comentadas (20 itens)',
        durationHours: 1,
        category: 'Questões comentadas',
        status: 'pending',
      },
      {
        id: 'tuesday-3',
        title: 'Checklist de erros recorrentes',
        durationHours: 0.5,
        category: 'Análise de erros',
        status: 'pending',
      },
    ],
  },
  {
    id: 'wednesday',
    dayLabel: 'Quarta-feira',
    dateLabel: '29 de Maio',
    focusArea: 'Raciocínio Lógico',
    status: 'on-track',
    reflection: 'Blocos curtos com alta intensidade para manutenção do ritmo.',
    tasks: [
      {
        id: 'wednesday-1',
        title: 'Lista evolutiva de lógica proposicional',
        durationHours: 1,
        category: 'Resolução guiada',
        status: 'completed',
      },
      {
        id: 'wednesday-2',
        title: 'Simulado rápido (15 questões)',
        durationHours: 0.75,
        category: 'Simulado',
        status: 'in-progress',
      },
      {
        id: 'wednesday-3',
        title: 'Flashcards de conectivos',
        durationHours: 0.5,
        category: 'Memorização ativa',
        status: 'completed',
      },
    ],
  },
  {
    id: 'thursday',
    dayLabel: 'Quinta-feira',
    dateLabel: '30 de Maio',
    focusArea: 'Direito Tributário',
    status: 'on-track',
    reflection: 'Consolidação de impostos federais e resolução de questões discursivas curtas.',
    tasks: [
      {
        id: 'thursday-1',
        title: 'Mapa mental de impostos federais',
        durationHours: 1,
        category: 'Organização do estudo',
        status: 'completed',
      },
      {
        id: 'thursday-2',
        title: 'Questões discursivas (3 casos)',
        durationHours: 1.25,
        category: 'Produção textual',
        status: 'in-progress',
      },
      {
        id: 'thursday-3',
        title: 'Checklist de jurisprudência do STF/STJ',
        durationHours: 0.5,
        category: 'Atualização',
        status: 'pending',
      },
    ],
  },
  {
    id: 'friday',
    dayLabel: 'Sexta-feira',
    dateLabel: '31 de Maio',
    focusArea: 'Informática',
    status: 'on-track',
    reflection: 'Priorizar segurança da informação com foco em questões Cebraspe.',
    tasks: [
      {
        id: 'friday-1',
        title: 'Resumo visual de segurança da informação',
        durationHours: 0.75,
        category: 'Resumo inteligente',
        status: 'in-progress',
      },
      {
        id: 'friday-2',
        title: 'Questões comentadas (25 itens)',
        durationHours: 1,
        category: 'Questões',
        status: 'pending',
      },
      {
        id: 'friday-3',
        title: 'Simulado flash de atalhos e Excel',
        durationHours: 0.5,
        category: 'Simulado',
        status: 'pending',
      },
    ],
  },
  {
    id: 'saturday',
    dayLabel: 'Sábado',
    dateLabel: '1º de Junho',
    focusArea: 'Revisão geral',
    status: 'on-track',
    reflection: 'Bloco de revisão espaçada com ênfase nos temas com menor fixação.',
    tasks: [
      {
        id: 'saturday-1',
        title: 'Revisão 24h dos tópicos da semana',
        durationHours: 1,
        category: 'Revisão espaçada',
        status: 'completed',
      },
      {
        id: 'saturday-2',
        title: 'Questões adaptativas Evolui (20 itens)',
        durationHours: 1,
        category: 'Questões adaptativas',
        status: 'completed',
      },
      {
        id: 'saturday-3',
        title: 'Checklist de indicadores de performance',
        durationHours: 0.5,
        category: 'Análise de desempenho',
        status: 'in-progress',
      },
    ],
  },
  {
    id: 'sunday',
    dayLabel: 'Domingo',
    dateLabel: '2 de Junho',
    focusArea: 'Recuperação ativa',
    status: 'rest',
    reflection: 'Atividades leves para manter o ritmo sem comprometer a recuperação.',
    tasks: [
      {
        id: 'sunday-1',
        title: 'Revisão leve de pontos críticos (30 min)',
        durationHours: 0.5,
        category: 'Revisão leve',
        status: 'pending',
      },
      {
        id: 'sunday-2',
        title: 'Checklist de planejamento para a próxima semana',
        durationHours: 0.75,
        category: 'Planejamento',
        status: 'pending',
      },
      {
        id: 'sunday-3',
        title: 'Descanso ativo e alongamento',
        durationHours: 0.5,
        category: 'Bem-estar',
        status: 'pending',
      },
    ],
  },
];

const statusChipStyles: Record<WeeklyDayPlan['status'], { label: string; className: string }> = {
  'on-track': {
    label: 'No ritmo',
    className: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  'catch-up': {
    label: 'Reforçar',
    className: 'bg-amber-500/15 text-amber-400 border border-amber-500/40',
  },
  'rest': {
    label: 'Recuperação',
    className: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  },
};

const taskStatusStyles: Record<DailyTask['status'], { label: string; className: string; icon: React.ReactNode }> = {
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
    icon: <CheckCircle2Icon className="w-4 h-4" />,
  },
  'in-progress': {
    label: 'Em andamento',
    className: 'bg-primary/10 text-primary border border-primary/30',
    icon: <FlameIcon className="w-4 h-4" />,
  },
  pending: {
    label: 'Pendente',
    className: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
    icon: <AlertCircleIcon className="w-4 h-4" />,
  },
};

const Planejamento2Page: React.FC = () => {
  const { planningConfig } = usePlanejamento();

  const summary = useMemo(() => {
    const totals = weeklyPlan.reduce(
      (acc, day) => {
        day.tasks.forEach((task) => {
          acc.totalTasks += 1;
          acc.totalHours += task.durationHours;
          if (task.status === 'completed') {
            acc.completedTasks += 1;
            acc.completedHours += task.durationHours;
          }
        });
        return acc;
      },
      { totalTasks: 0, completedTasks: 0, totalHours: 0, completedHours: 0 }
    );

    const progress = totals.totalTasks > 0 ? Math.round((totals.completedTasks / totals.totalTasks) * 100) : 0;
    const focusAreas = weeklyPlan.map((day) => day.focusArea);
    const uniqueFocusAreas = Array.from(new Set(focusAreas));

    const weights = planningConfig?.planConfig?.weights ?? {};
    const weightEntries = Object.entries(weights)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))
      .slice(0, 3);

    return {
      progress,
      totals,
      focusAreas: uniqueFocusAreas,
      topWeights: weightEntries,
    };
  }, [planningConfig]);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-background via-background to-background/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-32 space-y-8">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <ClipboardListIcon className="h-3.5 w-3.5" />
            Planejamento inteligente
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Planner semanal evolutivo</h1>
              <p className="text-muted-foreground">
                Acompanhe o ritmo da semana, ajuste prioridades rapidamente e mantenha o foco no que gera mais impacto.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary">
              <SparklesIcon className="h-4 w-4" />
              Semana 21 • Alta intensidade
            </div>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg shadow-primary/5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso da semana</p>
                  <h2 className="mt-1 text-3xl font-bold text-foreground">{summary.progress}%</h2>
                </div>
                <div className="rounded-full bg-primary/10 p-3 text-primary">
                  <TargetIcon className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${summary.progress}%` }}
                />
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Atividades concluídas</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{summary.totals.completedTasks}</p>
                  <span className="text-xs text-muted-foreground">de {summary.totals.totalTasks} planejadas</span>
                </div>
                <div className="rounded-xl border border-white/10 bg-background/60 p-4">
                  <p className="text-xs font-semibold text-muted-foreground">Horas focadas</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{summary.totals.completedHours.toFixed(1)}h</p>
                  <span className="text-xs text-muted-foreground">de {summary.totals.totalHours.toFixed(1)}h previstas</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <CalendarDaysIcon className="h-4 w-4" />
                  Foco da semana
                </div>
                <div className="flex flex-wrap gap-2">
                  {summary.focusAreas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full border border-white/10 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg shadow-primary/5">
              <p className="text-sm font-semibold text-muted-foreground">Prioridades do edital</p>
              <div className="mt-4 space-y-3">
                {summary.topWeights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Configure o planejamento no edital para personalizar as prioridades.
                  </p>
                ) : (
                  summary.topWeights.map(([disciplina, peso]) => (
                    <div key={disciplina} className="flex items-center justify-between rounded-xl border border-white/10 bg-background/60 px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{disciplina}</p>
                        <span className="text-xs text-muted-foreground">Peso estratégico: {peso}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <FlameIcon className="h-4 w-4" />
                        Prioridade
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg shadow-primary/5">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <ClockIcon className="h-4 w-4" />
                Ritmo diário recomendado
              </div>
              <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3 rounded-xl border border-white/5 bg-background/60 p-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
                  2 blocos de foco profundo (70-90 min) + 1 bloco de revisão ativa (40 min)
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-white/5 bg-background/60 p-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-secondary" />
                  Revisar indicadores ao final do dia e ajustar prioridades da manhã seguinte
                </li>
                <li className="flex items-start gap-3 rounded-xl border border-white/5 bg-background/60 p-3">
                  <span className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                  Check-in rápido com questões de alta aderência ao edital vigente
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            {weeklyPlan.map((day) => {
              const completed = day.tasks.filter((task) => task.status === 'completed').length;
              const progress = day.tasks.length > 0 ? Math.round((completed / day.tasks.length) * 100) : 0;
              const dayStatus = statusChipStyles[day.status];

              return (
                <article
                  key={day.id}
                  className="rounded-2xl border border-white/10 bg-card/70 p-6 shadow-lg shadow-primary/5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">{day.dayLabel}</span>
                        <span>{day.dateLabel}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${dayStatus.className}`}>
                          {dayStatus.label}
                        </span>
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-foreground">Foco: {day.focusArea}</h3>
                      {day.reflection && (
                        <p className="mt-2 text-sm text-muted-foreground">{day.reflection}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-2 rounded-xl border border-white/10 bg-background/60 px-4 py-3 text-xs">
                      <span className="font-semibold text-muted-foreground">Progresso diário</span>
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="font-medium text-foreground">{completed}/{day.tasks.length} concluídas</span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {day.tasks.map((task) => {
                      const taskStatus = taskStatusStyles[task.status];
                      return (
                        <div
                          key={task.id}
                          className="rounded-xl border border-white/10 bg-background/60 p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span className="inline-flex items-center rounded-full border border-white/10 bg-card/80 px-2.5 py-0.5 font-medium">
                                  {task.category}
                                </span>
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${taskStatus.className}`}>
                                  {taskStatus.icon}
                                  {taskStatus.label}
                                </span>
                              </div>
                              <p className="mt-2 text-base font-semibold text-foreground">{task.title}</p>
                              {task.highlight && (
                                <p className="mt-1 text-sm text-primary">{task.highlight}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-card/60 px-3 py-2 text-xs text-muted-foreground">
                              <ClockIcon className="h-4 w-4 text-primary" />
                              {task.durationHours.toFixed(1)}h
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center bg-gradient-to-t from-background via-background/95 to-transparent pb-10 pt-16">
        <button
          type="button"
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary via-primary to-secondary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:shadow-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <SparklesIcon className="h-5 w-5" />
          Gerar Plano de Estudos
        </button>
      </div>
    </div>
  );
};

export default Planejamento2Page;
