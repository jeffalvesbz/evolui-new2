import React, { useMemo } from 'react';
import {
    SparklesIcon,
    RepeatIcon,
    CalendarClockIcon,
    FootprintsIcon,
    PlayIcon,
    TargetIcon,
    PlusCircleIcon,
    BookCopyIcon,
    LayersIcon,
    ArrowRightIcon,
} from './icons';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { useDailyGoalStore } from '../stores/useDailyGoalStore';
import { useModalStore } from '../stores/useModalStore';
import { startOfDay, isSameDay } from 'date-fns';
import { toast } from './Sonner';
import { Progress } from '../lib/dashboardMocks';
import { getLocalDateISO } from '../utils/dateUtils';
import type { SessaoCiclo } from '../types';

interface QuickActionsSidebarProps {
    setActiveView: (view: string) => void;
}

const formatStudyDuration = (minutes: number) => {
    const totalMinutes = Math.max(0, Math.round(minutes ?? 0));
    const hours = Math.floor(totalMinutes / 60);
    const remaining = totalMinutes % 60;
    if (hours <= 0) return `${remaining} min`;
    if (remaining === 0) return `${hours}h`;
    return `${hours}h ${remaining}min`;
};

const QuickActionCard: React.FC<{ children: React.ReactNode, title: string, icon: React.ReactNode }> = ({ children, title, icon }) => (
    <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-xl">
        <header className="p-4 border-b border-white/10 flex items-center gap-3">
            {icon}
            <h3 className="font-bold text-sm text-foreground">{title}</h3>
        </header>
        <div className="p-4">
            {children}
        </div>
    </div>
);

const ProximoPasso: React.FC<{ setActiveView: (view: string) => void }> = ({ setActiveView }) => {
    const { getCicloAtivo, ultimaSessaoConcluidaId } = useCiclosStore();
    const revisoes = useRevisoesStore((state) => state.revisoes);
    const { trilha, iniciarSessao } = useEstudosStore();
    const { disciplinas, findTopicById } = useDisciplinasStore();
    const disciplinasMap = useMemo(() => new Map(disciplinas.map(d => [d.id, d])), [disciplinas]);

    const proximaAcao = useMemo(() => {
        // 1. Prioridade: Ciclo de Estudos
        const cicloAtivo = getCicloAtivo();
        if (cicloAtivo && cicloAtivo.sessoes.length > 0) {
            const sessoesOrdenadas = [...cicloAtivo.sessoes].sort((a, b) => a.ordem - b.ordem);
            // FIX: Add explicit type to 'proximaSessaoCiclo' to resolve 'unknown' type error.
            let proximaSessaoCiclo: SessaoCiclo | undefined;

            if (!ultimaSessaoConcluidaId) {
                proximaSessaoCiclo = sessoesOrdenadas[0];
            } else {
                const ultimoIndice = sessoesOrdenadas.findIndex(s => s.id === ultimaSessaoConcluidaId);
                proximaSessaoCiclo = sessoesOrdenadas[(ultimoIndice + 1) % sessoesOrdenadas.length];
            }

            if (proximaSessaoCiclo) {
                const disciplina = disciplinasMap.get(proximaSessaoCiclo.disciplina_id);
                if (disciplina) {
                    return {
                        icon: <RepeatIcon className="w-5 h-5 text-primary" />,
                        title: 'Próximo do Ciclo',
                        description: <>Sua próxima matéria é <strong>{disciplina.nome}</strong>.</>,
                        onAction: () => {
                            iniciarSessao({ id: `ciclo-${proximaSessaoCiclo!.id}`, nome: disciplina.nome, disciplinaId: disciplina.id });
                            toast.success(`Iniciando estudos de ${disciplina.nome}!`);
                        },
                        buttonText: 'Começar a estudar',
                        buttonIcon: <PlayIcon className="w-4 h-4" />,
                    };
                }
            }
        }

        // 2. Prioridade: Revisões do Dia
        const hoje = startOfDay(new Date());
        const pendentesHoje = revisoes.filter(r => r.status === 'pendente' && isSameDay(new Date(r.data_prevista), hoje));
        if (pendentesHoje.length > 0) {
            return {
                icon: <CalendarClockIcon className="w-5 h-5 text-primary" />,
                title: 'Revisões Pendentes',
                description: <>Você tem <strong>{pendentesHoje.length} revisões</strong> para hoje.</>,
                onAction: () => setActiveView('revisoes'),
                buttonText: 'Ver Revisões',
                buttonIcon: <ArrowRightIcon className="w-4 h-4" />
            };
        }

        // 3. Prioridade: Trilha Semanal
        const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
        const diaAtual = dias[new Date().getDay()] as keyof typeof trilha;
        const topicosDoDiaIds = trilha[diaAtual] || [];
        const primeiroTopicoNaoConcluido = topicosDoDiaIds
            .map(id => findTopicById(id))
            .find(info => info && !info.topico.concluido);

        if (primeiroTopicoNaoConcluido) {
            const { topico, disciplina } = primeiroTopicoNaoConcluido;
            return {
                icon: <FootprintsIcon className="w-5 h-5 text-primary" />,
                title: 'Foco da Trilha',
                description: <>Sua trilha sugere estudar <strong>{topico.titulo}</strong>.</>,
                onAction: () => iniciarSessao({ id: topico.id, nome: topico.titulo, disciplinaId: disciplina.id }, 'cronometro', {
                    origemTrilha: true
                }),
                buttonText: 'Iniciar Tópico',
                buttonIcon: <PlayIcon className="w-4 h-4" />,
            };
        }

        return null;
    }, [getCicloAtivo, ultimaSessaoConcluidaId, disciplinasMap, revisoes, trilha, findTopicById, iniciarSessao, setActiveView]);

    if (!proximaAcao) {
        return (
            <div className="text-center p-4">
                <p className="font-semibold text-foreground">Tudo em dia!</p>
                <p className="text-sm text-muted-foreground">Você está em dia com suas tarefas planejadas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{proximaAcao.description}</p>
            <button
                onClick={proximaAcao.onAction}
                className="w-full h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
                {proximaAcao.buttonIcon}
                {proximaAcao.buttonText}
            </button>
        </div>
    );
};

const ResumoDia: React.FC = () => {
    const sessoes = useEstudosStore(state => state.sessoes);
    const goalMinutes = useDailyGoalStore(state => state.goalMinutes);

    const tempoTotalHoje = useMemo(() => {
        const hojeISO = getLocalDateISO();
        const sessoesDeHoje = sessoes.filter(s => s.data_estudo === hojeISO);
        return Math.round(sessoesDeHoje.reduce((acc, s) => acc + s.tempo_estudado, 0) / 60);
    }, [sessoes]);

    const metaPercentual = goalMinutes > 0 ? Math.round((tempoTotalHoje / goalMinutes) * 100) : 0; // Permite valores acima de 100%

    return (
        <div className="space-y-4">
            <div>
                <div className="flex justify-between text-xs font-medium text-muted-foreground mb-1">
                    <span>Meta Diária</span>
                    <span>{metaPercentual}%</span>
                </div>
                <Progress value={metaPercentual} />
            </div>
            <div className="flex justify-between items-center text-sm p-3 bg-muted/30 rounded-lg">
                <span className="font-semibold text-muted-foreground">Tempo Hoje</span>
                <span className="font-bold text-foreground">{formatStudyDuration(tempoTotalHoje)}</span>
            </div>
        </div>
    );
};

const AdicionarRapido: React.FC = () => {
    const { abrirModalEstudoManual } = useEstudosStore();
    const { openErroModal, openCriarFlashcardModal } = useModalStore();

    const actions = [
        { label: "Estudo Manual", icon: <PlusCircleIcon className="w-4 h-4" />, action: abrirModalEstudoManual },
        { label: "Registrar Erro", icon: <BookCopyIcon className="w-4 h-4" />, action: () => openErroModal() },
        { label: "Criar Flashcard", icon: <LayersIcon className="w-4 h-4" />, action: () => openCriarFlashcardModal() },
    ];

    return (
        <div className="space-y-2">
            {actions.map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 p-3 text-sm font-semibold rounded-lg hover:bg-muted/50 transition-colors">
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};


const QuickActionsSidebar: React.FC<QuickActionsSidebarProps> = ({ setActiveView }) => {
    return (
        <aside className="w-72 bg-card/40 backdrop-blur-xl border-l border-white/10 flex-shrink-0 hidden lg:flex flex-col">
            <div className="flex items-center space-x-3 p-5 h-[73px] border-b border-white/10 flex-shrink-0">
                <h2 className="text-base font-bold text-foreground tracking-wider">Ações Rápidas</h2>
            </div>
            <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto">
                <QuickActionCard title="Próximo Passo Inteligente" icon={<SparklesIcon className="w-5 h-5 text-primary" />}>
                    <ProximoPasso setActiveView={setActiveView} />
                </QuickActionCard>
                <QuickActionCard title="Resumo do Dia" icon={<TargetIcon className="w-5 h-5 text-primary" />}>
                    <ResumoDia />
                </QuickActionCard>
                <QuickActionCard title="Adicionar Rápido" icon={<PlusCircleIcon className="w-5 h-5 text-primary" />}>
                    <AdicionarRapido />
                </QuickActionCard>
            </div>
        </aside>
    );
};

export default QuickActionsSidebar;
