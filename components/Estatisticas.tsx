

import React, { useMemo } from 'react';
import {
    BarChart3Icon,
    TrendingUpIcon,
    BookOpenCheckIcon,
    AlertTriangleIcon,
    ClockIcon,
    TrophyIcon,
    FlameIcon,
    LayersIcon,
    BookCopyIcon,
    FileTextIcon,
} from './icons';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useStudyStore } from '../stores/useStudyStore';
import { useEditalStore } from '../stores/useEditalStore';
import { useUnifiedStreak } from '../utils/unifiedStreakCalculator';
import { Card, CardHeader, CardContent, CardTitle } from './ui/Card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
import { subDays, format } from 'date-fns';

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
    const { getAverageProgress, findTopicById } = useDisciplinasStore();
    const todasRevisoes = useRevisoesStore(state => state.revisoes);
    const todosErros = useCadernoErrosStore(state => state.erros);
    const todosSimulados = useStudyStore(state => state.simulations);
    const { streak } = useUnifiedStreak();

    // ✅ Corrigido: Filtrar dados por studyPlanId para mostrar apenas do edital ativo
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
        const totalMinutosSimulado = simulados.reduce((acc, s) => acc + s.durationMinutes, 0);
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

        return {
            taxaRevisao: `${taxaRevisao}%`,
            taxaResolucaoErros: `${taxaResolucaoErros}%`,
            mediaAcertosSimulados: `${mediaAcertosSimulados}%`,
        };
    }, [revisoes, erros, simulados]);

    const studyTimeDistribution = useMemo(() => {
        const tempoPorDisciplina: Record<string, number> = {};
        sessoes.forEach(sessao => {
            const topicoInfo = findTopicById(sessao.topico_id);
            const nomeDisciplina = topicoInfo?.disciplina.nome || 'Estudo Livre';
            const tempoMinutos = sessao.tempo_estudado / 60;
            tempoPorDisciplina[nomeDisciplina] = (tempoPorDisciplina[nomeDisciplina] || 0) + tempoMinutos;
        });
        
        const tempoSimulados = simulados.reduce((acc, s) => acc + s.durationMinutes, 0);
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
            const tempoSimuladoMinutos = simuladosDoDia.reduce((acc, s) => acc + s.durationMinutes, 0);

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

            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard icon={ClockIcon} title="Tempo Total de Atividades" value={generalStats.totalHorasEstudo} color="text-primary" />
                <MetricCard icon={TrophyIcon} title="Progresso do Edital" value={generalStats.progressoEdital} color="text-secondary" />
                <MetricCard icon={FlameIcon} title="Dias Seguidos" value={`${streak} dias`} color="text-orange-500" />
                <MetricCard icon={BookCopyIcon} title="Total de Atividades" value={generalStats.totalSessoes} color="text-purple-500" />
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BarChart3Icon className="w-5 h-5 text-primary"/> Desempenho Diário (Últimos 30 dias)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={dailyPerformanceLast30Days}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}m`} />
                                <Tooltip
                                    cursor={{ fill: 'var(--color-primary-a, rgba(59, 130, 246, 0.1))' }}
                                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }}
                                />
                                <Bar dataKey="Tempo (min)" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><LayersIcon className="w-5 h-5 text-primary"/> Foco por Disciplina</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {studyTimeDistribution.length > 0 ? (
                             <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={studyTimeDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                                        {studyTimeDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} formatter={(value: number) => `${formatStudyDuration(value)}`} />
                                    <Legend iconSize={10} wrapperStyle={{fontSize: '0.8rem', paddingTop: '10px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                             <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground text-sm">
                                Nenhum estudo registrado para exibir o foco por disciplina.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
            
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="border-border shadow-md lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><TrendingUpIcon className="w-5 h-5 text-primary"/> Desempenho em Simulados</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {simulationTrend.length > 1 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={simulationTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                                    <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={12} />
                                    <YAxis stroke="var(--color-muted-foreground)" fontSize={12} unit="%" domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)' }} />
                                    <Legend wrapperStyle={{fontSize: '0.8rem'}}/>
                                    <Line type="monotone" dataKey="Acertos (%)" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[300px] text-center text-muted-foreground text-sm">
                                {simulados.length > 0 ? "Registre mais simulados para ver a tendência." : "Nenhum simulado registrado."}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <MetricCard icon={BookOpenCheckIcon} title="Taxa de Revisão" value={performanceStats.taxaRevisao} color="text-blue-500" />
                    <MetricCard icon={AlertTriangleIcon} title="Resolução de Erros" value={performanceStats.taxaResolucaoErros} color="text-yellow-500" />
                    <MetricCard icon={FileTextIcon} title="Média em Simulados" value={performanceStats.mediaAcertosSimulados} color="text-green-500" />
                </div>
            </section>
        </div>
    );
};

export default Estatisticas;