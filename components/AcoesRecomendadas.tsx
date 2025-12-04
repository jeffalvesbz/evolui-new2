import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  RepeatIcon,
  CalendarClockIcon,
  FootprintsIcon,
  BookCopyIcon,
  PlayIcon,
  ArrowRightIcon,
  SparklesIcon,
} from './icons';
import { useCiclosStore } from '../stores/useCiclosStore';
import { useRevisoesStore } from '../stores/useRevisoesStore';
import { useEstudosStore } from '../stores/useEstudosStore';
import { useCadernoErrosStore } from '../stores/useCadernoErrosStore';
import { useDisciplinasStore } from '../stores/useDisciplinasStore';
import { SectionHeader } from '../lib/dashboardMocks';
// FIX: Changed date-fns imports to named imports to resolve module export errors.
<<<<<<< HEAD
import { startOfDay, isSameDay, isBefore } from 'date-fns';
=======
import { startOfDay, isSameDay } from 'date-fns';
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
import { toast } from './Sonner';
import type { SessaoCiclo } from '../types';

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
  buttonText: string;
  onAction: () => void;
  buttonIcon?: React.ReactNode;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, description, buttonText, onAction, buttonIcon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
<<<<<<< HEAD
    className="bg-card border border-border p-5 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-lg"
=======
    className="glass-card p-5 rounded-xl flex flex-col justify-between hover:border-primary/50 transition-colors"
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
  >
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
        <h3 className="font-bold text-foreground">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
    <button
      onClick={onAction}
      className="mt-4 w-full h-9 flex items-center justify-center gap-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
    >
      {buttonIcon || <PlayIcon className="w-4 h-4" />}
      {buttonText}
    </button>
  </motion.div>
);

interface AcoesRecomendadasProps {
  setActiveView: (view: string) => void;
}

const AcoesRecomendadas: React.FC<AcoesRecomendadasProps> = ({ setActiveView }) => {
  const { getCicloAtivo } = useCiclosStore();
  const revisoes = useRevisoesStore((state) => state.revisoes);
  const { trilha, sessoes, iniciarSessao } = useEstudosStore();
  const erros = useCadernoErrosStore((state) => state.erros);
  const { disciplinas, findTopicById } = useDisciplinasStore();
  const disciplinasMap = useMemo(() => new Map(disciplinas.map(d => [d.id, d])), [disciplinas]);

  // 1. Ação do Ciclo de Estudos
  const cicloAction = useMemo(() => {
    const cicloAtivo = getCicloAtivo();
    if (!cicloAtivo || cicloAtivo.sessoes.length === 0) return null;

    const sessoesDoCiclo = sessoes.filter(sessao => {
<<<<<<< HEAD
      const topicInfo = findTopicById(sessao.topico_id);
      return cicloAtivo.sessoes.some(s => s.disciplina_id === topicInfo?.disciplina.id);
    }).sort((a, b) => new Date(b.data_estudo).getTime() - new Date(a.data_estudo).getTime());

    // FIX: Explicitly type `proximaSessaoCiclo` to avoid `unknown` type errors.
    let proximaSessaoCiclo: SessaoCiclo | undefined;
    if (sessoesDoCiclo.length > 0) {
      const ultimaSessaoEstudada = sessoesDoCiclo[0];
      const ultimoTopico = findTopicById(ultimaSessaoEstudada.topico_id);
      const ultimoIndice = cicloAtivo.sessoes.findIndex(s => s.disciplina_id === ultimoTopico?.disciplina.id);
      proximaSessaoCiclo = cicloAtivo.sessoes[(ultimoIndice + 1) % cicloAtivo.sessoes.length];
    } else {
      proximaSessaoCiclo = cicloAtivo.sessoes[0];
    }

    if (!proximaSessaoCiclo) return null;

=======
        const topicInfo = findTopicById(sessao.topico_id);
        return cicloAtivo.sessoes.some(s => s.disciplina_id === topicInfo?.disciplina.id);
    }).sort((a,b) => new Date(b.data_estudo).getTime() - new Date(a.data_estudo).getTime());
    
    // FIX: Explicitly type `proximaSessaoCiclo` to avoid `unknown` type errors.
    let proximaSessaoCiclo: SessaoCiclo | undefined;
    if(sessoesDoCiclo.length > 0) {
        const ultimaSessaoEstudada = sessoesDoCiclo[0];
        const ultimoTopico = findTopicById(ultimaSessaoEstudada.topico_id);
        const ultimoIndice = cicloAtivo.sessoes.findIndex(s => s.disciplina_id === ultimoTopico?.disciplina.id);
        proximaSessaoCiclo = cicloAtivo.sessoes[(ultimoIndice + 1) % cicloAtivo.sessoes.length];
    } else {
        proximaSessaoCiclo = cicloAtivo.sessoes[0];
    }
    
    if(!proximaSessaoCiclo) return null;
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    const disciplina = disciplinasMap.get(proximaSessaoCiclo.disciplina_id);
    if (!disciplina) return null;

    return {
      id: 'ciclo',
      icon: <RepeatIcon className="w-5 h-5 text-primary" />,
      title: 'Próximo do Ciclo',
      description: <>Sua próxima matéria é <strong>{disciplina.nome}</strong>. Continue focado na sua rotação.</>,
      buttonText: 'Começar a estudar',
      onAction: () => {
        iniciarSessao({ id: `ciclo-${proximaSessaoCiclo!.id}`, nome: disciplina.nome, disciplinaId: disciplina.id });
        toast.success(`Iniciando estudos de ${disciplina.nome}!`);
      },
    };
  }, [getCicloAtivo, sessoes, findTopicById, disciplinasMap, iniciarSessao]);

<<<<<<< HEAD
  // 2. Ação de Revisões (prioriza atrasadas)
  const revisoesAction = useMemo(() => {
    const hoje = startOfDay(new Date());

    // Primeiro, verificar revisões atrasadas
    const atrasadas = revisoes.filter(r => {
      const dataPrevista = startOfDay(new Date(r.data_prevista));
      return (r.status === 'pendente' || r.status === 'atrasada') && isBefore(dataPrevista, hoje);
    });

    // Debug logging
    console.log('🔍 AcoesRecomendadas - Revisões Debug:', {
      totalRevisoes: revisoes.length,
      atrasadasCount: atrasadas.length,
      atrasadasData: atrasadas.map(r => ({
        id: r.id,
        status: r.status,
        data_prevista: r.data_prevista
      }))
    });

    if (atrasadas.length > 0) {
      return {
        id: 'revisoes-atrasadas',
        icon: <CalendarClockIcon className="w-5 h-5 text-red-500" />,
        title: '🚨 Revisões Atrasadas',
        description: <>Você tem <strong className="text-red-500">{atrasadas.length} {atrasadas.length === 1 ? 'revisão atrasada' : 'revisões atrasadas'}</strong>. Coloque-as em dia!</>,
        buttonText: 'Ver Revisões',
        buttonIcon: <ArrowRightIcon className="w-4 h-4" />,
        onAction: () => setActiveView('revisoes'),
      };
    }

    // Se não há atrasadas, verificar revisões de hoje
=======
  // 2. Ação de Revisões
  const revisoesAction = useMemo(() => {
    const hoje = startOfDay(new Date());
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    const pendentesHoje = revisoes.filter(r => r.status === 'pendente' && isSameDay(new Date(r.data_prevista), hoje));
    if (pendentesHoje.length === 0) return null;

    return {
      id: 'revisoes',
      icon: <CalendarClockIcon className="w-5 h-5 text-primary" />,
      title: 'Revisões do Dia',
      description: <>Você tem <strong>{pendentesHoje.length} revisões</strong> pendentes para hoje. Mantenha o conhecimento fresco.</>,
      buttonText: 'Ver Revisões',
      buttonIcon: <ArrowRightIcon className="w-4 h-4" />,
      onAction: () => setActiveView('revisoes'),
    };
  }, [revisoes, setActiveView]);

  // 3. Ação da Trilha Semanal
  const trilhaAction = useMemo(() => {
    const dias = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const diaAtual = dias[new Date().getDay()] as keyof typeof trilha;
    const topicosDoDiaIds = trilha[diaAtual] || [];
<<<<<<< HEAD

=======
    
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
    const primeiroTopicoNaoConcluido = topicosDoDiaIds
      .map(id => findTopicById(id))
      .find(info => info && !info.topico.concluido);

    if (!primeiroTopicoNaoConcluido) return null;

    const { topico, disciplina } = primeiroTopicoNaoConcluido;

    return {
      id: 'trilha',
      icon: <FootprintsIcon className="w-5 h-5 text-primary" />,
      title: 'Foco da Trilha',
      description: <>Sua trilha sugere estudar <strong>{topico.titulo}</strong>. Mantenha o planejamento.</>,
      buttonText: 'Iniciar Tópico',
      onAction: () => {
<<<<<<< HEAD
        iniciarSessao({ id: topico.id, nome: topico.titulo, disciplinaId: disciplina.id }, 'cronometro', {
          origemTrilha: true
        });
=======
        iniciarSessao({ id: topico.id, nome: topico.titulo, disciplinaId: disciplina.id });
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
      },
    };
  }, [trilha, findTopicById, iniciarSessao]);

<<<<<<< HEAD
  // const errosAction = useMemo(() => {
  //   const errosPendentes = erros.filter(e => !e.resolvido);
  //   if (errosPendentes.length === 0) return null;

  //   return {
  //     id: 'erros',
  //     icon: <BookCopyIcon className="w-5 h-5 text-primary" />,
  //     title: 'Caderno de Erros',
  //     description: <>Você tem <strong>{errosPendentes.length} erros</strong> não resolvidos. Revise-os para fortalecer seus pontos fracos.</>,
  //     buttonText: 'Revisar Erros',
  //     buttonIcon: <ArrowRightIcon className="w-4 h-4" />,
  //     onAction: () => setActiveView('erros'),
  //   };
  // }, [erros, setActiveView]);

  const actions = [cicloAction, revisoesAction, trilhaAction].filter((a): a is NonNullable<typeof a> => a !== null);
=======
  // 4. Ação do Caderno de Erros
  const errosAction = useMemo(() => {
    const errosPendentes = erros.filter(e => !e.resolvido);
    if (errosPendentes.length === 0) return null;

    return {
      id: 'erros',
      icon: <BookCopyIcon className="w-5 h-5 text-primary" />,
      title: 'Caderno de Erros',
      description: <>Você tem <strong>{errosPendentes.length} erros</strong> não resolvidos. Revise-os para fortalecer seus pontos fracos.</>,
      buttonText: 'Revisar Erros',
      buttonIcon: <ArrowRightIcon className="w-4 h-4" />,
      onAction: () => setActiveView('erros'),
    };
  }, [erros, setActiveView]);

  const actions = [cicloAction, revisoesAction, trilhaAction, errosAction].filter((a): a is NonNullable<typeof a> => a !== null);
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a

  return (
    <section className="space-y-4">
      <SectionHeader
        title="Ações Recomendadas"
        description="Sugestões inteligentes para sua próxima atividade de estudo."
      />
      {actions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map(action => (
            <ActionCard key={action.id} {...action} />
          ))}
        </div>
      ) : (
<<<<<<< HEAD
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-lg">
=======
        <div className="glass-card rounded-xl p-8 text-center">
>>>>>>> 35548216873afd5c7d5fd970e1e81f60d7a6705a
          <SparklesIcon className="w-12 h-12 text-secondary mx-auto mb-4" />
          <h3 className="font-bold text-lg text-foreground">Tudo em dia!</h3>
          <p className="text-muted-foreground mt-1">Você está em dia com suas tarefas planejadas. Que tal um estudo livre ou adicionar um novo tópico?</p>
        </div>
      )}
    </section>
  );
};

export default AcoesRecomendadas;