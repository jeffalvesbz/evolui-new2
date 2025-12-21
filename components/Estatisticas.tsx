import React, { useMemo } from 'react';
import {
    BarChart3Icon,
    TrendingUpIcon,
    BookOpenCheckIcon,
    ClockIcon,
    TrophyIcon,
    FlameIcon,
    LayersIcon,
    BookCopyIcon,
    FileTextIcon,
    CheckCircle2Icon,
    TargetIcon,
    CalendarDaysIcon,
    AlertTriangleIcon,
} from './icons';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useStudyStore } from '../stores/useStudyStore';
import { useEditalStore } from '../stores/useEditalStore';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import PremiumFeatureWrapper from './PremiumFeatureWrapper';
import { useUnifiedStreak } from '../utils/unifiedStreakCalculator';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, LabelList } from 'recharts';
import { subDays, format } from 'date-fns';
import { ActivityHeatmap } from './ActivityHeatmap';
import { PeakHoursChart } from './PeakHoursChart';
import { TopicPerformance } from './TopicPerformance';

const formatStudyDuration = (minutes: number) => {
    const totalMinutes = Math.max(0, Math.round(minutes ?? 0));
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const hours = Math.floor(totalMinutes / 60);
    const remaining = totalMinutes % 60;
    if (remaining === 0) return `${hours}h`;
    return `${hours}h ${remaining}min`;
};

const MetricCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; color: string; }> = ({ icon: Icon, title, value, color }) => (
    <Card className="border-border shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={`w-5 h-5 ${color}`} />
        </CardHeader>
        <CardContent>
            <div className="text-3xl font-bold text-foreground">{value}</div>
        </CardContent>
    </Card>
);

const Estatisticas: React.FC = () => {
    // --- Data Hooks ---
    const { editalAtivo } = useEditalStore();
    const todasSessoes = useEstudosStore(state => state.sessoes);
    const { getAverageProgress, findTopicById, disciplinas } = useDisciplinasStore();
    const todasRevisoes = useRevisoesStore(state => state.revisoes);
    const todosErros = useCadernoErrosStore(state => state.erros);
    const todosSimulados = useStudyStore(state => state.simulations);
    const { streak } = useUnifiedStreak();
    const { planType } = useSubscriptionStore();

    // Filtrar dados por studyPlanId para mostrar apenas do edital ativo
    const sessoes = editalAtivo?.id
        ? todasSessoes.filter(s => s.studyPlanId === editalAtivo.id)
        : [];
    const revisoes = editalAtivo?.id
        ? todasRevisoes.filter(r => r.studyPlanId === editalAtivo.id)
        : [];
    const erros = editalAtivo?.id
        ? todosErros.filter(e => e.studyPlanId === editalAtivo.id)
        : [];
    const simulados = editalAtivo?.id
        ? todosSimulados.filter(s => s.studyPlanId === editalAtivo.id)
        : [];

    // --- Memoized Calculations ---

    const generalStats = useMemo(() => {
        const totalMinutosEstudo = sessoes.reduce((acc, s) => acc + (s.tempo_estudado / 60), 0);
        const totalMinutosSimulado = simulados.reduce((acc, s) => acc + s.duration_minutes, 0);
        const totalMinutos = totalMinutosEstudo + totalMinutosSimulado;

        const totalSessoes = sessoes.length;
        const totalAtividades = totalSessoes + simulados.length;
        const mediaSessao = totalAtividades > 0 ? totalMinutos / totalAtividades : 0;
        const progressoEdital = getAverageProgress();

        return {
            totalHorasEstudo: formatStudyDuration(totalMinutos),
            mediaSessao: `${mediaSessao.toFixed(0)} min`,
            progressoEdital: `${progressoEdital.toFixed(0)}%`,
            totalSessoes: totalAtividades,
        };
    }, [sessoes, simulados, getAverageProgress]);

    const performanceStats = useMemo(() => {
        const totalRevisoes = revisoes.length;
        const revisoesConcluidas = revisoes.filter(r => r.status === 'concluida').length;
        const taxaRevisao = totalRevisoes > 0 ? Math.round((revisoesConcluidas / totalRevisoes) * 100) : 0;

        const totalErros = erros.length;
        const errosResolvidos = erros.filter(e => e.resolvido).length;
        const taxaResolucaoErros = totalErros > 0 ? Math.round((errosResolvidos / totalErros) * 100) : 0;

        const totalAcertosSimulados = simulados.reduce((acc, s) => acc + s.correct, 0);
        const totalQuestoesSimulados = simulados.reduce((acc, s) => acc + s.correct + s.wrong + (s.blank || 0), 0);
        const mediaAcertosSimulados = totalQuestoesSimulados > 0 ? Math.round((totalAcertosSimulados / totalQuestoesSimulados) * 100) : 0;

        // Estatísticas de Questões (Sessões + Simulados)
        const sessoesComQuestoes = sessoes.filter(s => {
            const certas = s.questoes_certas || 0;
            const erradas = s.questoes_erradas || 0;
            return (certas + erradas) > 0;
        });

        const totalCertasSessoes = sessoesComQuestoes.reduce((acc, s) => acc + (s.questoes_certas || 0), 0);
        const totalErradasSessoes = sessoesComQuestoes.reduce((acc, s) => acc + (s.questoes_erradas || 0), 0);

        const totalCertasGeral = totalCertasSessoes + totalAcertosSimulados;
        const totalErradasGeral = totalErradasSessoes + simulados.reduce((acc, s) => acc + s.wrong, 0);
        const totalQuestoesGeral = totalCertasGeral + totalErradasGeral + simulados.reduce((acc, s) => acc + (s.blank || 0), 0);

        const taxaAcertoGeral = totalQuestoesGeral > 0 ? Math.round((totalCertasGeral / totalQuestoesGeral) * 100) : 0;

        // Saldo Líquido (Considerando Cebraspe)
        const saldoLiquidoSessoes = sessoesComQuestoes.reduce((acc, s) => {
            const certas = s.questoes_certas || 0;
            const erradas = s.questoes_erradas || 0;
            if (s.is_cebraspe) {
                return acc + Math.max(0, certas - erradas);
            }
            return acc + certas;
        }, 0);

        // Para simulados, assumimos que o saldo é calculado se for Cebraspe
        const saldoLiquidoSimulados = simulados.reduce((acc, s) => {
            if (s.is_cebraspe) {
                return acc + Math.max(0, s.correct - s.wrong);
            }
            return acc + s.correct;
        }, 0);

        const saldoLiquidoTotal = saldoLiquidoSessoes + saldoLiquidoSimulados;

        // Agrupamento por Disciplina
        const statsPorDisciplina: Record<string, {
            nome: string,
            certas: number,
            erradas: number,
            saldo: number,
            total: number
        }> = {};

        sessoesComQuestoes.forEach(sessao => {
            // Encontrar a disciplina do tópico
            const disciplina = disciplinas.find(d => d.topicos.some(t => t.id === sessao.topico_id));
            const nomeDisciplina = disciplina ? disciplina.nome : 'Outros';

            if (!statsPorDisciplina[nomeDisciplina]) {
                statsPorDisciplina[nomeDisciplina] = { nome: nomeDisciplina, certas: 0, erradas: 0, saldo: 0, total: 0 };
            }

            const certas = sessao.questoes_certas || 0;
            const erradas = sessao.questoes_erradas || 0;
            const saldo = sessao.is_cebraspe ? Math.max(0, certas - erradas) : certas;

            statsPorDisciplina[nomeDisciplina].certas += certas;
            statsPorDisciplina[nomeDisciplina].erradas += erradas;
            statsPorDisciplina[nomeDisciplina].total += (certas + erradas);
            statsPorDisciplina[nomeDisciplina].saldo += saldo;
        });

        // Adicionar estatísticas de simulados
        simulados.forEach(sim => {
            const nomeDisciplina = 'Simulados';

            if (!statsPorDisciplina[nomeDisciplina]) {
                statsPorDisciplina[nomeDisciplina] = { nome: nomeDisciplina, certas: 0, erradas: 0, saldo: 0, total: 0 };
            }

            const certas = sim.correct || 0;
            const erradas = sim.wrong || 0;
            const saldo = sim.is_cebraspe ? Math.max(0, certas - erradas) : certas;

            statsPorDisciplina[nomeDisciplina].certas += certas;
            statsPorDisciplina[nomeDisciplina].erradas += erradas;
            statsPorDisciplina[nomeDisciplina].total += (certas + erradas + (sim.blank || 0));
            statsPorDisciplina[nomeDisciplina].saldo += saldo;
        });

        // Converter para array e ordenar por total de questões
        const detalhamentoDisciplinas = Object.values(statsPorDisciplina).sort((a, b) => b.total - a.total);

        return {
            taxaRevisao: `${taxaRevisao}%`,
            taxaResolucaoErros: `${taxaResolucaoErros}%`,
            mediaAcertosSimulados: `${mediaAcertosSimulados}%`,
            totalQuestoesResolvidas: totalQuestoesGeral,
            taxaAcertoGeral: `${taxaAcertoGeral}%`,
            saldoLiquidoTotal: saldoLiquidoTotal,
            detalhamentoDisciplinas,
        };
    }, [revisoes, erros, simulados, sessoes, disciplinas]);

    const studyTimeDistribution = useMemo(() => {
        const tempoPorDisciplina: Record<string, number> = {};
        sessoes.forEach(sessao => {
            const topicoInfo = findTopicById(sessao.topico_id);
            const nomeDisciplina = topicoInfo?.disciplina.nome || 'Estudo Livre';
            const tempoMinutos = sessao.tempo_estudado / 60;
            tempoPorDisciplina[nomeDisciplina] = (tempoPorDisciplina[nomeDisciplina] || 0) + tempoMinutos;
        });

        const tempoSimulados = simulados.reduce((acc, s) => acc + s.duration_minutes, 0);
        if (tempoSimulados > 0) {
            tempoPorDisciplina['Simulados'] = tempoSimulados;
        }

        return Object.entries(tempoPorDisciplina)
            .map(([name, value]) => ({ name, value: Math.round(value) }))
            .sort((a, b) => b.value - a.value);
    }, [sessoes, simulados, findTopicById]);

    const dailyPerformanceLast30Days = useMemo(() => {
        const hoje = new Date();
        const dias = Array.from({ length: 30 }, (_, i) => subDays(hoje, 29 - i));
        return dias.map(dia => {
            const diaStr = dia.toDateString();
            const sessoesDoDia = sessoes.filter(s => new Date(s.data_estudo).toDateString() === diaStr);
            const tempoEstudoMinutos = Math.round(sessoesDoDia.reduce((acc, s) => acc + s.tempo_estudado, 0) / 60);

            const simuladosDoDia = simulados.filter(s => new Date(s.date).toDateString() === diaStr);
            const tempoSimuladoMinutos = simuladosDoDia.reduce((acc, s) => acc + s.duration_minutes, 0);

            return {
                name: format(dia, 'dd/MM'),
                'Tempo (min)': tempoEstudoMinutos + tempoSimuladoMinutos,
            };
        });
    }, [sessoes, simulados]);

    const simulationTrend = useMemo(() => {
        return simulados
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map(sim => {
                const total = sim.correct + sim.wrong + (sim.blank || 0);
                return {
                    name: format(new Date(sim.date), 'dd/MM'),
                    'Acertos (%)': total > 0 ? Math.round((sim.correct / total) * 100) : 0,
                };
            });
    }, [simulados]);


    const COLORS = ['#3B82F6', '#22C55E', '#F97316', '#A855F7', '#EC4899', '#6366F1', '#F59E0B'];

    return (
        <div data-tutorial="estatisticas-content" className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-foreground">Estatísticas</h1>
                <p className="text-muted-foreground mt-1">Analise seu desempenho e otimize sua rotina de estudos.</p>
            </header>

            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <TargetIcon className="w-5 h-5 text-primary" />
                    Visão Geral
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
                    <MetricCard icon={ClockIcon} title="Tempo Total" value={generalStats.totalHorasEstudo} color="text-primary" />
                    <MetricCard icon={TrophyIcon} title="Progresso" value={generalStats.progressoEdital} color="text-secondary" />
                    <MetricCard icon={FlameIcon} title="Sequência" value={`${streak} dias`} color="text-orange-500" />
                    <MetricCard icon={BookCopyIcon} title="Atividades" value={generalStats.totalSessoes} color="text-purple-500" />
                    <MetricCard icon={CheckCircle2Icon} title="Questões" value={performanceStats.totalQuestoesResolvidas} color="text-indigo-500" />
                    <MetricCard icon={TrendingUpIcon} title="Acerto Geral" value={performanceStats.taxaAcertoGeral} color="text-emerald-500" />
                    <MetricCard icon={BookOpenCheckIcon} title="Taxa Revisão" value={performanceStats.taxaRevisao} color="text-blue-500" />
                    <MetricCard icon={FileTextIcon} title="Média Simulados" value={performanceStats.mediaAcertosSimulados} color="text-green-500" />
                </div>
            </section>


            <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BarChart3Icon className="w-5 h-5 text-primary" />
                    Disciplinas x Horas de Estudo
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><LayersIcon className="w-5 h-5 text-emerald-500" /> Tempo por Disciplina</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PremiumFeatureWrapper
                                isLocked={planType === 'free'}
                                requiredPlan="pro"
                                feature="Descubra onde seu tempo está sendo mal distribuído"
                                showPreview={true}
                            >
                                {studyTimeDistribution.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={studyTimeDistribution}
                                            layout="vertical"
                                            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                                            barSize={32}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--color-border)" opacity={0.5} />
                                            <XAxis
                                                type="number"
                                                stroke="var(--color-muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => formatStudyDuration(value)}
                                            />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                stroke="var(--color-muted-foreground)"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                width={140}
                                                tick={({ x, y, payload }) => (
                                                    <g transform={`translate(${0},${y})`}>
                                                        <text x={0} y={0} dy={4} textAnchor="start" fill="var(--color-muted-foreground)" fontSize={12} className="font-medium">
                                                            {payload.value.length > 25 ? `${payload.value.substring(0, 25)}...` : payload.value}
                                                        </text>
                                                    </g>
                                                )}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'var(--color-accent)', opacity: 0.2 }}
                                                contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)', borderRadius: '8px' }}
                                                itemStyle={{ color: 'var(--color-foreground)' }}
                                                formatter={(value: number) => formatStudyDuration(value)}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="var(--color-primary)"
                                                radius={[0, 4, 4, 0]}
                                                background={{ fill: 'var(--color-muted)', opacity: 0.2, radius: [0, 4, 4, 0] }}
                                            >
                                                <LabelList
                                                    dataKey="value"
                                                    position="insideRight"
                                                    fill="white"
                                                    formatter={(value: number) => formatStudyDuration(value)}
                                                    style={{ fontSize: '12px', fontWeight: 'bold' }}
                                                />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[400px] text-center text-muted-foreground text-sm gap-2">
                                        <LayersIcon className="w-10 h-10 opacity-20" />
                                        <p>Nenhum estudo registrado ainda.</p>
                                    </div>
                                )}
                            </PremiumFeatureWrapper>
                        </CardContent>
                    </Card>

                    <Card className="border-border shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5 text-emerald-500" /> Mapa de Atividades (Últimos 3 meses)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <PremiumFeatureWrapper
                                isLocked={planType === 'free'}
                                requiredPlan="pro"
                                feature="Visualize seus dias mais produtivos em segundos"
                                showPreview={true}
                            >
                                <ActivityHeatmap sessoes={sessoes} />
                            </PremiumFeatureWrapper>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3Icon className="w-5 h-5 text-primary" /> Desempenho Diário (30 dias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PremiumFeatureWrapper
                            isLocked={planType === 'free'}
                            requiredPlan="pro"
                            feature="Identifique quedas de rendimento antes que virem hábito"
                            showPreview={true}
                        >
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={dailyPerformanceLast30Days}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                                    <Tooltip
                                        cursor={{ fill: 'var(--color-primary-a, rgba(59, 130, 246, 0.1))' }}
                                        contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                                        itemStyle={{ color: 'var(--color-foreground)' }}
                                    />
                                    <Bar dataKey="Tempo (min)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </PremiumFeatureWrapper>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TargetIcon className="w-5 h-5 text-purple-500" /> Desempenho por Tópico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PremiumFeatureWrapper
                            isLocked={planType === 'free'}
                            requiredPlan="pro"
                            feature="Pare de revisar o que você já domina"
                            showPreview={true}
                        >
                            <TopicPerformance sessoes={sessoes} disciplinas={disciplinas} />
                        </PremiumFeatureWrapper>
                    </CardContent>
                </Card>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LayersIcon className="w-5 h-5 text-primary" /> Foco por Disciplina</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PremiumFeatureWrapper
                            isLocked={planType === 'free'}
                            requiredPlan="pro"
                            feature="Veja exatamente no que você mais investe tempo"
                            showPreview={true}
                        >
                            {studyTimeDistribution.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie data={studyTimeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                            {studyTimeDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                                            itemStyle={{ color: 'var(--color-foreground)' }}
                                            formatter={(value: number) => `${formatStudyDuration(value)}`}
                                        />
                                        <Legend iconSize={10} wrapperStyle={{ fontSize: '0.7rem', paddingTop: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground text-sm">
                                    Nenhum estudo registrado.
                                </div>
                            )}
                        </PremiumFeatureWrapper>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ClockIcon className="w-5 h-5 text-blue-500" /> Horários de Pico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PremiumFeatureWrapper
                            isLocked={planType === 'free'}
                            requiredPlan="pro"
                            feature="Descubra seu horário de ouro para estudar"
                            showPreview={true}
                        >
                            <PeakHoursChart sessoes={sessoes} />
                        </PremiumFeatureWrapper>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-primary" /> Tendência de Simulados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PremiumFeatureWrapper
                            isLocked={planType === 'free'}
                            requiredPlan="pro"
                            feature="Acompanhe sua evolução real em provas"
                            showPreview={true}
                        >
                            {simulationTrend.length > 1 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={simulationTrend}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                        <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                                        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} unit="%" domain={[0, 100]} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
                                            itemStyle={{ color: 'var(--color-foreground)' }}
                                        />
                                        <Legend wrapperStyle={{ fontSize: '0.8rem' }} />
                                        <Line type="monotone" dataKey="Acertos (%)" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground text-sm">
                                    {simulados.length > 0 ? "Registre mais simulados." : "Nenhum simulado."}
                                </div>
                            )}
                        </PremiumFeatureWrapper>
                    </CardContent>
                </Card>
            </section>

            {performanceStats.detalhamentoDisciplinas.length > 0 && (
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <LayersIcon className="w-5 h-5 text-primary" />
                        Detalhamento por Disciplina
                    </h2>
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-4 py-3">Disciplina</th>
                                        <th className="px-4 py-3 text-center">Questões</th>
                                        <th className="px-4 py-3 text-center text-green-600 dark:text-green-400">Certas</th>
                                        <th className="px-4 py-3 text-center text-red-600 dark:text-red-400">Erradas</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aproveitamento
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Aprov. Líquido
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Saldo
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {performanceStats.detalhamentoDisciplinas.map((d, i) => {
                                        const aproveitamento = d.total > 0 ? Math.round((d.certas / d.total) * 100) : 0;
                                        return (
                                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                <td className="px-4 py-3 font-medium">{d.nome}</td>
                                                <td className="px-4 py-3 text-center">{d.total}</td>
                                                <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-medium">{d.certas}</td>
                                                <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-medium">{d.erradas}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${aproveitamento >= 80 ? 'bg-green-500' :
                                                                    aproveitamento >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                                    }`}
                                                                style={{ width: `${aproveitamento}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs">{aproveitamento}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className={`text-xs font-bold ${d.total > 0 ? (Math.round((d.saldo / d.total) * 100) >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-500'}`}>
                                                            {d.total > 0 ? Math.round((d.saldo / d.total) * 100) : 0}%
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center whitespace-nowrap">
                                                    <span className="text-sm font-bold text-amber-500">{d.saldo}</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};

export default Estatisticas;